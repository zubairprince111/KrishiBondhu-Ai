'use server';

/**
 * @fileOverview A flow that suggests optimal crops for a given season and region based on soil type and climate data.
 */

import { ai } from '@/ai/genkit';
import {z} from 'zod';


const OptimalCropSuggestionInputSchema = z.object({
  soilType: z.string().describe('The type of soil in the region.'),
  localClimateData: z.string().describe('The local climate data for the region.'),
  currentSeason: z.string().describe('The current season.'),
  region: z.string().describe('The region or lat/long coordinates for which to suggest crops.'),
});
export type OptimalCropSuggestionInput = z.infer<typeof OptimalCropSuggestionInputSchema>;

const CropSuggestionSchema = z.object({
    cropName: z.string().describe('The English name of the suggested crop.'),
    variety: z.string().describe('A suitable, specific variety of the crop for the region.'),
    suitabilityScore: z.number().describe('A score from 0 to 100 indicating how suitable the crop is for the given conditions.'),
});

const OptimalCropSuggestionOutputSchema = z.object({
  suggestedCrops: z.array(CropSuggestionSchema).describe('A ranked list of exactly 3 suggested crops, from best to worst.'),
  reasoning: z.string().describe('A brief, single-sentence reasoning for why these crops are suitable for the current season and region.'),
});
export type OptimalCropSuggestionOutput = z.infer<typeof OptimalCropSuggestionOutputSchema>;


export const suggestOptimalCropsFlow = ai.defineFlow(
  {
    name: 'suggestOptimalCropsFlow',
    inputSchema: OptimalCropSuggestionInputSchema,
    outputSchema: OptimalCropSuggestionOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'optimalCropSuggestionPrompt',
      input: {schema: OptimalCropSuggestionInputSchema},
      output: {schema: OptimalCropSuggestionOutputSchema},
      prompt: `You are an expert agricultural advisor for Bangladesh. Based on the provided location and the current season's weather, suggest the 3 most optimal crops to plant, ranked from best to worst.

If a specific lat/long is provided, use it for fine-tuned suggestions. Otherwise, use the general region name.

Location (Region or Lat/Long): {{{region}}}
Current Season: {{{currentSeason}}}
Typical Climate for this Season: {{{localClimateData}}}
Assumed Soil Type: {{{soilType}}}

For each crop, provide its name in English, a suitable high-yield variety, and a suitability score from 0-100.
Consider factors like water requirements, temperature tolerance, yield, profitability, market demand, and sustainability for the specified location and season.

Output a ranked list of exactly 3 suggested crops and a single sentence of reasoning explaining why these crops are suitable overall.`,
    });

    const {output} = await prompt(input);
    return output!;
  }
);
