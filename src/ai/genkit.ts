import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Initialize the googleAI plugin with the API key from the environment variables.
// This code runs on the server, where process.env.GEMINI_API_KEY is securely available
// in both local development (from .env file) and on Vercel (from project settings).
export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
  model: 'googleai/gemini-2.5-flash',
});
