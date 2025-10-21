'use server';

/**
 * @fileOverview A flow that suggests optimal crops for a given season and region based on soil type and climate data.
 *
 * - suggestOptimalCrops - A function that takes soil type and climate data as input and returns a list of suggested crops.
 * - OptimalCropSuggestionInput - The input type for the suggestOptimalCrops function.
 * - OptimalCropSuggestionOutput - The return type for the suggestOptimalCrops function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimalCropSuggestionInputSchema = z.object({
  soilType: z.string().describe('The type of soil in the region.'),
  localClimateData: z.string().describe('The local climate data for the region.'),
  currentSeason: z.string().describe('The current season.'),
  region: z.string().describe('The region for which to suggest crops.'),
});
export type OptimalCropSuggestionInput = z.infer<typeof OptimalCropSuggestionInputSchema>;

const OptimalCropSuggestionOutputSchema = z.object({
  suggestedCrops: z.array(z.string()).describe('A list of suggested crops for the given region and season.'),
  reasoning: z.string().describe('The reasoning behind the crop suggestions.'),
});
export type OptimalCropSuggestionOutput = z.infer<typeof OptimalCropSuggestionOutputSchema>;

export async function suggestOptimalCrops(input: OptimalCropSuggestionInput): Promise<OptimalCropSuggestionOutput> {
  return suggestOptimalCropsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimalCropSuggestionPrompt',
  input: {schema: OptimalCropSuggestionInputSchema},
  output: {schema: OptimalCropSuggestionOutputSchema},
  prompt: `You are an expert agricultural advisor. Based on the provided soil type, local climate data, current season, and region, suggest the most optimal crops to plant.

Soil Type: {{{soilType}}}
Local Climate Data: {{{localClimateData}}}
Current Season: {{{currentSeason}}}
Region: {{{region}}}

Consider factors such as yield, market demand, and sustainability.

Output a list of suggested crops and the reasoning behind each suggestion.`,
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
