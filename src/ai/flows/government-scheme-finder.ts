'use server';

/**
 * @fileOverview An AI agent for finding government schemes and market details relevant to farmers.
 */

import { ai } from '@/ai/genkit';
import {z} from 'zod';


const GovernmentSchemeFinderInputSchema = z.object({
  crop: z.string().describe('The crop for which to find government schemes and market details.'),
  region: z.string().describe('The region where the farmer is located.'),
});
export type GovernmentSchemeFinderInput = z.infer<typeof GovernmentSchemeFinderInputSchema>;

const GovernmentSchemeFinderOutputSchema = z.object({
  schemes: z.array(z.string()).describe('A list of relevant government schemes and subsidies.'),
  marketDetails: z.string().describe('Details about the local market prices and opportunities for the specified crop.'),
});
export type GovernmentSchemeFinderOutput = z.infer<typeof GovernmentSchemeFinderOutputSchema>;


export const governmentSchemeFinderFlow = ai.defineFlow(
  {
    name: 'governmentSchemeFinderFlow',
    inputSchema: GovernmentSchemeFinderInputSchema,
    outputSchema: GovernmentSchemeFinderOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `You are an AI assistant helping farmers find relevant government schemes, subsidies, and market details for their crops.

  Provide a list of schemes relevant to the specified crop and region.
  Also, provide details about the local market prices and opportunities for the specified crop in the specified region.

  Crop: ${input.crop}
  Region: ${input.region}
  `,
      output: { schema: GovernmentSchemeFinderOutputSchema },
    });

    return output!;
  }
);
