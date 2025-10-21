// src/ai/ai-crop-doctor-analysis.ts
'use server';

/**
 * @fileOverview Analyzes an image of a diseased crop and provides potential solutions in Bangla.
 *
 * - aiCropDoctorAnalysis - A function that analyzes crop symptoms and provides solutions in Bangla.
 * - AiCropDoctorInput - The input type for the aiCropDoctorAnalysis function.
 * - AiCropDoctorOutput - The return type for the aiCropDoctorAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCropDoctorInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the diseased crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AiCropDoctorInput = z.infer<typeof AiCropDoctorInputSchema>;

const AiCropDoctorOutputSchema = z.object({
  diagnosis: z.string().describe('The diagnosis of the crop disease in Bangla.'),
  solutions: z.string().describe('Potential solutions to the crop disease in Bangla.'),
});
export type AiCropDoctorOutput = z.infer<typeof AiCropDoctorOutputSchema>;

export async function aiCropDoctorAnalysis(input: AiCropDoctorInput): Promise<AiCropDoctorOutput> {
  return aiCropDoctorAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCropDoctorPrompt',
  input: {schema: AiCropDoctorInputSchema},
  output: {schema: AiCropDoctorOutputSchema},
  prompt: `You are an expert agricultural advisor specializing in diagnosing crop diseases and providing solutions in Bangla.

You will analyze the provided image of the diseased crop and provide a diagnosis and potential solutions in Bangla.

Crop Image: {{media url=photoDataUri}}

Respond in Bangla.
`,
});

const aiCropDoctorAnalysisFlow = ai.defineFlow(
  {
    name: 'aiCropDoctorAnalysisFlow',
    inputSchema: AiCropDoctorInputSchema,
    outputSchema: AiCropDoctorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
