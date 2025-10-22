import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Initialize the googleAI plugin WITHOUT the API key.
// The key will be passed dynamically at runtime in each flow.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
