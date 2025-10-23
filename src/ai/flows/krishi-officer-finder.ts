'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * Changes in this mobile-first variant:
 * - Input: optional mobilePreferred boolean to ask for a "best-effort" fallback when Google/search pages are not available.
 * - Output: added `verified` boolean to indicate whether returned data is verified (from fetched pages) or unverified (best-effort).
 * - If mobilePreferred=true and strict Gemini returns null, a second "best-effort" Gemini pass is performed and returned as unverified.
 * - DEBUG_KOFLOW logic retained.
 */

const KrishiOfficerFinderInputSchema = z.object({
  zila: z.string().describe('The Zila (District) in Bangladesh.'),
  upazila: z.string().describe('The Upazila (Sub-district) in Bangladesh.'),
  // New optional flag - set true from mobile client to prefer a best-effort response if precise extraction yields nothing.
  mobilePreferred: z.boolean().optional().describe('If true, allow a best-effort (unverified) fallback from Gemini when strict extraction fails.'),
});
export type KrishiOfficerFinderInput = z.infer<typeof KrishiOfficerFinderInputSchema>;

const KrishiOfficerFinderOutputSchema = z.object({
  name: z.string().nullable().describe('The name of the Krishi Officer if found, otherwise null.'),
  designation: z.string().nullable().describe('The official designation of the officer (e.g., Upazila Agriculture Officer), if found.'),
  contactNumber: z.string().nullable().describe('A phone number found on authoritative pages, if any.'),
  officeAddress: z.string().nullable().describe('The address of the Upazila Agriculture Office, if found.'),
  sourceUrl: z.string().nullable().describe('The source URL from which the information was extracted.'),
  // New field to indicate whether the returned values are verified (from fetched authoritative pages) or unverified (best-effort)
  verified: z.boolean().describe('true if the result is verified from fetched pages / Google CSE; false for best-effort/unverified results'),
});
export type KrishiOfficerFinderOutput = z.infer<typeof KrishiOfficerFinderOutputSchema>;

/* ------------------ Configuration / Env ------------------ */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const DEBUG = process.env.DEBUG_KOFLOW === '1';

const MAX_SEARCH_RESULTS = 6;
const MAX_SNIPPET_CHARS = 30_000;

/* ------------------ Helpers ------------------ */

function normalize(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

async function googleCustomSearch(query: string, count = 6) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
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

/* ------------------ Gemini-only fallback (strict and best-effort) ------------------ */

async function geminiDirectLookupStrict(zila: string, upazila: string) {
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
- If you know a fact and it is reliably part of your knowledge, include it and set sourceUrl to a real authoritative URL where you know the info comes from (only official gov.bd or department pages).
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
    output: { schema: KrishiOfficerFinderOutputSchema.omit({ verified: true }) }, // schema without verified for this internal call
    params: { temperature: 0.0, maxOutputTokens: 800 },
  });

  return output ?? null;
}

async function geminiBestEffortLookup(zila: string, upazila: string) {
  // Relaxed: allow best-effort answers, but require the model to mark whether it's confident.
  const instruction = `
You are an extraction assistant. The user asked for contact information for the Upazila Agriculture Office.
This is a BEST-EFFORT extraction. You may use your knowledge and inference to provide likely values, but be explicit about confidence.

Return ONLY a single JSON object exactly matching this schema and NOTHING ELSE.

Schema:
{
  "name": string|null,
  "designation": string|null,
  "contactNumber": string|null,
  "officeAddress": string|null,
  "sourceUrl": string|null,
  "confidenceNote": string|null
}

Rules:
- You MAY provide best-effort values if you think they are likely, but do NOT fabricate exact phone numbers if you are unsure — in those cases set the field to null.
- For sourceUrl, if you are drawing from knowledge but do not have a precise URL, set sourceUrl to null and put a short note in confidenceNote explaining why this is unverified.
- Output must be strict JSON with the exact keys above.
Context:
Zila="${zila}"
Upazila="${upazila}"

Now produce the single JSON object.
`.trim();

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: instruction,
    // We cannot validate the extended schema with the same Zod object, so request raw output and parse defensively.
    params: { temperature: 0.2, maxOutputTokens: 800 },
  });

  // The ai wrapper may return parsed output or raw text depending on integration; handle both.
  return (output as any) ?? null;
}

/* ------------------ Flow Implementation ------------------ */

function notFoundResponse(diagnostic?: Record<string, any>): KrishiOfficerFinderOutput {
  if (DEBUG && diagnostic) {
    const short = JSON.stringify(diagnostic).slice(0, 1000);
    return {
      name: null,
      designation: null,
      contactNumber: null,
      officeAddress: null,
      sourceUrl: `DEBUG:${short}`,
      verified: false,
    };
  }
  return {
    name: null,
    designation: null,
    contactNumber: null,
    officeAddress: null,
    sourceUrl: null,
    verified: false,
  };
}

export const krishiOfficerFinderFlow = ai.defineFlow(
  {
    name: 'krishiOfficerFinderFlow',
    inputSchema: KrishiOfficerFinderInputSchema,
    outputSchema: KrishiOfficerFinderOutputSchema,
  },
  async (input) => {
    const upazila = input.upazila.trim();
    const zila = input.zila.trim();
    const mobilePreferred = !!input.mobilePreferred;

    const query = `${upazila} Upazila Agriculture Office contact ${zila} Bangladesh site:gov.bd OR site:dae.gov.bd OR site:extension.gov.bd OR "Upazila Agriculture Officer"`;

    if (DEBUG) {
      console.debug('[krishi-officer-finder] DEBUG enabled');
      console.debug('[krishi-officer-finder] mobilePreferred?', mobilePreferred);
      console.debug('[krishi-officer-finder] GOOGLE_API_KEY present?', !!GOOGLE_API_KEY);
      console.debug('[krishi-officer-finder] GOOGLE_CSE_ID present?', !!GOOGLE_CSE_ID);
      console.debug('[krishi-officer-finder] Query:', query);
    }

    let searchJson: any = { items: [] };
    try {
      searchJson = await googleCustomSearch(query, MAX_SEARCH_RESULTS);
      if (DEBUG) console.debug('[krishi-officer-finder] searchJson items length:', Array.isArray(searchJson.items) ? searchJson.items.length : 0);
    } catch (err) {
      console.warn('Google Custom Search error:', (err as Error).message);
      searchJson = { items: [] };
    }

    const items = Array.isArray(searchJson.items) ? searchJson.items : [];

    // Helper to format a verified output with verified=true
    function verifiedWrap(obj: any): KrishiOfficerFinderOutput {
      return {
        name: obj.name ?? null,
        designation: obj.designation ?? null,
        contactNumber: obj.contactNumber ?? null,
        officeAddress: obj.officeAddress ?? null,
        sourceUrl: obj.sourceUrl ?? null,
        verified: true,
      };
    }

    if (items.length === 0) {
      // No discovered pages -> strict Gemini-only lookup first.
      if (DEBUG) console.debug('[krishi-officer-finder] No search items - trying strict Gemini');

      const geminiStrict = await geminiDirectLookupStrict(zila, upazila);
      if (geminiStrict && Object.values(geminiStrict).some((v) => v !== null)) {
        return verifiedWrap(geminiStrict);
      }

      // If mobilePreferred, attempt a best-effort pass
      if (mobilePreferred) {
        if (DEBUG) console.debug('[krishi-officer-finder] strict returned nulls - trying best-effort for mobile');
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          // Normalize best-effort response into our schema; mark verified=false
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          // Attach confidence note into sourceUrl if no sourceUrl provided (compact)
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
        return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, reason: 'gemini_best_effort_no_output' });
      }

      // Not mobilePreferred -> return not found / strict nulls
      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, reason: 'strict_no_output' });
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

    if (DEBUG) console.debug('[krishi-officer-finder] candidates length:', candidates.length);

    if (candidates.length === 0) {
      // If we couldn't fetch any candidate pages, behave like above.
      if (DEBUG) console.debug('[krishi-officer-finder] No candidates fetched - falling back');

      const geminiStrict = await geminiDirectLookupStrict(zila, upazila);
      if (geminiStrict && Object.values(geminiStrict).some((v) => v !== null)) {
        return verifiedWrap(geminiStrict);
      }

      if (mobilePreferred) {
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
        return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, reason: 'no_candidates_and_best_effort_failed' });
      }

      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, reason: 'no_candidates_strict_only' });
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

Now, using the provided PAGE snippets below, find the best values for these fields. If different pages provide different fields, choose the page that offers the most complete combination and set sourceUrl to that page's URL. If multiple pages are equally good, choose the one that looks more authoritative (gov.bd or dae.gov.bd). If a field cannot be found in any snippet, set it to null.

Begin. Produce ONLY the JSON object.
`;

    const prompt = `${instruction}\n\nCONTEXT: Zila="${zila}", Upazila="${upazila}"\n\n${combinedSnippets}`;

    if (DEBUG) console.debug('[krishi-officer-finder] Sending prompt to Gemini, combinedSnippets length:', combinedSnippets.length);

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
      output: { schema: KrishiOfficerFinderOutputSchema.omit({ verified: true }) },
      params: { temperature: 0.0, maxOutputTokens: 800 },
    });

    if (!output) {
      // If mobilePreferred, attempt best-effort even when snippets failed to produce strict JSON.
      if (mobilePreferred) {
        if (DEBUG) console.debug('[krishi-officer-finder] strict snippet extraction yielded no output - trying best-effort');
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
      }

      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, reason: 'gemini_no_output_after_snippets' });
    }

    // If Gemini returned all nulls and mobilePreferred is true, try a best-effort pass
    if (Object.values(output).every((v) => v === null)) {
      if (mobilePreferred) {
        if (DEBUG) console.debug('[krishi-officer-finder] gemini returned all nulls - trying best-effort for mobile');
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
      }

      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, geminiOutput: output });
    }

    // Normal verified output
    return {
      name: output.name ?? null,
      designation: output.designation ?? null,
      contactNumber: output.contactNumber ?? null,
      officeAddress: output.officeAddress ?? null,
      sourceUrl: output.sourceUrl ?? null,
      verified: true,
    };
  }
);'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * Changes in this mobile-first variant:
 * - Input: optional mobilePreferred boolean to ask for a "best-effort" fallback when Google/search pages are not available.
 * - Output: added `verified` boolean to indicate whether returned data is verified (from fetched pages) or unverified (best-effort).
 * - If mobilePreferred=true and strict Gemini returns null, a second "best-effort" Gemini pass is performed and returned as unverified.
 * - DEBUG_KOFLOW logic retained.
 */

const KrishiOfficerFinderInputSchema = z.object({
  zila: z.string().describe('The Zila (District) in Bangladesh.'),
  upazila: z.string().describe('The Upazila (Sub-district) in Bangladesh.'),
  // New optional flag - set true from mobile client to prefer a best-effort response if precise extraction yields nothing.
  mobilePreferred: z.boolean().optional().describe('If true, allow a best-effort (unverified) fallback from Gemini when strict extraction fails.'),
});
export type KrishiOfficerFinderInput = z.infer<typeof KrishiOfficerFinderInputSchema>;

const KrishiOfficerFinderOutputSchema = z.object({
  name: z.string().nullable().describe('The name of the Krishi Officer if found, otherwise null.'),
  designation: z.string().nullable().describe('The official designation of the officer (e.g., Upazila Agriculture Officer), if found.'),
  contactNumber: z.string().nullable().describe('A phone number found on authoritative pages, if any.'),
  officeAddress: z.string().nullable().describe('The address of the Upazila Agriculture Office, if found.'),
  sourceUrl: z.string().nullable().describe('The source URL from which the information was extracted.'),
  // New field to indicate whether the returned values are verified (from fetched authoritative pages) or unverified (best-effort)
  verified: z.boolean().describe('true if the result is verified from fetched pages / Google CSE; false for best-effort/unverified results'),
});
export type KrishiOfficerFinderOutput = z.infer<typeof KrishiOfficerFinderOutputSchema>;

/* ------------------ Configuration / Env ------------------ */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const DEBUG = process.env.DEBUG_KOFLOW === '1';

const MAX_SEARCH_RESULTS = 6;
const MAX_SNIPPET_CHARS = 30_000;

/* ------------------ Helpers ------------------ */

function normalize(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

async function googleCustomSearch(query: string, count = 6) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
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

/* ------------------ Gemini-only fallback (strict and best-effort) ------------------ */

async function geminiDirectLookupStrict(zila: string, upazila: string) {
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
- If you know a fact and it is reliably part of your knowledge, include it and set sourceUrl to a real authoritative URL where you know the info comes from (only official gov.bd or department pages).
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
    output: { schema: KrishiOfficerFinderOutputSchema.omit({ verified: true }) }, // schema without verified for this internal call
    params: { temperature: 0.0, maxOutputTokens: 800 },
  });

  return output ?? null;
}

async function geminiBestEffortLookup(zila: string, upazila: string) {
  // Relaxed: allow best-effort answers, but require the model to mark whether it's confident.
  const instruction = `
You are an extraction assistant. The user asked for contact information for the Upazila Agriculture Office.
This is a BEST-EFFORT extraction. You may use your knowledge and inference to provide likely values, but be explicit about confidence.

Return ONLY a single JSON object exactly matching this schema and NOTHING ELSE.

Schema:
{
  "name": string|null,
  "designation": string|null,
  "contactNumber": string|null,
  "officeAddress": string|null,
  "sourceUrl": string|null,
  "confidenceNote": string|null
}

Rules:
- You MAY provide best-effort values if you think they are likely, but do NOT fabricate exact phone numbers if you are unsure — in those cases set the field to null.
- For sourceUrl, if you are drawing from knowledge but do not have a precise URL, set sourceUrl to null and put a short note in confidenceNote explaining why this is unverified.
- Output must be strict JSON with the exact keys above.
Context:
Zila="${zila}"
Upazila="${upazila}"

Now produce the single JSON object.
`.trim();

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: instruction,
    // We cannot validate the extended schema with the same Zod object, so request raw output and parse defensively.
    params: { temperature: 0.2, maxOutputTokens: 800 },
  });

  // The ai wrapper may return parsed output or raw text depending on integration; handle both.
  return (output as any) ?? null;
}

/* ------------------ Flow Implementation ------------------ */

function notFoundResponse(diagnostic?: Record<string, any>): KrishiOfficerFinderOutput {
  if (DEBUG && diagnostic) {
    const short = JSON.stringify(diagnostic).slice(0, 1000);
    return {
      name: null,
      designation: null,
      contactNumber: null,
      officeAddress: null,
      sourceUrl: `DEBUG:${short}`,
      verified: false,
    };
  }
  return {
    name: null,
    designation: null,
    contactNumber: null,
    officeAddress: null,
    sourceUrl: null,
    verified: false,
  };
}

export const krishiOfficerFinderFlow = ai.defineFlow(
  {
    name: 'krishiOfficerFinderFlow',
    inputSchema: KrishiOfficerFinderInputSchema,
    outputSchema: KrishiOfficerFinderOutputSchema,
  },
  async (input) => {
    const upazila = input.upazila.trim();
    const zila = input.zila.trim();
    const mobilePreferred = !!input.mobilePreferred;

    const query = `${upazila} Upazila Agriculture Office contact ${zila} Bangladesh site:gov.bd OR site:dae.gov.bd OR site:extension.gov.bd OR "Upazila Agriculture Officer"`;

    if (DEBUG) {
      console.debug('[krishi-officer-finder] DEBUG enabled');
      console.debug('[krishi-officer-finder] mobilePreferred?', mobilePreferred);
      console.debug('[krishi-officer-finder] GOOGLE_API_KEY present?', !!GOOGLE_API_KEY);
      console.debug('[krishi-officer-finder] GOOGLE_CSE_ID present?', !!GOOGLE_CSE_ID);
      console.debug('[krishi-officer-finder] Query:', query);
    }

    let searchJson: any = { items: [] };
    try {
      searchJson = await googleCustomSearch(query, MAX_SEARCH_RESULTS);
      if (DEBUG) console.debug('[krishi-officer-finder] searchJson items length:', Array.isArray(searchJson.items) ? searchJson.items.length : 0);
    } catch (err) {
      console.warn('Google Custom Search error:', (err as Error).message);
      searchJson = { items: [] };
    }

    const items = Array.isArray(searchJson.items) ? searchJson.items : [];

    // Helper to format a verified output with verified=true
    function verifiedWrap(obj: any): KrishiOfficerFinderOutput {
      return {
        name: obj.name ?? null,
        designation: obj.designation ?? null,
        contactNumber: obj.contactNumber ?? null,
        officeAddress: obj.officeAddress ?? null,
        sourceUrl: obj.sourceUrl ?? null,
        verified: true,
      };
    }

    if (items.length === 0) {
      // No discovered pages -> strict Gemini-only lookup first.
      if (DEBUG) console.debug('[krishi-officer-finder] No search items - trying strict Gemini');

      const geminiStrict = await geminiDirectLookupStrict(zila, upazila);
      if (geminiStrict && Object.values(geminiStrict).some((v) => v !== null)) {
        return verifiedWrap(geminiStrict);
      }

      // If mobilePreferred, attempt a best-effort pass
      if (mobilePreferred) {
        if (DEBUG) console.debug('[krishi-officer-finder] strict returned nulls - trying best-effort for mobile');
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          // Normalize best-effort response into our schema; mark verified=false
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          // Attach confidence note into sourceUrl if no sourceUrl provided (compact)
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
        return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, reason: 'gemini_best_effort_no_output' });
      }

      // Not mobilePreferred -> return not found / strict nulls
      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, reason: 'strict_no_output' });
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

    if (DEBUG) console.debug('[krishi-officer-finder] candidates length:', candidates.length);

    if (candidates.length === 0) {
      // If we couldn't fetch any candidate pages, behave like above.
      if (DEBUG) console.debug('[krishi-officer-finder] No candidates fetched - falling back');

      const geminiStrict = await geminiDirectLookupStrict(zila, upazila);
      if (geminiStrict && Object.values(geminiStrict).some((v) => v !== null)) {
        return verifiedWrap(geminiStrict);
      }

      if (mobilePreferred) {
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
        return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, reason: 'no_candidates_and_best_effort_failed' });
      }

      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, reason: 'no_candidates_strict_only' });
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

Now, using the provided PAGE snippets below, find the best values for these fields. If different pages provide different fields, choose the page that offers the most complete combination and set sourceUrl to that page's URL. If multiple pages are equally good, choose the one that looks more authoritative (gov.bd or dae.gov.bd). If a field cannot be found in any snippet, set it to null.

Begin. Produce ONLY the JSON object.
`;

    const prompt = `${instruction}\n\nCONTEXT: Zila="${zila}", Upazila="${upazila}"\n\n${combinedSnippets}`;

    if (DEBUG) console.debug('[krishi-officer-finder] Sending prompt to Gemini, combinedSnippets length:', combinedSnippets.length);

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
      output: { schema: KrishiOfficerFinderOutputSchema.omit({ verified: true }) },
      params: { temperature: 0.0, maxOutputTokens: 800 },
    });

    if (!output) {
      // If mobilePreferred, attempt best-effort even when snippets failed to produce strict JSON.
      if (mobilePreferred) {
        if (DEBUG) console.debug('[krishi-officer-finder] strict snippet extraction yielded no output - trying best-effort');
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
      }

      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, reason: 'gemini_no_output_after_snippets' });
    }

    // If Gemini returned all nulls and mobilePreferred is true, try a best-effort pass
    if (Object.values(output).every((v) => v === null)) {
      if (mobilePreferred) {
        if (DEBUG) console.debug('[krishi-officer-finder] gemini returned all nulls - trying best-effort for mobile');
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
      }

      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, geminiOutput: output });
    }

    // Normal verified output
    return {
      name: output.name ?? null,
      designation: output.designation ?? null,
      contactNumber: output.contactNumber ?? null,
      officeAddress: output.officeAddress ?? null,
      sourceUrl: output.sourceUrl ?? null,
      verified: true,
    };
  }
);'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * Changes in this mobile-first variant:
 * - Input: optional mobilePreferred boolean to ask for a "best-effort" fallback when Google/search pages are not available.
 * - Output: added `verified` boolean to indicate whether returned data is verified (from fetched pages) or unverified (best-effort).
 * - If mobilePreferred=true and strict Gemini returns null, a second "best-effort" Gemini pass is performed and returned as unverified.
 * - DEBUG_KOFLOW logic retained.
 */

const KrishiOfficerFinderInputSchema = z.object({
  zila: z.string().describe('The Zila (District) in Bangladesh.'),
  upazila: z.string().describe('The Upazila (Sub-district) in Bangladesh.'),
  // New optional flag - set true from mobile client to prefer a best-effort response if precise extraction yields nothing.
  mobilePreferred: z.boolean().optional().describe('If true, allow a best-effort (unverified) fallback from Gemini when strict extraction fails.'),
});
export type KrishiOfficerFinderInput = z.infer<typeof KrishiOfficerFinderInputSchema>;

const KrishiOfficerFinderOutputSchema = z.object({
  name: z.string().nullable().describe('The name of the Krishi Officer if found, otherwise null.'),
  designation: z.string().nullable().describe('The official designation of the officer (e.g., Upazila Agriculture Officer), if found.'),
  contactNumber: z.string().nullable().describe('A phone number found on authoritative pages, if any.'),
  officeAddress: z.string().nullable().describe('The address of the Upazila Agriculture Office, if found.'),
  sourceUrl: z.string().nullable().describe('The source URL from which the information was extracted.'),
  // New field to indicate whether the returned values are verified (from fetched authoritative pages) or unverified (best-effort)
  verified: z.boolean().describe('true if the result is verified from fetched pages / Google CSE; false for best-effort/unverified results'),
});
export type KrishiOfficerFinderOutput = z.infer<typeof KrishiOfficerFinderOutputSchema>;

/* ------------------ Configuration / Env ------------------ */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const DEBUG = process.env.DEBUG_KOFLOW === '1';

const MAX_SEARCH_RESULTS = 6;
const MAX_SNIPPET_CHARS = 30_000;

/* ------------------ Helpers ------------------ */

function normalize(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

async function googleCustomSearch(query: string, count = 6) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
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

/* ------------------ Gemini-only fallback (strict and best-effort) ------------------ */

async function geminiDirectLookupStrict(zila: string, upazila: string) {
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
- If you know a fact and it is reliably part of your knowledge, include it and set sourceUrl to a real authoritative URL where you know the info comes from (only official gov.bd or department pages).
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
    output: { schema: KrishiOfficerFinderOutputSchema.omit({ verified: true }) }, // schema without verified for this internal call
    params: { temperature: 0.0, maxOutputTokens: 800 },
  });

  return output ?? null;
}

async function geminiBestEffortLookup(zila: string, upazila: string) {
  // Relaxed: allow best-effort answers, but require the model to mark whether it's confident.
  const instruction = `
You are an extraction assistant. The user asked for contact information for the Upazila Agriculture Office.
This is a BEST-EFFORT extraction. You may use your knowledge and inference to provide likely values, but be explicit about confidence.

Return ONLY a single JSON object exactly matching this schema and NOTHING ELSE.

Schema:
{
  "name": string|null,
  "designation": string|null,
  "contactNumber": string|null,
  "officeAddress": string|null,
  "sourceUrl": string|null,
  "confidenceNote": string|null
}

Rules:
- You MAY provide best-effort values if you think they are likely, but do NOT fabricate exact phone numbers if you are unsure — in those cases set the field to null.
- For sourceUrl, if you are drawing from knowledge but do not have a precise URL, set sourceUrl to null and put a short note in confidenceNote explaining why this is unverified.
- Output must be strict JSON with the exact keys above.
Context:
Zila="${zila}"
Upazila="${upazila}"

Now produce the single JSON object.
`.trim();

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: instruction,
    // We cannot validate the extended schema with the same Zod object, so request raw output and parse defensively.
    params: { temperature: 0.2, maxOutputTokens: 800 },
  });

  // The ai wrapper may return parsed output or raw text depending on integration; handle both.
  return (output as any) ?? null;
}

/* ------------------ Flow Implementation ------------------ */

function notFoundResponse(diagnostic?: Record<string, any>): KrishiOfficerFinderOutput {
  if (DEBUG && diagnostic) {
    const short = JSON.stringify(diagnostic).slice(0, 1000);
    return {
      name: null,
      designation: null,
      contactNumber: null,
      officeAddress: null,
      sourceUrl: `DEBUG:${short}`,
      verified: false,
    };
  }
  return {
    name: null,
    designation: null,
    contactNumber: null,
    officeAddress: null,
    sourceUrl: null,
    verified: false,
  };
}

export const krishiOfficerFinderFlow = ai.defineFlow(
  {
    name: 'krishiOfficerFinderFlow',
    inputSchema: KrishiOfficerFinderInputSchema,
    outputSchema: KrishiOfficerFinderOutputSchema,
  },
  async (input) => {
    const upazila = input.upazila.trim();
    const zila = input.zila.trim();
    const mobilePreferred = !!input.mobilePreferred;

    const query = `${upazila} Upazila Agriculture Office contact ${zila} Bangladesh site:gov.bd OR site:dae.gov.bd OR site:extension.gov.bd OR "Upazila Agriculture Officer"`;

    if (DEBUG) {
      console.debug('[krishi-officer-finder] DEBUG enabled');
      console.debug('[krishi-officer-finder] mobilePreferred?', mobilePreferred);
      console.debug('[krishi-officer-finder] GOOGLE_API_KEY present?', !!GOOGLE_API_KEY);
      console.debug('[krishi-officer-finder] GOOGLE_CSE_ID present?', !!GOOGLE_CSE_ID);
      console.debug('[krishi-officer-finder] Query:', query);
    }

    let searchJson: any = { items: [] };
    try {
      searchJson = await googleCustomSearch(query, MAX_SEARCH_RESULTS);
      if (DEBUG) console.debug('[krishi-officer-finder] searchJson items length:', Array.isArray(searchJson.items) ? searchJson.items.length : 0);
    } catch (err) {
      console.warn('Google Custom Search error:', (err as Error).message);
      searchJson = { items: [] };
    }

    const items = Array.isArray(searchJson.items) ? searchJson.items : [];

    // Helper to format a verified output with verified=true
    function verifiedWrap(obj: any): KrishiOfficerFinderOutput {
      return {
        name: obj.name ?? null,
        designation: obj.designation ?? null,
        contactNumber: obj.contactNumber ?? null,
        officeAddress: obj.officeAddress ?? null,
        sourceUrl: obj.sourceUrl ?? null,
        verified: true,
      };
    }

    if (items.length === 0) {
      // No discovered pages -> strict Gemini-only lookup first.
      if (DEBUG) console.debug('[krishi-officer-finder] No search items - trying strict Gemini');

      const geminiStrict = await geminiDirectLookupStrict(zila, upazila);
      if (geminiStrict && Object.values(geminiStrict).some((v) => v !== null)) {
        return verifiedWrap(geminiStrict);
      }

      // If mobilePreferred, attempt a best-effort pass
      if (mobilePreferred) {
        if (DEBUG) console.debug('[krishi-officer-finder] strict returned nulls - trying best-effort for mobile');
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          // Normalize best-effort response into our schema; mark verified=false
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          // Attach confidence note into sourceUrl if no sourceUrl provided (compact)
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
        return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, reason: 'gemini_best_effort_no_output' });
      }

      // Not mobilePreferred -> return not found / strict nulls
      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, reason: 'strict_no_output' });
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

    if (DEBUG) console.debug('[krishi-officer-finder] candidates length:', candidates.length);

    if (candidates.length === 0) {
      // If we couldn't fetch any candidate pages, behave like above.
      if (DEBUG) console.debug('[krishi-officer-finder] No candidates fetched - falling back');

      const geminiStrict = await geminiDirectLookupStrict(zila, upazila);
      if (geminiStrict && Object.values(geminiStrict).some((v) => v !== null)) {
        return verifiedWrap(geminiStrict);
      }

      if (mobilePreferred) {
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
        return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, reason: 'no_candidates_and_best_effort_failed' });
      }

      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, reason: 'no_candidates_strict_only' });
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

Now, using the provided PAGE snippets below, find the best values for these fields. If different pages provide different fields, choose the page that offers the most complete combination and set sourceUrl to that page's URL. If multiple pages are equally good, choose the one that looks more authoritative (gov.bd or dae.gov.bd). If a field cannot be found in any snippet, set it to null.

Begin. Produce ONLY the JSON object.
`;

    const prompt = `${instruction}\n\nCONTEXT: Zila="${zila}", Upazila="${upazila}"\n\n${combinedSnippets}`;

    if (DEBUG) console.debug('[krishi-officer-finder] Sending prompt to Gemini, combinedSnippets length:', combinedSnippets.length);

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
      output: { schema: KrishiOfficerFinderOutputSchema.omit({ verified: true }) },
      params: { temperature: 0.0, maxOutputTokens: 800 },
    });

    if (!output) {
      // If mobilePreferred, attempt best-effort even when snippets failed to produce strict JSON.
      if (mobilePreferred) {
        if (DEBUG) console.debug('[krishi-officer-finder] strict snippet extraction yielded no output - trying best-effort');
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
      }

      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, reason: 'gemini_no_output_after_snippets' });
    }

    // If Gemini returned all nulls and mobilePreferred is true, try a best-effort pass
    if (Object.values(output).every((v) => v === null)) {
      if (mobilePreferred) {
        if (DEBUG) console.debug('[krishi-officer-finder] gemini returned all nulls - trying best-effort for mobile');
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
      }

      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, geminiOutput: output });
    }

    // Normal verified output
    return {
      name: output.name ?? null,
      designation: output.designation ?? null,
      contactNumber: output.contactNumber ?? null,
      officeAddress: output.officeAddress ?? null,
      sourceUrl: output.sourceUrl ?? null,
      verified: true,
    };
  }
);'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * Changes in this mobile-first variant:
 * - Input: optional mobilePreferred boolean to ask for a "best-effort" fallback when Google/search pages are not available.
 * - Output: added `verified` boolean to indicate whether returned data is verified (from fetched pages) or unverified (best-effort).
 * - If mobilePreferred=true and strict Gemini returns null, a second "best-effort" Gemini pass is performed and returned as unverified.
 * - DEBUG_KOFLOW logic retained.
 */

const KrishiOfficerFinderInputSchema = z.object({
  zila: z.string().describe('The Zila (District) in Bangladesh.'),
  upazila: z.string().describe('The Upazila (Sub-district) in Bangladesh.'),
  // New optional flag - set true from mobile client to prefer a best-effort response if precise extraction yields nothing.
  mobilePreferred: z.boolean().optional().describe('If true, allow a best-effort (unverified) fallback from Gemini when strict extraction fails.'),
});
export type KrishiOfficerFinderInput = z.infer<typeof KrishiOfficerFinderInputSchema>;

const KrishiOfficerFinderOutputSchema = z.object({
  name: z.string().nullable().describe('The name of the Krishi Officer if found, otherwise null.'),
  designation: z.string().nullable().describe('The official designation of the officer (e.g., Upazila Agriculture Officer), if found.'),
  contactNumber: z.string().nullable().describe('A phone number found on authoritative pages, if any.'),
  officeAddress: z.string().nullable().describe('The address of the Upazila Agriculture Office, if found.'),
  sourceUrl: z.string().nullable().describe('The source URL from which the information was extracted.'),
  // New field to indicate whether the returned values are verified (from fetched authoritative pages) or unverified (best-effort)
  verified: z.boolean().describe('true if the result is verified from fetched pages / Google CSE; false for best-effort/unverified results'),
});
export type KrishiOfficerFinderOutput = z.infer<typeof KrishiOfficerFinderOutputSchema>;

/* ------------------ Configuration / Env ------------------ */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const DEBUG = process.env.DEBUG_KOFLOW === '1';

const MAX_SEARCH_RESULTS = 6;
const MAX_SNIPPET_CHARS = 30_000;

/* ------------------ Helpers ------------------ */

function normalize(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

async function googleCustomSearch(query: string, count = 6) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
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

/* ------------------ Gemini-only fallback (strict and best-effort) ------------------ */

async function geminiDirectLookupStrict(zila: string, upazila: string) {
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
- If you know a fact and it is reliably part of your knowledge, include it and set sourceUrl to a real authoritative URL where you know the info comes from (only official gov.bd or department pages).
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
    output: { schema: KrishiOfficerFinderOutputSchema.omit({ verified: true }) }, // schema without verified for this internal call
    params: { temperature: 0.0, maxOutputTokens: 800 },
  });

  return output ?? null;
}

async function geminiBestEffortLookup(zila: string, upazila: string) {
  // Relaxed: allow best-effort answers, but require the model to mark whether it's confident.
  const instruction = `
You are an extraction assistant. The user asked for contact information for the Upazila Agriculture Office.
This is a BEST-EFFORT extraction. You may use your knowledge and inference to provide likely values, but be explicit about confidence.

Return ONLY a single JSON object exactly matching this schema and NOTHING ELSE.

Schema:
{
  "name": string|null,
  "designation": string|null,
  "contactNumber": string|null,
  "officeAddress": string|null,
  "sourceUrl": string|null,
  "confidenceNote": string|null
}

Rules:
- You MAY provide best-effort values if you think they are likely, but do NOT fabricate exact phone numbers if you are unsure — in those cases set the field to null.
- For sourceUrl, if you are drawing from knowledge but do not have a precise URL, set sourceUrl to null and put a short note in confidenceNote explaining why this is unverified.
- Output must be strict JSON with the exact keys above.
Context:
Zila="${zila}"
Upazila="${upazila}"

Now produce the single JSON object.
`.trim();

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: instruction,
    // We cannot validate the extended schema with the same Zod object, so request raw output and parse defensively.
    params: { temperature: 0.2, maxOutputTokens: 800 },
  });

  // The ai wrapper may return parsed output or raw text depending on integration; handle both.
  return (output as any) ?? null;
}

/* ------------------ Flow Implementation ------------------ */

function notFoundResponse(diagnostic?: Record<string, any>): KrishiOfficerFinderOutput {
  if (DEBUG && diagnostic) {
    const short = JSON.stringify(diagnostic).slice(0, 1000);
    return {
      name: null,
      designation: null,
      contactNumber: null,
      officeAddress: null,
      sourceUrl: `DEBUG:${short}`,
      verified: false,
    };
  }
  return {
    name: null,
    designation: null,
    contactNumber: null,
    officeAddress: null,
    sourceUrl: null,
    verified: false,
  };
}

export const krishiOfficerFinderFlow = ai.defineFlow(
  {
    name: 'krishiOfficerFinderFlow',
    inputSchema: KrishiOfficerFinderInputSchema,
    outputSchema: KrishiOfficerFinderOutputSchema,
  },
  async (input) => {
    const upazila = input.upazila.trim();
    const zila = input.zila.trim();
    const mobilePreferred = !!input.mobilePreferred;

    const query = `${upazila} Upazila Agriculture Office contact ${zila} Bangladesh site:gov.bd OR site:dae.gov.bd OR site:extension.gov.bd OR "Upazila Agriculture Officer"`;

    if (DEBUG) {
      console.debug('[krishi-officer-finder] DEBUG enabled');
      console.debug('[krishi-officer-finder] mobilePreferred?', mobilePreferred);
      console.debug('[krishi-officer-finder] GOOGLE_API_KEY present?', !!GOOGLE_API_KEY);
      console.debug('[krishi-officer-finder] GOOGLE_CSE_ID present?', !!GOOGLE_CSE_ID);
      console.debug('[krishi-officer-finder] Query:', query);
    }

    let searchJson: any = { items: [] };
    try {
      searchJson = await googleCustomSearch(query, MAX_SEARCH_RESULTS);
      if (DEBUG) console.debug('[krishi-officer-finder] searchJson items length:', Array.isArray(searchJson.items) ? searchJson.items.length : 0);
    } catch (err) {
      console.warn('Google Custom Search error:', (err as Error).message);
      searchJson = { items: [] };
    }

    const items = Array.isArray(searchJson.items) ? searchJson.items : [];

    // Helper to format a verified output with verified=true
    function verifiedWrap(obj: any): KrishiOfficerFinderOutput {
      return {
        name: obj.name ?? null,
        designation: obj.designation ?? null,
        contactNumber: obj.contactNumber ?? null,
        officeAddress: obj.officeAddress ?? null,
        sourceUrl: obj.sourceUrl ?? null,
        verified: true,
      };
    }

    if (items.length === 0) {
      // No discovered pages -> strict Gemini-only lookup first.
      if (DEBUG) console.debug('[krishi-officer-finder] No search items - trying strict Gemini');

      const geminiStrict = await geminiDirectLookupStrict(zila, upazila);
      if (geminiStrict && Object.values(geminiStrict).some((v) => v !== null)) {
        return verifiedWrap(geminiStrict);
      }

      // If mobilePreferred, attempt a best-effort pass
      if (mobilePreferred) {
        if (DEBUG) console.debug('[krishi-officer-finder] strict returned nulls - trying best-effort for mobile');
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          // Normalize best-effort response into our schema; mark verified=false
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          // Attach confidence note into sourceUrl if no sourceUrl provided (compact)
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
        return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, reason: 'gemini_best_effort_no_output' });
      }

      // Not mobilePreferred -> return not found / strict nulls
      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, reason: 'strict_no_output' });
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

    if (DEBUG) console.debug('[krishi-officer-finder] candidates length:', candidates.length);

    if (candidates.length === 0) {
      // If we couldn't fetch any candidate pages, behave like above.
      if (DEBUG) console.debug('[krishi-officer-finder] No candidates fetched - falling back');

      const geminiStrict = await geminiDirectLookupStrict(zila, upazila);
      if (geminiStrict && Object.values(geminiStrict).some((v) => v !== null)) {
        return verifiedWrap(geminiStrict);
      }

      if (mobilePreferred) {
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
        return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, reason: 'no_candidates_and_best_effort_failed' });
      }

      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, reason: 'no_candidates_strict_only' });
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

Now, using the provided PAGE snippets below, find the best values for these fields. If different pages provide different fields, choose the page that offers the most complete combination and set sourceUrl to that page's URL. If multiple pages are equally good, choose the one that looks more authoritative (gov.bd or dae.gov.bd). If a field cannot be found in any snippet, set it to null.

Begin. Produce ONLY the JSON object.
`;

    const prompt = `${instruction}\n\nCONTEXT: Zila="${zila}", Upazila="${upazila}"\n\n${combinedSnippets}`;

    if (DEBUG) console.debug('[krishi-officer-finder] Sending prompt to Gemini, combinedSnippets length:', combinedSnippets.length);

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
      output: { schema: KrishiOfficerFinderOutputSchema.omit({ verified: true }) },
      params: { temperature: 0.0, maxOutputTokens: 800 },
    });

    if (!output) {
      // If mobilePreferred, attempt best-effort even when snippets failed to produce strict JSON.
      if (mobilePreferred) {
        if (DEBUG) console.debug('[krishi-officer-finder] strict snippet extraction yielded no output - trying best-effort');
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
      }

      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, reason: 'gemini_no_output_after_snippets' });
    }

    // If Gemini returned all nulls and mobilePreferred is true, try a best-effort pass
    if (Object.values(output).every((v) => v === null)) {
      if (mobilePreferred) {
        if (DEBUG) console.debug('[krishi-officer-finder] gemini returned all nulls - trying best-effort for mobile');
        const best = await geminiBestEffortLookup(zila, upazila);
        if (best) {
          const result = {
            name: best.name ?? null,
            designation: best.designation ?? null,
            contactNumber: best.contactNumber ?? null,
            officeAddress: best.officeAddress ?? null,
            sourceUrl: best.sourceUrl ?? null,
            verified: false,
          };
          if (!result.sourceUrl && best.confidenceNote) {
            result.sourceUrl = `UNVERIFIED_NOTE:${String(best.confidenceNote).slice(0, 400)}`;
          }
          return result;
        }
      }

      return notFoundResponse({ googleAvailable: !!GOOGLE_API_KEY && !!GOOGLE_CSE_ID, itemsCount: items.length, candidatesCount: candidates.length, geminiOutput: output });
    }

    // Normal verified output
    return {
      name: output.name ?? null,
      designation: output.designation ?? null,
      contactNumber: output.contactNumber ?? null,
      officeAddress: output.officeAddress ?? null,
      sourceUrl: output.sourceUrl ?? null,
      verified: true,
    };
  }
);
