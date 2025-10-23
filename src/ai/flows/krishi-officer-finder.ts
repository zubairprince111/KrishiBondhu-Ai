'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * Simplified Gemini-only variant:
 * - No Google CSE or fetchHtml usage.
 * - Calls Gemini strict extraction first (internal knowledge only).
 * - If strict yields nothing and mobilePreferred=true, calls best-effort Gemini.
 * - Marks verified=true only if Gemini returned a non-null sourceUrl (authoritative).
 */

const KrishiOfficerFinderInputSchema = z.object({
  zila: z.string().describe('The Zila (District) in Bangladesh.'),
  upazila: z.string().describe('The Upazila (Sub-district) in Bangladesh.'),
  mobilePreferred: z.boolean().optional().describe('If true, allow a best-effort (unverified) fallback from Gemini when strict extraction fails.'),
});
export type KrishiOfficerFinderInput = z.infer<typeof KrishiOfficerFinderInputSchema>;

const KrishiOfficerFinderOutputSchema = z.object({
  name: z.string().nullable().describe('The name of the Krishi Officer if found, otherwise null.'),
  designation: z.string().nullable().describe('The official designation of the officer (e.g., Upazila Agriculture Officer), if found.'),
  contactNumber: z.string().nullable().describe('A phone number found on authoritative pages, if any.'),
  officeAddress: z.string().nullable().describe('The address of the Upazila Agriculture Office, if found.'),
  sourceUrl: z.string().nullable().describe('The source URL from which the information was extracted.'),
  verified: z.boolean().describe('true if the result is verified from an authoritative sourceUrl reported by Gemini; false otherwise'),
});
export type KrishiOfficerFinderOutput = z.infer<typeof KrishiOfficerFinderOutputSchema>;

/* ------------------ Config ------------------ */

const DEBUG = process.env.DEBUG_KOFLOW === '1';

/* ------------------ Gemini calls ------------------ */

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

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: instruction,
      output: { schema: KrishiOfficerFinderOutputSchema.omit({ verified: true }) },
      params: { temperature: 0.0, maxOutputTokens: 800 },
    });
    if (DEBUG) console.debug('[krishi-officer-finder] geminiDirectLookupStrict output', output);
    return output ?? null;
  } catch (err: any) {
    if (DEBUG) console.debug('[krishi-officer-finder] geminiDirectLookupStrict error', err?.message || err);
    return null;
  }
}

async function geminiBestEffortLookup(zila: string, upazila: string) {
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

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: instruction,
      params: { temperature: 0.2, maxOutputTokens: 800 },
    });
    if (DEBUG) console.debug('[krishi-officer-finder] geminiBestEffortLookup output', output);
    return (output as any) ?? null;
  } catch (err: any) {
    if (DEBUG) console.debug('[krishi-officer-finder] geminiBestEffortLookup error', err?.message || err);
    return null;
  }
}

/* ------------------ Flow ------------------ */

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

    if (DEBUG) {
      console.debug('[krishi-officer-finder] DEBUG enabled - Gemini-only flow');
      console.debug('[krishi-officer-finder] mobilePreferred?', mobilePreferred);
    }

    // 1) Strict Gemini (internal knowledge only)
    const geminiStrict = await geminiDirectLookupStrict(zila, upazila);
    if (geminiStrict && Object.values(geminiStrict).some((v) => v !== null)) {
      // If Gemini provided a sourceUrl, treat as verified; otherwise treat as unverified.
      const isVerified = typeof geminiStrict.sourceUrl === 'string' && geminiStrict.sourceUrl.length > 0;
      return {
        name: geminiStrict.name ?? null,
        designation: geminiStrict.designation ?? null,
        contactNumber: geminiStrict.contactNumber ?? null,
        officeAddress: geminiStrict.officeAddress ?? null,
        sourceUrl: geminiStrict.sourceUrl ?? null,
        verified: !!isVerified,
      };
    }

    // 2) If strict returned nothing and mobilePreferred requested, try best-effort
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
        // If model gave a confidenceNote but no sourceUrl, embed short note
        if (!result.sourceUrl && (best as any).confidenceNote) {
          result.sourceUrl = `UNVERIFIED_NOTE:${String((best as any).confidenceNote).slice(0, 400)}`;
        }
        return result;
      }
      return notFoundResponse({ reason: 'gemini_best_effort_no_output' });
    }

    // 3) Not mobilePreferred and strict returned nothing
    return notFoundResponse({ reason: 'strict_no_output' });
  }
);
