'use server';

/**
 * @fileOverview A flow that suggests optimal crops for a given season and region based on soil type and climate data.
 *
 * - suggestOptimalCrops - A function that takes soil type and climate data as input and returns a list of suggested crops.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimalCropSuggestionInputSchema = z.object({
  soilType: z.string().describe('The type of soil in the region.'),
  localClimateData: z.string().describe('The local climate data for the region.'),
  currentSeason: z.string().describe('The current season.'),
  region: z.string().describe('The region for which to suggest crops.'),
});
type OptimalCropSuggestionInput = z.infer<typeof OptimalCropSuggestionInputSchema>;

const OptimalCropSuggestionOutputSchema = z.object({
  suggestedCrops: z.array(z.string()).describe('A list of 3 suggested crops for the given region and season.'),
  reasoning: z.string().describe('A brief, single-sentence reasoning for why these crops are suitable for the current season and region.'),
});
type OptimalCropSuggestionOutput = z.infer<typeof OptimalCropSuggestionOutputSchema>;

export async function suggestOptimalCrops(input: OptimalCropSuggestionInput): Promise<OptimalCropSuggestionOutput> {
  return suggestOptimalCropsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimalCropSuggestionPrompt',
  input: {schema: OptimalCropSuggestionInputSchema},
  output: {schema: OptimalCropSuggestionOutputSchema},
  prompt: `You are an expert agricultural advisor for Bangladesh. Based on the provided soil type, local climate data, current season, and region, suggest the 3 most optimal crops to plant.

Soil Type: {{{soilType}}}
Local Climate Data: {{{localClimateData}}}
Current Season: {{{currentSeason}}}
Region: {{{region}}}

Consider factors such as yield, market demand, and sustainability.

Output a list of exactly 3 suggested crops and a single sentence of reasoning explaining why these crops are suitable for the season and climate. Respond in the local language if appropriate, but the crop names in the array should be in English for consistency.`,
});

const suggestOptimalCropsFlow = ai.defineFlow(
  {
    name: 'suggestOptimalCropsFlow',
    inputSchema: OptimalCropSuggestionInputSchema,
    outputSchema: OptimalCropSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
