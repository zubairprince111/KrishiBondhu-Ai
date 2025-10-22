
'use server';

/**
 * @fileOverview Analyzes an image of a diseased crop and provides potential solutions in Bangla.
 *
 * - aiCropDoctorAnalysis - A function that analyzes crop symptoms and provides solutions in Bangla.
 */

import { ai } from '@/ai/genkit';
import {z} from 'genkit';


const AiCropDoctorInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the diseased crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const AiCropDoctorOutputSchema = z.object({
  diagnosis: z.string().describe('The diagnosis of the crop disease in Bangla.'),
  solutions: z.array(z.string()).describe('A list of at least 3 potential solutions to the crop disease in Bangla.'),
});

export async function aiCropDoctorAnalysis(input: z.infer<typeof AiCropDoctorInputSchema>): Promise<z.infer<typeof AiCropDoctorOutputSchema>> {
  return aiCropDoctorAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCropDoctorPrompt',
  input: {schema: AiCropDoctorInputSchema},
  output: {schema: AiCropDoctorOutputSchema},
  prompt: `You are an expert agricultural advisor specializing in diagnosing crop diseases and providing solutions in Bangla.

You will analyze the provided image of the diseased crop and provide a diagnosis and a list of at least 3 potential solutions in Bangla.

Crop Image: {{media url=photoDataUri}}

Respond entirely in the Bangla language.
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
