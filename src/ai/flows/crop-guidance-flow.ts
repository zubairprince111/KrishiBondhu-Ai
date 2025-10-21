'use server';

/**
 * @fileOverview A flow that provides step-by-step guidance for a selected crop.
 *
 * - getCropGuidance - A function that takes crop details and returns tailored guidance.
 * - CropGuidanceInput - The input type for the getCropGuidance function.
 * - CropGuidanceOutput - The return type for the getCropGuidance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CropGuidanceInputSchema = z.object({
  cropName: z.string().describe('The name of the crop.'),
  region: z.string().describe('The region where the crop is being grown.'),
  currentStage: z.string().describe('The current growth stage of the crop (e.g., Sowing, Vegetative, Flowering).'),
});
export type CropGuidanceInput = z.infer<typeof CropGuidanceInputSchema>;

const GuidanceStepSchema = z.object({
    title: z.string().describe('The title of the guidance step.'),
    details: z.string().describe('A detailed description of the tasks and considerations for this step.'),
    isCompleted: z.boolean().describe('Whether this step is considered completed based on the current stage.')
});

const CropGuidanceOutputSchema = z.object({
  guidance: z.array(GuidanceStepSchema).describe('An array of step-by-step guidance for the crop lifecycle.'),
});
export type CropGuidanceOutput = z.infer<typeof CropGuidanceOutputSchema>;

export async function getCropGuidance(input: CropGuidanceInput): Promise<CropGuidanceOutput> {
  return cropGuidanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cropGuidancePrompt',
  input: {schema: CropGuidanceInputSchema},
  output: {schema: CropGuidanceOutputSchema},
  prompt: `You are an expert agricultural advisor for Bangladesh. Provide a comprehensive, step-by-step guide for growing the specified crop in the given region.

The guide should cover the entire lifecycle from land preparation to post-harvest.
The user is currently at the '{{{currentStage}}}' stage. Mark all stages up to and including the current stage as completed.

Crop: {{{cropName}}}
Region: {{{region}}}

Generate guidance with the following stages:
1. Land Preparation
2. Seed Sowing
3. Germination & Early Growth
4. Vegetative Growth
5. Flowering & Fruiting
6. Harvesting
7. Post-Harvest

For each stage, provide a title and detailed, actionable advice regarding irrigation, fertilizer/pesticide use, and other relevant care. Respond in a way that is easy for a farmer to understand. Use Bangla where appropriate for key terms if it helps clarity, but the main response should be in English.
`,
});

const cropGuidanceFlow = ai.defineFlow(
  {
    name: 'cropGuidanceFlow',
    inputSchema: CropGuidanceInputSchema,
    outputSchema: CropGuidanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
