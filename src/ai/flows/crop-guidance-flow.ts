// /genkit/cropGuidanceFlow.ts

'use server';

/**
 * @fileOverview A flow that provides step-by-step guidance for a selected crop.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// --- SCHEMAS ---
const CropGuidanceInputSchema = z.object({
  cropName: z.string().describe('The name of the crop (e.g., "Jute").'),
  region: z.string().describe('The region where the crop is being grown (e.g., "Mymensingh").'),
  currentStage: z.string().describe('The current growth stage of the crop (e.g., Sowing, Vegetative, Flowering).'),
});
export type CropGuidanceInput = z.infer<typeof CropGuidanceInputSchema>;

const GuidanceStepSchema = z.object({
  title: z.string().describe('The title of the guidance step.'),
  details: z.string().describe('A detailed description of the tasks and considerations for this step.'),
  isCompleted: z.boolean().describe('Whether this step is completed. MUST be true if the stage is before or the same as the currentStage.'),
  durationInDays: z.number().describe('The typical duration of this stage in days (MUST be a number).'),
});

const CropGuidanceOutputSchema = z.object({
  guidance: z.array(GuidanceStepSchema).describe('An array of step-by-step guidance for the crop lifecycle.'),
});
export type CropGuidanceOutput = z.infer<typeof CropGuidanceOutputSchema>;

// --- FLOW DEFINITION ---
export const cropGuidanceFlow = ai.defineFlow(
  {
    name: 'cropGuidanceFlow',
    inputSchema: CropGuidanceInputSchema,
    outputSchema: CropGuidanceOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert agricultural advisor for Bangladesh. Provide a comprehensive, step-by-step guide for growing the specified crop in the given region.

**STRICT INSTRUCTIONS:**
1. Cover the entire lifecycle from land preparation to post-harvest.
2. The farmer's crop is currently at the '${input.currentStage}' stage. Mark the 'isCompleted' field as **true** for all stages that are before or the same as the current stage.
3. For each stage, the 'durationInDays' MUST be a **single integer number** representing the average duration.
4. Provide detailed, actionable advice regarding irrigation, fertilizer/pesticide use, and relevant care.
5. Region: ${input.region}
6. Crop: ${input.cropName}

**Required Stages for Guidance Array:**
1. Land Preparation
2. Seed Sowing
3. Germination & Early Growth
4. Vegetative Growth
5. Flowering & Fruiting
6. Harvesting
7. Post-Harvest`;

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
      output: {
        schema: CropGuidanceOutputSchema,
        format: 'json',
      },
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error("AI failed to generate crop guidance. Check API connection and prompt compliance.");
    }

    return output as CropGuidanceOutput;
  }
);
