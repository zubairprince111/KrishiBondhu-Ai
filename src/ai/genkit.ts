
import { genkit, Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

let aiInstance: Genkit | null = null;

/**
 * Returns a singleton instance of the Genkit AI object.
 * This function defers the initialization and API key access until it's first used,
 * which is a robust pattern for environments like Vercel.
 */
export function getAi(): Genkit {
  if (!aiInstance) {
    aiInstance = genkit({
      plugins: [
        googleAI({
          // Defer reading the API key until it's actually needed at runtime.
          apiKey: process.env.GEMINI_API_KEY,
        }),
      ],
      logLevel: 'debug',
      enableTracingAndMetrics: true,
    });
  }
  return aiInstance;
}

// Export the 'ai' object by calling the getter function.
// This ensures that any file importing 'ai' gets the initialized instance.
export const ai = getAi();
