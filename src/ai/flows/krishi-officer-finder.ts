'use server';

// NOTE: The `google:search` tool is an external capability provided to the model/executor, 
// not a function you define in this file. The tool is invoked via the instructions.

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
  // Note: 'verified' removed for simplicity, as all extracted data comes from search snippets.
});
export type KrishiOfficerFinderOutput = z.infer<typeof KrishiOfficerFinderOutputSchema>;

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

    // The key instruction is now to use the Google Search tool BEFORE extraction.
    const query = `${upazila} Upazila Agriculture Officer contact ${zila} Bangladesh site:gov.bd OR site:dae.gov.bd OR "Upazila Agriculture Officer"`;
    
    // The instruction must guide the model to use the tool and then perform strict extraction
    const instruction = `
      You are an expert Krishi Officer finder. Your task is to use the **Google Search Tool** to find the most recent contact information for the Upazila Agriculture Officer in "${upazila}" Upazila, "${zila}" Zila, Bangladesh.

      **STEPS:**
      1. **Search:** Use the provided search query to get up-to-date web page snippets.
      2. **Extract:** Based ONLY on the returned search snippets, extract the required contact details.
      
      **STRICT EXTRACTION RULES (Must follow):**
      - **DO NOT INVENT, HALLUCINATE, or GUESS.** Only extract values that are explicitly present in the search snippets.
      - If a field is not present in any snippet, set that field to **null**.
      - Set \`sourceUrl\` to the URL of the snippet that provided the most complete and relevant information.
      - Output must be a single JSON object and **NOTHING ELSE** (no commentary or extra text).
      
      **Search Query to use:** "${query}"
    `;

    // 1) The 'ai.generate' call now implicitly invokes the search tool based on the instruction.
    const { output } = await ai.generate({
      // We rely on the 'ai' wrapper to handle the tool use and structured output enforcement.
      model: 'googleai/gemini-2.5-flash', 
      prompt: instruction,
      output: { schema: KrishiOfficerFinderOutputSchema },
      params: { temperature: 0.0 }, // Keep temperature low for reliable extraction
    });

    // 2) If the model fails to output valid JSON or finds no data, return nulls.
    if (!output || Object.values(output).every(v => v === null)) {
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
