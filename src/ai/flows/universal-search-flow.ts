
'use server';

/**
 * @fileOverview A universal search agent that can answer questions about crops, prices, and provide suggestions.
 */

import { ai } from '@/ai/genkit';
import {z} from 'genkit';
import { findMarketPrices } from './market-price-finder';


const UniversalSearchInputSchema = z.object({
  query: z.string().describe('The user\'s search query.'),
});

const UniversalSearchOutputSchema = z.object({
  title: z.string().describe('A short, descriptive title for the search result.'),
  response: z.string().describe('A detailed and helpful response to the user\'s query, formatted as a string which may include markdown for lists or emphasis.'),
});

export type UniversalSearchInput = z.infer<typeof UniversalSearchInputSchema>;
export type UniversalSearchOutput = z.infer<typeof UniversalSearchOutputSchema>;


const searchTool = ai.defineTool(
    {
        name: 'searchCropInfo',
        description: 'Searches for information about crops, market prices, or farming suggestions based on a user query.',
        inputSchema: UniversalSearchInputSchema,
        outputSchema: z.string(),
    },
    async (input) => {
        // This is a simplified logic. A real implementation might have multiple tools
        // or a more complex retrieval system.
        if (input.query.toLowerCase().includes('price')) {
            const prices = await findMarketPrices({ region: 'Bangladesh' });
            return `Here are the latest market prices: ${prices.prices.map(p => `${p.crop}: ${p.price}`).join(', ')}`;
        }
        // Add more conditions for other types of queries, e.g., crop suggestions, disease info.
        return 'Could not find specific information. Please provide more details.';
    }
);


const universalSearchFlow = ai.defineFlow(
  {
    name: 'universalSearchFlow',
    inputSchema: UniversalSearchInputSchema,
    outputSchema: UniversalSearchOutputSchema,
  },
  async (input) => {
    const prompt = `You are a helpful farming assistant. The user has a search query. 
    Provide a clear and concise answer. If it's about prices, use the available tool.
    
    User Query: "${input.query}"
    
    Respond with a title and a detailed response.`;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash',
      output: {
          schema: UniversalSearchOutputSchema,
      },
      tools: [searchTool],
    });

    const output = llmResponse.output();

    if (!output) {
        throw new Error("Failed to generate a search response.");
    }
    
    return output;
  }
);


export async function getUniversalSearchResult(input: UniversalSearchInput): Promise<UniversalSearchOutput> {
  return universalSearchFlow(input);
}
