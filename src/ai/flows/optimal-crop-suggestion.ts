
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

const CropSuggestionSchema = z.object({
    cropName: z.string().describe('The English name of the suggested crop.'),
    variety: z.string().describe('A suitable, specific variety of the crop for the region.'),
    suitabilityScore: z.number().describe('A score from 0 to 100 indicating how suitable the crop is for the given conditions.'),
});

const OptimalCropSuggestionOutputSchema = z.object({
  suggestedCrops: z.array(CropSuggestionSchema).describe('A ranked list of exactly 3 suggested crops, from best to worst.'),
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
  prompt: `You are an expert agricultural advisor for Bangladesh. Based on the user's location and the current season's weather, suggest the 3 most optimal crops to plant, ranked from best to worst.

For each crop, provide its name in English, a suitable high-yield variety, and a suitability score from 0-100.

Location (Region): {{{region}}}
Current Season: {{{currentSeason}}}
Typical Climate for this Season: {{{localClimateData}}}
Assumed Soil Type: {{{soilType}}}

Consider factors like water requirements, temperature tolerance, yield, profitability, market demand, and sustainability for the specified location and season.

Output a ranked list of exactly 3 suggested crops and a single sentence of reasoning explaining why these crops are suitable overall.`,
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
