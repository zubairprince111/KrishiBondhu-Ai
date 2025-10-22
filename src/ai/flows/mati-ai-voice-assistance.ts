
'use server';

/**
 * @fileOverview A voice assistant AI agent for farmers, named Mati AI.
 *
 * - matiAIVoiceAssistance - A function that handles the voice assistance process.
 */

import { ai } from '@/ai/genkit';
import {z} from 'genkit';


const MatiAIVoiceAssistanceInputSchema = z.object({
  query: z.string().describe('The query from the farmer in Bangla.'),
});
type MatiAIVoiceAssistanceInput = z.infer<
  typeof MatiAIVoiceAssistanceInputSchema
>;

const MatiAIVoiceAssistanceOutputSchema = z.object({
  response: z.string().describe('The response from Mati AI in Bangla.'),
});
type MatiAIVoiceAssistanceOutput = z.infer<
  typeof MatiAIVoiceAssistanceOutputSchema
>;

export async function matiAIVoiceAssistance(
  input: MatiAIVoiceAssistanceInput
): Promise<MatiAIVoiceAssistanceOutput> {
  return matiAIVoiceAssistanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matiAIVoiceAssistancePrompt',
  input: {schema: MatiAIVoiceAssistanceInputSchema},
  output: {schema: MatiAIVoiceAssistanceOutputSchema},
  prompt: `You are Mati AI, a helpful voice assistant for farmers in Bangladesh. You respond to questions in Bangla.

Farmer's Query: {{{query}}}`,
});

const matiAIVoiceAssistanceFlow = ai.defineFlow(
  {
    name: 'matiAIVoiceAssistanceFlow',
    inputSchema: MatiAIVoiceAssistanceInputSchema,
    outputSchema: MatiAIVoiceAssistanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
