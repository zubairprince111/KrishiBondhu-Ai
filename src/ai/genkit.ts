import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [
    googleAI({
      // Defer reading the API key until it's actually needed at runtime.
      // This is more robust for Vercel's environment.
      apiKey: () => process.env.GEMINI_API_KEY || '',
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export {ai};
