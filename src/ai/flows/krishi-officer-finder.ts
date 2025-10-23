'use server';

/**
 * Krishi Officer Finder (Gemini-assisted extractor)
 *
 * This variant supports two modes:
 * 1) If GOOGLE_API_KEY and GOOGLE_CSE_ID are present, it uses Google Custom Search
 *    to discover candidate pages and then asks Gemini to extract structured data
 *    from the fetched snippets (preferred, most accurate).
 * 2) If GOOGLE_* are NOT present (your deployment only has GEMINI_API_KEY),
 *    it will *skip* Google Custom Search and ask Gemini directly to provide the
 *    structured JSON based on its knowledge. This is less reliable (may be out
 *    of date or incomplete) but will avoid runtime errors when GOOGLE_* envs
 *    are absent. The prompt instructs Gemini to NOT INVENT data and to return
 *    null for any unknown field.
 *
 * NOTE: Using Gemini alone relies on the model's knowledge and may not find
 * authoritative, up-to-date contact info. If possible, add GOOGLE_API_KEY and
 * GOOGLE_CSE_ID later to restore web lookups.
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

// Google Custom Search envs (optional). If missing, code will fall back to Gemini-only mode.
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

// The deployment provides GEMINI_API_KEY to the ai wrapper; that is used implicitly by ai.generate
const MAX_SEARCH_RESULTS = 6;
const MAX_SNIPPET_CHARS = 30_000;

/* ------------------ Helpers ------------------ */

function normalize(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

async function googleCustomSearch(query: string, count = 6) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    // Signal to caller that Google Search is unavailable.
    return { items: [] };
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

function makeSnippet(text: string, zila: string, upazila: string) {
  const lc = text.toLowerCase();
  const keywords = ['upazila agriculture', 'upazila agriculture officer', 'upazila agriculture office', 'contact', 'telephone', 'tel', 'phone', 'office'];
  let bestIdx = -1;
  for (const kw of keywords) {
    bestIdx = lc.indexOf(kw);
    if (bestIdx >= 0) break;
  }
  if (bestIdx < 0) {
    bestIdx = lc.indexOf(upazila.toLowerCase());
    if (bestIdx < 0) bestIdx = lc.indexOf(zila.toLowerCase());
  }
  if (bestIdx < 0) {
    return text.slice(0, 2000);
  }
  const start = Math.max(0, bestIdx - 800);
  const end = Math.min(text.length, bestIdx + 2000);
  return text.slice(start, end);
}

/* ------------------ Gemini-only fallback ------------------ */

/**
 * When Google search is unavailable, ask Gemini directly to provide the
 * structured JSON. We instruct the model strictly not to invent any info:
 * if it cannot be confident or cite a reliable source, it should set fields to null.
 *
 * This will use the deployment's Gemini access (GEMINI_API_KEY).
 */
async function geminiDirectLookup(zila: string, upazila: string) {
  const instruction = `
You are an extraction assistant. The user asked for contact information for the Upazila Agriculture Office.
Only use your internal knowledge. IMPORTANT: DO NOT INVENT or GUESS any data. If you cannot be certain a value is correct, set that field to null.

Return ONLY a single JSON object exactly matching the schema below and NOTHING ELSE.

Schema:
{
  "name": string|null,
  "designation": string|null,
  "contactNumber": string|null,
  "officeAddress": string|null,
  "sourceUrl": string|null
}

Rules (must follow):
- If you know a fact and it is reliably part of your knowledge, include it and set sourceUrl to a real authoritative URL where you know the info comes from (only official gov.bd or department pages). If you do not KNOW a reliable source URL, set sourceUrl to null.
- If you are not certain about any field, set that field to null.
- Do not fabricate phone numbers, names, addresses, or URLs.
- Output must be strict JSON with the exact keys above.

Context:
Zila="${zila}"
Upazila="${upazila}"

Now produce the single JSON object.
`.trim();

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: instruction,
    // Ask for exact schema validation
    output: { schema: KrishiOfficerFinderOutputSchema },
    params: { temperature: 0.0, maxOutputTokens: 800 },
  });

  return output ?? null;
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

    // If Google CSE is available, use it to discover pages and give snippets to Gemini.
    // Otherwise, fall back to Gemini-only lookup (uses only GEMINI_API_KEY).
    let searchJson: any = { items: [] };
    try {
      searchJson = await googleCustomSearch(query, MAX_SEARCH_RESULTS);
    } catch (err) {
      // If google search fails unexpectedly, log and continue to fallback mode below.
      console.warn('Google Custom Search error:', (err as Error).message);
      searchJson = { items: [] };
    }

    const items = Array.isArray(searchJson.items) ? searchJson.items : [];

    if (items.length === 0) {
      // No discovered pages -> use Gemini-only direct lookup.
      const geminiResult = await geminiDirectLookup(zila, upazila);
      if (!geminiResult) {
        // Return explicit NOT FOUND response if Gemini didn't produce output.
        return {
          name: null,
          designation: null,
          contactNumber: null,
          officeAddress: null,
          sourceUrl: null,
        };
      }
      return geminiResult;
    }

    // If we have search items, fetch top candidate pages and prepare snippets for Gemini to analyze.
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
      // If we couldn't fetch any candidate pages, fall back to Gemini-only.
      const geminiResult = await geminiDirectLookup(zila, upazila);
      if (!geminiResult) {
        return {
          name: null,
          designation: null,
          contactNumber: null,
          officeAddress: null,
          sourceUrl: null,
        };
      }
      return geminiResult;
    }

    const combinedSnippets = candidates
      .map((c, idx) => `---PAGE ${idx + 1} - URL: ${c.url}\n${c.snippet}`)
      .join('\n\n')
      .slice(0, MAX_SNIPPET_CHARS);

    const instruction = `
You are an extraction assistant. You will be given snippets (plain text, already stripped of HTML) from multiple web pages that may contain contact information for the Upazila Agriculture Office.

Important rules (must follow exactly):
1) DO NOT INVENT OR GUESS. Only extract values that are explicitly present in the provided snippets.
2) If a field is not present in any snippet, set that field to null.
3) Always provide a single JSON object and NOTHING ELSE (no commentary, no explanation).
4) The JSON must follow this schema exactly:
{
  "name": string|null,
  "designation": string|null,
  "contactNumber": string|null,
  "officeAddress": string|null,
  "sourceUrl": string|null
}

Now, using the provided PAGE snippets below, find the best values for these fields. If different pages provide different fields, choose the page that offers the most complete combination and set sourceUrl to that page's URL.

Begin. Produce ONLY the JSON object.
`;

    const prompt = `${instruction}\n\nCONTEXT: Zila="${zila}", Upazila="${upazila}"\n\n${combinedSnippets}`;

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
      output: { schema: KrishiOfficerFinderOutputSchema },
      params: { temperature: 0.0, maxOutputTokens: 800 },
    });

    if (!output) {
      return {
        name: null,
        designation: null,
        contactNumber: null,
        officeAddress: null,
        sourceUrl: null,
      };
    }

    return output;
  }
);
