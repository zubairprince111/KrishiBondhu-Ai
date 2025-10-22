
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

let apiKey: string | undefined = process.env.GEMINI_API_KEY;

// On the client side, sessionStorage is available.
if (typeof window !== 'undefined') {
  const sessionKey = window.sessionStorage.getItem('gemini_api_key');
  if (sessionKey) {
    apiKey = sessionKey;
  }
}

export const ai = genkit({
  plugins: [googleAI({apiKey: apiKey})],
  model: 'googleai/gemini-2.5-flash',
});
