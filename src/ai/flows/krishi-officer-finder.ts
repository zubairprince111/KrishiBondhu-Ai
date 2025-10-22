
'use server';

/**
 * @fileOverview An AI agent for finding Krishi (Agricultural) Officer details for a specific Zila and Upazila in Bangladesh.
 */

import { getAi } from '@/ai/genkit';
import {z} from 'genkit';

const ai = getAi();

const KrishiOfficerFinderInputSchema = z.object({
  zila: z.string().describe('The Zila (District) in Bangladesh.'),
  upazila: z.string().describe('The Upazila (Sub-district) in Bangladesh.'),
});
type KrishiOfficerFinderInput = z.infer<typeof KrishiOfficerFinderInputSchema>;

const KrishiOfficerFinderOutputSchema = z.object({
  name: z.string().describe('The name of the Krishi Officer.'),
  designation: z.string().describe('The official designation of the officer (e.g., Upazila Agriculture Officer).'),
  contactNumber: z.string().describe('A realistic, sample contact phone number.'),
  officeAddress: z.string().describe('The address of the Upazila Agriculture Office.'),
});
type KrishiOfficerFinderOutput = z.infer<typeof KrishiOfficerFinderOutputSchema>;

export async function findKrishiOfficer(input: KrishiOfficerFinderInput): Promise<KrishiOfficerFinderOutput> {
  return krishiOfficerFinderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'krishiOfficerFinderPrompt',
  input: {schema: KrishiOfficerFinderInputSchema},
  output: {schema: KrishiOfficerFinderOutputSchema},
  prompt: `You are a directory assistant for the Department of Agricultural Extension, Bangladesh.
Your task is to provide contact details for the designated agricultural officer for a given area.
Generate a realistic but fictional name and contact details for the officer in the specified location.

Zila: {{{zila}}}
Upazila: {{{upazila}}}

Provide the officer's name, their designation (e.g., Upazila Agriculture Officer), a sample phone number, and the office address.
Respond in English.

CONCRETE_EXAMPLE:
Input: { "zila": "Cumilla", "upazila": "Daudkandi" }
Output: {
  "name": "Mr. Abdullah Al Masud",
  "designation": "Upazila Agriculture Officer",
  "contactNumber": "017-XXXX-XXXX",
  "officeAddress": "Upazila Agriculture Office, Daudkandi, Cumilla"
}
END_OF_EXAMPLE
`,
});

const krishiOfficerFinderFlow = ai.defineFlow(
  {
    name: 'krishiOfficerFinderFlow',
    inputSchema: KrishiOfficerFinderInputSchema,
    outputSchema: KrishiOfficerFinderOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
