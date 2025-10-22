'use server';

/**
 * @fileOverview An AI flow that provides farming advice based on weather conditions.
 */

import { ai } from '@/ai/genkit';
import {z} from 'zod';


const WeatherAdvisorInputSchema = z.object({
  condition: z.string().describe('The weather condition, e.g., "Sunny", "Partly Cloudy", "Rainy".'),
  temperature: z.number().describe('The temperature in Celsius.'),
  wind: z.string().describe('The wind speed, e.g., "12 km/h".'),
});
export type WeatherAdvisorInput = z.infer<typeof WeatherAdvisorInputSchema>;

const WeatherAdvisorOutputSchema = z.object({
  advice: z.string().describe('A short, actionable piece of advice for a farmer in Bangladesh based on the weather.'),
});
export type WeatherAdvisorOutput = z.infer<typeof WeatherAdvisorOutputSchema>;


export const weatherAdvisorFlow = ai.defineFlow(
  {
    name: 'weatherAdvisorFlow',
    inputSchema: WeatherAdvisorInputSchema,
    outputSchema: WeatherAdvisorOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `You are an agricultural advisor for farmers in Bangladesh.
Based on the following weather information, provide a single, short, actionable piece of advice.
Keep the advice practical and easy to understand. Respond in English.

Weather Condition: ${input.condition}
Temperature: ${input.temperature}°C
Wind: ${input.wind}
`,
      output: { schema: WeatherAdvisorOutputSchema },
    });
    
    return output!;
  }
);
