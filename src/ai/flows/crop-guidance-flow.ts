'use server';



/**

 * @fileOverview A flow that provides step-by-step guidance for a selected crop.

 */



import { ai } from '@/ai/genkit';

import {z} from 'zod';





const CropGuidanceInputSchema = z.object({

  cropName: z.string().describe('The name of the crop.'),

  region: z.string().describe('The region where the crop is being grown.'),

  currentStage: z.string().describe('The current growth stage of the crop (e.g., Sowing, Vegetative, Flowering). This is calculated from sowing date.'),

});

export type CropGuidanceInput = z.infer<typeof CropGuidanceInputSchema>;



const GuidanceStepSchema = z.object({

    title: z.string().describe('The title of the guidance step.'),

    details: z.string().describe('A detailed description of the tasks and considerations for this step.'),

    isCompleted: z.boolean().describe('Whether this step is considered completed based on the current stage.'),

    durationInDays: z.number().describe('The typical duration of this stage in days.'),

});



const CropGuidanceOutputSchema = z.object({

  guidance: z.array(GuidanceStepSchema).describe('An array of step-by-step guidance for the crop lifecycle.'),

});

export type CropGuidanceOutput = z.infer<typeof CropGuidanceOutputSchema>;





export const cropGuidanceFlow = ai.defineFlow(

  {

    name: 'cropGuidanceFlow',

    inputSchema: CropGuidanceInputSchema,

    outputSchema: CropGuidanceOutputSchema,

  },

  async (input) => {

    const { output } = await ai.generate({

      model: 'googleai/gemini-2.5-flash',

      prompt: `You are an expert agricultural advisor for Bangladesh. Provide a comprehensive, step-by-step guide for growing the specified crop in the given region.



The guide should cover the entire lifecycle from land preparation to post-harvest.

The farmer's crop is currently at the '${input.currentStage}' stage. Mark all stages up to and including the current stage as completed.



For each stage, provide a title, detailed actionable advice, and a typical duration in days.



Crop: ${input.cropName}

Region: ${input.region}



Generate guidance with the following stages:

1. Land Preparation

2. Seed Sowing

3. Germination & Early Growth

4. Vegetative Growth

5. Flowering & Fruiting

6. Harvesting

7. Post-Harvest



For each stage, provide a title, detailed, actionable advice regarding irrigation, fertilizer/pesticide use, and other relevant care, and its typical duration in days. Respond in a way that is easy for a farmer to understand. Use Bangla where appropriate for key terms if it helps clarity, but the main response should be in English.

`,

      output: { schema: CropGuidanceOutputSchema },

    });

    

    return output!;

  }

);
