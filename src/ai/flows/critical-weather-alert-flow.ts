
'use server';

/**
 * @fileOverview An AI flow that checks for critical weather alerts for a given location.
 */

import { ai } from '@/ai/genkit';
import {z} from 'genkit';


const CriticalWeatherAlertInputSchema = z.object({
  region: z.string().describe('The region or lat/long coordinates to check for alerts.'),
  country: z.string().describe('The country for context, e.g., "Bangladesh".'),
});
export type CriticalWeatherAlertInput = z.infer<typeof CriticalWeatherAlertInputSchema>;

const CriticalWeatherAlertOutputSchema = z.object({
  isCritical: z.boolean().describe('Whether there is a critical weather alert active for the location.'),
  alertTitle: z.string().describe('A short, urgent title for the alert if one exists (e.g., "CRITICAL: Cyclone Warning"). Otherwise, an empty string.'),
  callToActionText: z.string().describe('A short call to action for the user (e.g., "View Details", "Stay Safe").'),
});
export type CriticalWeatherAlertOutput = z.infer<typeof CriticalWeatherAlertOutputSchema>;


export async function getCriticalWeatherAlert(input: CriticalWeatherAlertInput): Promise<CriticalWeatherAlertOutput> {
  return criticalWeatherAlertFlow(input);
}


const prompt = ai.definePrompt({
  name: 'criticalWeatherAlertPrompt',
  input: {schema: CriticalWeatherAlertInputSchema},
  output: {schema: CriticalWeatherAlertOutputSchema},
  prompt: `You are a disaster management expert for {{country}}.
Your task is to determine if there is a *critical* and *imminent* weather-related danger for the specified location.
Consider events like cyclones, severe flooding, extreme heatwaves, or major storm systems. Do not report on normal rain or moderate weather.

Today's Date: ${new Date().toDateString()}
Location: {{{region}}}

Based on this, is there a CRITICAL alert?
If yes, provide a short, urgent title and a brief call to action.
Example: isCritical: true, alertTitle: "CRITICAL: Cyclone Amphan Approaching", callToActionText: "View Affected Areas"
If no, respond with isCritical: false and empty strings for the other fields.
`,
});

const criticalWeatherAlertFlow = ai.defineFlow(
  {
    name: 'criticalWeatherAlertFlow',
    inputSchema: CriticalWeatherAlertInputSchema,
    outputSchema: CriticalWeatherAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
