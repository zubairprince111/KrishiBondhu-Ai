
'use server';

/**
 * @fileOverview An AI flow that generates the latest worldwide farming news.
 */

import { ai } from '@/ai/genkit';
import {z} from 'zod';


const NewsArticleSchema = z.object({
  title: z.string().describe('The headline of the news article.'),
  summary: z.string().describe('A brief, one or two-sentence summary of the news article.'),
});

const FarmingNewsOutputSchema = z.object({
  articles: z.array(NewsArticleSchema).describe('A list of 3-4 top farming news articles.'),
});

export type FarmingNewsOutput = z.infer<typeof FarmingNewsOutputSchema>;


export async function getFarmingNews(): Promise<FarmingNewsOutput> {
  return farmingNewsFlow();
}

const prompt = ai.definePrompt({
  name: 'farmingNewsPrompt',
  output: {schema: FarmingNewsOutputSchema},
  prompt: `You are an expert agricultural news correspondent. 
Your task is to provide the top 3-4 most important and relevant worldwide farming and agricultural news headlines for today, ${new Date().toDateString()}.
The news should be relevant to a general farmer, covering topics like new technology, market trends, weather impacts on agriculture, or significant policy changes.
For each article, provide a concise title and a short summary.`,
});

const farmingNewsFlow = ai.defineFlow(
  {
    name: 'farmingNewsFlow',
    outputSchema: FarmingNewsOutputSchema,
  },
  async () => {
    const {output} = await prompt();
    return output!;
  }
);
