// /genkit/universalSearchFlow.ts (FIXED CODE)

'use server'; // Keep this if used as a Next.js Server Action
// NOTE: Make sure your imports for Genkit are configured correctly
// (e.g., importing `ai` from your initialized Genkit instance).
import { genkit, z, runFlow } from '@genkit-ai/core'; 
import { marketPriceFinderFlow } from './marketPriceFinderFlow'; 

// Assuming you have a file that initializes genkit (e.g., in /genkit/index.ts)
// For this example, we'll define 'ai' assuming a standard Genkit setup.
// If you are using a separate init file, replace 'ai' with the import:
// import { ai } from '@/ai/genkit';
const ai = genkit({}); // Placeholder for Genkit initialization


const UniversalSearchInputSchema = z.object({
  query: z.string().describe('The user\'s search query.'),
});
export type UniversalSearchInput = z.infer<typeof UniversalSearchInputSchema>;

const UniversalSearchOutputSchema = z.object({
  title: z.string().describe('A short, descriptive title for the search result.'),
  response: z.string().describe('A detailed and helpful response to the user\'s query, formatted as a string which may include markdown for lists or emphasis.'),
});
export type UniversalSearchOutput = z.infer<typeof UniversalSearchOutputSchema>;

// FIX: Ensure you are using ai.defineTool (or genkit.defineTool, depending on your setup)
// Also, the outputSchema for the tool should be STRING since it returns a string response for the LLM.
const searchTool = ai.defineTool(
    {
        name: 'searchCropInfo',
        description: 'Searches for information about crops, market prices, or farming suggestions. Use this tool if the user query contains the word "price" or "rates".',
        inputSchema: UniversalSearchInputSchema,
        outputSchema: z.string().describe('A summary of the market prices found.'),
    },
    async (input) => {
        // FIX: Use runFlow() instead of direct function call for robust flow execution within a tool/flow.
        if (input.query.toLowerCase().includes('price') || input.query.toLowerCase().includes('rates')) {
            try {
                // IMPORTANT: The flow must be executable in this context.
                // Using runFlow is the Genkit-recommended way to call one flow from another.
                const prices = await runFlow(marketPriceFinderFlow, { region: 'Bangladesh' });
                
                if (prices.prices && prices.prices.length > 0) {
                    const priceList = prices.prices.map(p => `- **${p.crop}**: ${p.price} (${p.location})`).join('\n');
                    return `MARKET PRICES FOUND:\n${priceList}\n\nThis data must be synthesized into a final, helpful response.`;
                }
                return 'No current market price data found for the region.';

            } catch (error) {
                console.error("Error running nested marketPriceFinderFlow:", error);
                return 'An error occurred while fetching real-time market prices.';
            }
        }
        
        // If the query is not about prices, return a non-tool-calling prompt for the LLM.
        return 'Query does not require market price lookup.';
    }
);


export const universalSearchFlow = ai.defineFlow(
  {
    name: 'universalSearchFlow',
    inputSchema: UniversalSearchInputSchema,
    outputSchema: UniversalSearchOutputSchema,
  },
  async (input) => {
    // FIX: Refine the prompt to be explicit about using the tool and outputting JSON.
    const prompt = `You are a helpful and expert agricultural assistant. The user has a search query.
    Your task is to provide a clear, concise, and professional answer.

    1. **Tool Use**: If the query is about 'price' or 'rates', you **MUST** use the 'searchCropInfo' tool to retrieve the latest data.
    2. **Synthesis**: Combine the tool's output (if used) with your general knowledge to form a single, detailed response.
    3. **Format**: Your final output **MUST** strictly adhere to the requested JSON schema for the title and response fields.

    User Query: "${input.query}"`;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash',
      output: {
          schema: UniversalSearchOutputSchema,
          format: 'json', // Explicitly ask for JSON output
      },
      tools: [searchTool],
      // Allow a few turns for the LLM to call the tool and then respond
      maxTurns: 3, 
    });

    const output = llmResponse.output();

    if (!output) {
        // This throw is caught by the Server Action handler
        throw new Error("Failed to generate a structured search response from the AI model.");
    }
    
    return output;
  }
);
