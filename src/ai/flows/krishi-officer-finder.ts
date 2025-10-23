'use server';

/**
 * Krishi Officer Finder (Gemini-assisted extractor)
 *
 * Flow overview:
 * 1. Use Google Custom Search JSON API (programmable search) to find candidate pages for the given Zila/Upazila.
 *    - Requires GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables.
 * 2. Fetch the top candidate pages and produce short, relevant snippets (HTML stripped).
 * 3. Send the collected snippets to the Google Gemini model via the repository `ai.generate` wrapper
 *    with a strict instruction: extract only values that are present in the snippets, do NOT invent anything,
 *    and return the structured JSON matching the Zod schema below.
 *
 * Notes:
 * - This design uses Gemini as an extraction/parser step (not as a primary data source). The flow still
 *   discovers pages via Google's search API (so we get real pages) and asks Gemini to reliably parse
 *   and consolidate the information present on those pages, with explicit instructions not to hallucinate.
 * - Environment variables required:
 *     GOOGLE_API_KEY  - for Programmable Search (Custom Search JSON API) and/or to call Google generative API if used that way
 *     GOOGLE_CSE_ID   - Custom Search Engine identifier (programmable search)
 *
 * If you prefer a different search provider (or direct web crawling), replace the search step accordingly.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const KrishiOfficerFinderInputSchema = z.object({
  zila: z.string().describe('The Zila (District) in Bangladesh.'),
  upazila: z.string().describe('The Upazila (Sub-district) in Bangladesh.'),
});
export type KrishiOfficerFinderInput = z.infer<typeof KrishiOfficerFinderInputSchema>;

const KrishiOfficerFinderOutputSchema = z.object({
  name: z.string().nullable().describe('The name of the Krishi Officer if found, otherwise null.'),
  designation: z.string().nullable().describe('The official designation of the officer (e.g., Upazila Agriculture Officer), if found.'),
  contactNumber: z.string().nullable().describe('A phone number found on authoritative pages, if any.'),
  officeAddress: z.string().nullable().describe('The address of the Upazila Agriculture Office, if found.'),
  sourceUrl: z.string().nullable().describe('The source URL from which the information was extracted.'),
});
export type KrishiOfficerFinderOutput = z.infer<typeof KrishiOfficerFinderOutputSchema>;

/* ------------------ Configuration / Env ------------------ */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // for Custom Search JSON API
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;   // Custom Search Engine ID (programmable search)

const MAX_SEARCH_RESULTS = 6; // number of candidate pages to fetch and give to Gemini
const MAX_SNIPPET_CHARS = 30_000; // limit for combined snippet length to keep prompt size reasonable

/* ------------------ Helpers ------------------ */

function normalize(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

async function googleCustomSearch(query: string, count = 6) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    throw new Error('GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables are required for Google Custom Search.');
  }
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', GOOGLE_API_KEY);
  url.searchParams.set('cx', GOOGLE_CSE_ID);
  url.searchParams.set('q', query);
  url.searchParams.set('num', String(Math.min(count, 10)));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google Custom Search failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

async function fetchHtml(url: string) {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    return null;
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Truncate or coalesce page text into a compact snippet that is likely to contain contact info. */
function makeSnippet(text: string, zila: string, upazila: string) {
  const lc = text.toLowerCase();
  // Try to find the area around keywords that are likely to contain the contact block
  const keywords = ['upazila agriculture', 'upazila agriculture officer', 'upazila agriculture office', 'contact', 'telephone', 'tel', 'phone', 'office'];
  let bestIdx = -1;
  for (const kw of keywords) {
    bestIdx = lc.indexOf(kw);
    if (bestIdx >= 0) break;
  }
  if (bestIdx < 0) {
    // fallback: search for upazila or zila mentions
    bestIdx = lc.indexOf(upazila.toLowerCase());
    if (bestIdx < 0) bestIdx = lc.indexOf(zila.toLowerCase());
  }
  if (bestIdx < 0) {
    // return the start of the document truncated
    return text.slice(0, 2000);
  }
  const start = Math.max(0, bestIdx - 800);
  const end = Math.min(text.length, bestIdx + 2000);
  return text.slice(start, end);
}

/* ------------------ Flow Implementation ------------------ */

export const krishiOfficerFinderFlow = ai.defineFlow(
  {
    name: 'krishiOfficerFinderFlow',
    inputSchema: KrishiOfficerFinderInputSchema,
    outputSchema: KrishiOfficerFinderOutputSchema,
  },
  async (input) => {
    const upazila = input.upazila.trim();
    const zila = input.zila.trim();

    // Build a precise search query to bias results toward official pages
    const query = `${upazila} Upazila Agriculture Office contact ${zila} Bangladesh site:gov.bd OR site:dae.gov.bd OR site:extension.gov.bd OR "Upazila Agriculture Officer"`;

    // 1) Use Google Custom Search to find candidate pages
    let searchJson: any;
    try {
      searchJson = await googleCustomSearch(query, MAX_SEARCH_RESULTS);
    } catch (err) {
      // If search fails, rethrow so caller can handle / show message to user
      throw new Error(`Search failed: ${(err as Error).message}`);
    }

    const items = Array.isArray(searchJson.items) ? searchJson.items : [];

    if (items.length === 0) {
      // No search hits; return an explicit NOT FOUND style response (all nulls)
      return {
        name: null,
        designation: null,
        contactNumber: null,
        officeAddress: null,
        sourceUrl: null,
      };
    }

    // 2) Fetch top candidate pages and prepare snippets for Gemini to analyze
    const candidates: Array<{ url: string; title?: string; snippet: string }> = [];
    for (let i = 0; i < Math.min(items.length, MAX_SEARCH_RESULTS); i++) {
      const it = items[i];
      if (!it?.link) continue;
      const html = await fetchHtml(it.link);
      if (!html) continue;
      const text = stripHtml(html);
      const snippet = makeSnippet(text, zila, upazila);
      candidates.push({ url: it.link, title: it.title, snippet });
    }

    if (candidates.length === 0) {
      return {
        name: null,
        designation: null,
        contactNumber: null,
        officeAddress: null,
        sourceUrl: null,
      };
    }

    // Build a single combined prompt payload with the top candidate snippets.
    // We must be explicit: Gemini MUST NOT invent any data. If a field is not present in the snippets, return null.
    // The model is asked to output strict JSON and nothing else.
    const combinedSnippets = candidates
      .map((c, idx) => `---PAGE ${idx + 1} - URL: ${c.url}\n${c.snippet}`)
      .join('\n\n')
      .slice(0, MAX_SNIPPET_CHARS);

    const instruction = `
You are an extraction assistant. You will be given snippets (plain text, already stripped of HTML) from multiple web pages that may contain contact information for the Upazila Agriculture Office for a particular Upazila and Zila in Bangladesh.

Important rules (must follow exactly):
1) DO NOT INVENT OR GUESS. Only extract values that are explicitly present in the provided snippets.
2) If a field is not present in any snippet, set that field to null.
3) Always provide a single JSON object and NOTHING ELSE (no commentary, no explanation).
4) The JSON must follow this schema exactly:
{
  "name": string|null,           // officer's name if present, otherwise null
  "designation": string|null,    // e.g., "Upazila Agriculture Officer" if present, otherwise null
  "contactNumber": string|null,  // phone number string if present, otherwise null
  "officeAddress": string|null,  // office address string if present, otherwise null
  "sourceUrl": string|null       // URL of the page that contained the extracted fields (choose the page that provides the most complete info). If no page provides any info, set to null.
}

Now, using the provided PAGE snippets below, find the best values for these fields. If different pages provide different fields, choose the page that offers the most complete combination and set sourceUrl to that page. When extracting phone numbers, provide the exact sequence you find (do not canonicalize unless you can do so from text). If multiple phone numbers appear on the same best page, return the phone number that appears closest to the officer designation or office address.

Begin. Remember: produce ONLY the JSON object and nothing else.
`;

    const prompt = `${instruction}\n\nCONTEXT: Zila="${zila}", Upazila="${upazila}"\n\n${combinedSnippets}`;

    // 3) Ask Gemini (via ai.generate) to extract structured data from the snippets
    // We use the zod schema as the expected output shape so the flow will validate.
    // Use a Gemini model that the repo's ai wrapper supports (adjust model string if needed in your environment)
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
      output: { schema: KrishiOfficerFinderOutputSchema },
      // Optional: adjust generation params to prioritize precision
      // params: { temperature: 0.0, maxOutputTokens: 800 },
    });

    // If output is empty, return NOT FOUND
    if (!output) {
      return {
        name: null,
        designation: null,
        contactNumber: null,
        officeAddress: null,
        sourceUrl: null,
      };
    }

    // Validate and return the extracted object (zod parsing already applied by ai.generate wrapper)
    return output;
  }
);
