// /genkit/cropGuidanceFlow.ts

'use server';

/**
 * @fileOverview A flow that provides step-by-step guidance for a selected crop.
 */

// ✅ FIX: Ensure this is the import path for your centralized Genkit initialization.
import { ai } from '@/ai/genkit'; 
import { z } from 'zod';

// --- SCHEMAS (Unchanged) ---
const CropGuidanceInputSchema = z.object({
  cropName: z.string(),
  region: z.string(),
  currentStage: z.string(),
});
export type CropGuidanceInput = z.infer<typeof CropGuidanceInputSchema>;

const GuidanceStepSchema = z.object({
    title: z.string(),
    details: z.string(),
    isCompleted: z.boolean(),
    durationInDays: z.number(),
});

const CropGuidanceOutputSchema = z.object({
  guidance: z.array(GuidanceStepSchema),
});
export type CropGuidanceOutput = z.infer<typeof CropGuidanceOutputSchema>;

// ✅ FIX: Directly export the flow definition.
export const cropGuidanceFlow = ai.defineFlow( 
  {
    name: 'cropGuidanceFlow',
    inputSchema: CropGuidanceInputSchema,
    outputSchema: CropGuidanceOutputSchema,
  },
  async (input) => {
    
    const prompt = `You are an expert agricultural advisor for Bangladesh. Provide a comprehensive, step-by-step guide for growing the specified crop... 
    // ... (Your detailed prompt here) ...
    `;

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: prompt,
      output: { 
          schema: CropGuidanceOutputSchema,
          format: 'json', // Keep this to ensure reliable JSON output
      },
    });
    
    const output = llmResponse.output();

    if (!output) {
      throw new Error("AI failed to generate crop guidance.");
    }
    
    return output as CropGuidanceOutput;
  }
);
