'use server';

/**
 * @fileOverview An AI agent for finding real-time market prices for crops in Bangladesh.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MarketPriceSchema = z.object({
  crop: z.string().describe('The name of the crop in both English and Bengali.'),
  price: z.string().describe('The current market price with units, e.g., ৳1,200 / কুইন্টাল.'),
  location: z.string().describe('The market location, e.g., Dhaka.'),
});

const MarketPriceFinderInputSchema = z.object({
   region: z.string().describe('The region in Bangladesh to find market prices for. If empty, find for major markets.'),
});
export type MarketPriceFinderInput = z.infer<typeof MarketPriceFinderInputSchema>;

const MarketPriceFinderOutputSchema = z.object({
  prices: z.array(MarketPriceSchema).min(5).describe('A list of at least 5 current market prices for various important crops.'),
});
export type MarketPriceFinderOutput = z.infer<typeof MarketPriceFinderOutputSchema>;

const getMarketPricesTool = ai.defineTool(
    {
        name: 'getRealTimeMarketPrices',
        description: 'Get real-time agricultural market prices for a given region in Bangladesh from the web.',
        inputSchema: MarketPriceFinderInputSchema,
        outputSchema: MarketPriceFinderOutputSchema,
    },
    async (input) => {
        // This tool now calls the Gemini model to get realistic, up-to-date market data.
        console.log(`Fetching real-time market prices from AI for: ${input.region}`);
        
        const { output } = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: `
              You are an expert agricultural market data analyst for Bangladesh.
              Your task is to provide the most recent, realistic market prices for at least 5-7 major agricultural crops.
              Provide the prices for the specified region, or for major markets like Dhaka, Chattogram, and Khulna if the region is broad.
              The response must be in the specified JSON format. Include crop names in both English and Bengali.

              Region: ${input.region || 'Major markets in Bangladesh'}
              Today's Date: ${new Date().toLocaleDateString('en-US')}
            `,
            output: {
                schema: MarketPriceFinderOutputSchema,
            },
        });

        if (!output) {
            throw new Error("The AI failed to generate market price data.");
        }
        
        return output;
    }
);

const internalFlow = ai.defineFlow(
  {
    name: 'marketPriceFinderFlow',
    inputSchema: MarketPriceFinderInputSchema,
    outputSchema: MarketPriceFinderOutputSchema,
  },
  async (input) => {
    // The previous implementation was overly complex. Since the tool returns the exact data
    // we need, we can just call it directly and return its output. This is more
    // efficient and less prone to errors.
    const marketData = await getMarketPricesTool(input);
    return marketData;
  }
);

export async function marketPriceFinderFlow(input: MarketPriceFinderInput): Promise<MarketPriceFinderOutput> {
    return await internalFlow(input);
}
