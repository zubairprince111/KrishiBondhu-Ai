
'use server';

/**
 * @fileOverview An AI agent for finding real-time market prices for crops in Bangladesh.
 *
 * - findMarketPrices - A function that returns current market prices.
 */

import { getAi } from '@/ai/genkit';
import {z} from 'genkit';

const ai = getAi();

const MarketPriceSchema = z.object({
  crop: z.string().describe('The name of the crop in both English and Bengali.'),
  price: z.string().describe('The current market price with units, e.g., ৳1,200 / কুইন্টাল.'),
  location: z.string().describe('The market location, e.g., Dhaka.'),
});

const MarketPriceFinderInputSchema = z.object({
   region: z.string().describe('The region in Bangladesh to find market prices for. If empty, find for major markets.'),
});
type MarketPriceFinderInput = z.infer<typeof MarketPriceFinderInputSchema>;

const MarketPriceFinderOutputSchema = z.object({
  prices: z.array(MarketPriceSchema).describe('A list of current market prices for various crops.'),
});
type MarketPriceFinderOutput = z.infer<typeof MarketPriceFinderOutputSchema>;

const getMarketPricesTool = ai.defineTool(
    {
        name: 'getRealTimeMarketPrices',
        description: 'Get real-time agricultural market prices for a given region in Bangladesh from the web.',
        inputSchema: MarketPriceFinderInputSchema,
        outputSchema: MarketPriceFinderOutputSchema,
    },
    async (input) => {
        // In a real application, this tool would make an API call to a market data provider
        // or use a web scraping service to get live data.
        // For this demo, we will return realistic but simulated data.
        console.log(`Simulating search for market prices in: ${input.region}`);
        return {
            prices: [
                { crop: 'ধান (Paddy)', price: '৳1,250 / কুইন্টাল', location: 'ঢাকা' },
                { crop: 'আলু (Potato)', price: '৳28 / কেজি', location: 'রাজশাহী' },
                { crop: 'পাট (Jute)', price: '৳2,550 / মণ', location: 'খুলনা' },
                { crop: 'গম (Wheat)', price: '৳32 / কেজি', location: 'রংপুর' },
                { crop: 'টমেটো (Tomato)', price: '৳45 / কেজি', location: 'চট্টগ্রাম' },
                { crop: 'পিঁয়াজ (Onion)', price: '৳85 / কেজি', location: 'ঢাকা' },
                { crop: 'মসুর ডাল (Lentil)', price: '৳130 / কেজি', location: 'খুলনা' },
            ]
        };
    }
);

const marketPriceFinderPrompt = ai.definePrompt({
  name: 'marketPriceFinderPrompt',
  tools: [getMarketPricesTool],
  prompt: `You are an AI assistant that provides real-time agricultural market prices in Bangladesh. Use the provided tool to get the current market prices for the specified region.

Region: {{{region}}}
`,
});

const marketPriceFinderFlow = ai.defineFlow(
  {
    name: 'marketPriceFinderFlow',
    inputSchema: MarketPriceFinderInputSchema,
    outputSchema: MarketPriceFinderOutputSchema,
  },
  async (input) => {
    const llmResponse = await marketPriceFinderPrompt(input);
    const toolRequest = llmResponse.toolRequest();

    if (!toolRequest) {
      // This case is unlikely if the prompt is well-defined, but it's good practice to handle it.
      // We can try to generate a response without the tool.
      const fallbackResponse = await ai.generate({
          prompt: `Generate a list of typical market prices for crops in ${input.region}, Bangladesh.`,
          output: { schema: MarketPriceFinderOutputSchema },
      });
      return fallbackResponse.output!;
    }
    
    // Call the tool. In a real scenario, this would be where you execute the tool's logic.
    const toolResponse = await llmResponse.forward(toolRequest);

    // Send the tool's response back to the model.
    const finalResponse = await marketPriceFinderPrompt(input, {toolResponse});

    return finalResponse.output!;
  }
);


export async function findMarketPrices(input: MarketPriceFinderInput): Promise<MarketPriceFinderOutput> {
  return marketPriceFinderFlow(input);
}
