
'use server';

/**
 * @fileOverview An AI flow that provides farming advice based on weather conditions.
 *
 * - getWeatherAdvice - A function that returns a helpful tip based on the weather.
 */

import { ai } from '@/ai/genkit';
import {z} from 'genkit';


const WeatherAdvisorInputSchema = z.object({
  condition: z.string().describe('The weather condition, e.g., "Sunny", "Partly Cloudy", "Rainy".'),
  temperature: z.number().describe('The temperature in Celsius.'),
  wind: z.string().describe('The wind speed, e.g., "12 km/h".'),
});
type WeatherAdvisorInput = z.infer<typeof WeatherAdvisorInputSchema>;

const WeatherAdvisorOutputSchema = z.object({
  advice: z.string().describe('A short, actionable piece of advice for a farmer in Bangladesh based on the weather.'),
});
type WeatherAdvisorOutput = z.infer<typeof WeatherAdvisorOutputSchema>;

export async function getWeatherAdvice(input: WeatherAdvisorInput): Promise<WeatherAdvisorOutput> {
  return weatherAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weatherAdvisorPrompt',
  input: {schema: WeatherAdvisorInputSchema},
  output: {schema: WeatherAdvisorOutputSchema},
  prompt: `You are an agricultural advisor for farmers in Bangladesh.
Based on the following weather information, provide a single, short, actionable piece of advice.
Keep the advice practical and easy to understand. Respond in English.

Weather Condition: {{{condition}}}
Temperature: {{{temperature}}}°C
Wind: {{{wind}}}
`,
});

const weatherAdvisorFlow = ai.defineFlow(
  {
    name: 'weatherAdvisorFlow',
    inputSchema: WeatherAdvisorInputSchema,
    outputSchema: WeatherAdvisorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
