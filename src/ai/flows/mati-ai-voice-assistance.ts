'use server';

/**
 * @fileOverview A voice assistant AI agent for farmers, named Mati AI.
 */

import { ai } from '@/ai/genkit';
import {z} from 'zod';


const MatiAIVoiceAssistanceInputSchema = z.object({
  query: z.string().describe('The query from the farmer in Bangla.'),
});
export type MatiAIVoiceAssistanceInput = z.infer<
  typeof MatiAIVoiceAssistanceInputSchema
>;

const MatiAIVoiceAssistanceOutputSchema = z.object({
  response: z.string().describe('The response from Mati AI in Bangla.'),
});
export type MatiAIVoiceAssistanceOutput = z.infer<
  typeof MatiAIVoiceAssistanceOutputSchema
>;

export const matiAIVoiceAssistanceFlow = ai.defineFlow(
  {
    name: 'matiAIVoiceAssistanceFlow',
    inputSchema: MatiAIVoiceAssistanceInputSchema,
    outputSchema: MatiAIVoiceAssistanceOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'matiAIVoiceAssistancePrompt',
      input: {schema: MatiAIVoiceAssistanceInputSchema},
      output: {schema: MatiAIVoiceAssistanceOutputSchema},
      prompt: `You are Mati AI, a helpful voice assistant for farmers in Bangladesh. You respond to questions in Bangla.

Farmer's Query: {{{query}}}`,
    });

    const {output} = await prompt(input);
    return output!;
  }
);
