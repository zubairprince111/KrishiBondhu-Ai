'use server';

/**
 * @fileOverview Analyzes an image of a diseased crop and provides potential solutions in Bangla.
 *
 * - aiCropDoctorAnalysis - A function that analyzes crop symptoms and provides solutions in Bangla.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import util from 'util';

const AiCropDoctorInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the diseased crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AiCropDoctorInput = z.infer<typeof AiCropDoctorInputSchema>;

const AiCropDoctorOutputSchema = z.object({
  diagnosis: z.string().describe('The diagnosis of the crop disease in Bangla.'),
  solutions: z.array(z.string()).describe('A list of at least 3 potential solutions to the crop disease in Bangla.'),
});
export type AiCropDoctorOutput = z.infer<typeof AiCropDoctorOutputSchema>;

/**
 * Helpers
 */
function getDataUriInfo(dataUri: string) {
  const match = dataUri.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  const byteLength = Math.ceil((base64.length * 3) / 4);
  return { mime, base64Length: base64.length, byteLength };
}

/**
 * Connectivity test: a minimal text-only generation to check credentials, network, and model access.
 * Call this separately (it is used automatically below when diagnostics are enabled).
 */
async function connectivityTest() {
  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: 'Say "connected" in English.',
      temperature: 0.0,
      maxOutputTokens: 20,
    });
    return { ok: true, output };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export const aiCropDoctorAnalysisFlow = ai.defineFlow(
  {
    name: 'aiCropDoctorAnalysisFlow',
    inputSchema: AiCropDoctorInputSchema,
    outputSchema: AiCropDoctorOutputSchema,
  },
  async input => {
    // Basic runtime validation for the data URI to give clearer errors early
    const info = getDataUriInfo(input.photoDataUri);
    if (!info) {
      const msg = "photoDataUri must be a valid data URI using base64 encoding (e.g. 'data:image/jpeg;base64,...').";
      console.error('aiCropDoctorAnalysisFlow - invalid data URI:', input.photoDataUri?.slice?.(0, 100));
      throw new Error(msg);
    }

    // Warn if the image is large (many providers have payload limits)
    if (info.byteLength > 5_000_000) {
      console.warn(
        `aiCropDoctorAnalysisFlow - large image detected (${(info.byteLength / 1_048_576).toFixed(2)} MB). ` +
          'Large data URIs may fail to upload or cause timeouts. Consider uploading the image to a public URL and pass that instead.'
      );
    }

    // Run a quick connectivity test before attempting the potentially-large media call.
    const conn = await connectivityTest();
    if (!conn.ok) {
      console.error('aiCropDoctorAnalysisFlow - connectivity test failed. Detailed error follows:');
      // Use util.inspect to reveal non-enumerable properties on Error objects
      console.error(util.inspect(conn.error, { depth: 4 }));
      throw new Error(
        'Failed to reach generative model during connectivity test. Check API key, network, model access, and server environment. See server logs for details.'
      );
    }

    try {
      const prompt = `You are an expert agricultural advisor specializing in diagnosing crop diseases and providing solutions in Bangla.

You will analyze the provided image of the diseased crop and provide a diagnosis and a list of at least 3 potential solutions in Bangla.

Crop Image: {{media url="${input.photoDataUri}"}}

Respond entirely in the Bangla language.
`;

      const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt,
        temperature: 0.2,
        maxOutputTokens: 1000,
        // If your SDK supports a separate media/attachments param, use that instead of an inline media tag.
        output: { schema: AiCropDoctorOutputSchema },
      });

      if (!output) {
        throw new Error('AI returned no output.');
      }

      return output;
    } catch (err) {
      // Log as much diagnostic information as possible. Many SDK errors include `.status`, `.response`, `.body`, or nested properties.
      console.error('aiCropDoctorAnalysisFlow - error calling ai.generate:');
      // Best-effort printing of common shapes
      try {
        console.error('Error (util.inspect):', util.inspect(err, { depth: 6 }));
      } catch {
        console.error('Error (toString):', String(err));
      }

      // If the error object has a response/body, print it (useful for HTTP errors)
      // @ts-expect-error - runtime check
      if (err && (err as any).response) {
        // @ts-expect-error
        console.error('Error response:', util.inspect((err as any).response, { depth: 6 }));
      }
      // Re-throw so caller receives the error
      throw err;
    }
  }
);
