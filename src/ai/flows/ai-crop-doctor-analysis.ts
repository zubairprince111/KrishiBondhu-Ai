'use server';

/**
 * @fileOverview Analyzes an image of a diseased crop and provides potential solutions in Bangla.
 *
 * - aiCropDoctorAnalysis - A function that analyzes crop symptoms and provides solutions in Bangla.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import util from 'util';

const AiCropDoctorInputSchema = z
  .object({
    photoDataUri: z
      .string()
      .optional()
      .describe(
        "A photo of the diseased crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.",
      ),
    // Accept either a data URI or a public URL (mobile can upload first and give a URL)
    photoUrl: z
      .string()
      .url()
      .optional()
      .describe('A public URL to the image. Prefer this for large images or mobile uploads.'),
    // Optional client-supplied diagnostics (e.g., userAgent or originalFileName)
    clientInfo: z
      .object({
        userAgent: z.string().optional(),
        originalFileName: z.string().optional(),
      })
      .optional(),
  })
  .refine(data => Boolean(data.photoDataUri) || Boolean(data.photoUrl), {
    message: 'Either photoDataUri or photoUrl must be provided.',
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

// Safe provider error summarizer: don't leak secrets or full responses.
function summarizeProviderError(err: any) {
  try {
    const status = err?.status || err?.response?.status || err?.statusCode || null;
    let bodyPreview = null;
    const candidate = err?.response?.body ?? err?.response ?? err?.body ?? err?.message ?? String(err);
    if (typeof candidate === 'string') {
      bodyPreview = candidate.slice(0, 2000);
    } else {
      try {
        bodyPreview = JSON.stringify(candidate).slice(0, 2000);
      } catch {
        bodyPreview = String(candidate).slice(0, 2000);
      }
    }
    return { status, bodyPreview };
  } catch {
    return { status: null, bodyPreview: 'unavailable' };
  }
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

/**
 * Helper to pause execution for a given number of milliseconds.
 */
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const aiCropDoctorAnalysisFlow = ai.defineFlow(
  {
    name: 'aiCropDoctorAnalysisFlow',
    inputSchema: AiCropDoctorInputSchema,
    outputSchema: AiCropDoctorOutputSchema,
  },
  async input => {
    // Log client info for mobile debugging
    if (input.clientInfo) {
      console.info('aiCropDoctorAnalysisFlow - clientInfo:', input.clientInfo);
    }

    // If provided a data URI, validate basic shape and size
    let info = undefined;
    if (input.photoDataUri) {
      info = getDataUriInfo(input.photoDataUri);
      if (!info) {
        const msg = "photoDataUri must be a valid data URI using base64 encoding (e.g. 'data:image/jpeg;base64,...').";
        console.error('aiCropDoctorAnalysisFlow - invalid data URI preview:', input.photoDataUri?.slice?.(0, 100));
        throw new Error(msg);
      }

      if (info.byteLength > 5_000_000) {
        console.warn(
          `aiCropDoctorAnalysisFlow - large image detected (${(info.byteLength / 1_048_576).toFixed(2)} MB). ` +
            'Large data URIs may fail to upload or cause timeouts. Consider uploading the image to a public URL and pass that instead (photoUrl).',
        );
      }
    }

    // Run a quick connectivity test before attempting the potentially-large media call.
    const conn = await connectivityTest();
    if (!conn.ok) {
      console.error('aiCropDoctorAnalysisFlow - connectivity test failed. Detailed error follows:');
      console.error(util.inspect(conn.error, { depth: 4 }));
      // Throw a safe, short message but log the details
      throw new Error(
        'Failed to reach generative model during connectivity test. Check API key, network, model access, and server environment. See server logs for details.',
      );
    }

    const MAX_RETRIES = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Prefer photoUrl if provided (safer for mobile / large images)
        const mediaRef = input.photoUrl ? input.photoUrl : `{{media url="${input.photoDataUri}"}}`;

        // If we have mime/size diagnostics, attach them to logs to assist debugging mobile issues
        if (info) {
          console.info('aiCropDoctorAnalysisFlow - incoming image info:', info);
        } else if (input.photoUrl) {
          console.info('aiCropDoctorAnalysisFlow - using photoUrl:', input.photoUrl);
        }

        const prompt = `You are an expert agricultural advisor specializing in diagnosing crop diseases and providing solutions in Bangla.

You will analyze the provided image of the diseased crop and provide a diagnosis and a list of at least 3 potential solutions in Bangla.

Crop Image: ${mediaRef}

Respond entirely in the Bangla language.
`;

        // --- Core AI Call ---
        const { output } = await ai.generate({
          model: 'googleai/gemini-2.5-flash',
          prompt,
          temperature: 0.2,
          maxOutputTokens: 1000,
          // If your SDK supports a separate media/attachments param, use that instead of an inline media tag.
          output: { schema: AiCropDoctorOutputSchema },
        });
        // -------------------

        if (!output) {
          throw new Error('AI returned no output.');
        }

        // If successful, return the output and break the loop
        return output as AiCropDoctorOutput;

      } catch (err) {
        lastError = err;
        const providerSummary = summarizeProviderError(err);
        const status = providerSummary.status;

        // Check for transient errors (500, 503) that indicate server overload or temporary failure
        if (attempt < MAX_RETRIES && (status === 503 || status === 500)) {
          const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s delay
          console.warn(`Attempt ${attempt} failed with status ${status}. Retrying in ${delay / 1000}s...`);
          await sleep(delay);
          continue; // Go to the next iteration (retry)
        }
        
        // For non-retryable errors (400, 401, 404, schema failure) or if max retries are reached, log and re-throw
        console.error(`aiCropDoctorAnalysisFlow - error calling ai.generate after ${attempt} attempts:`);
        try {
          console.error('Error (util.inspect):', util.inspect(err, { depth: 6 }));
        } catch {
          console.error('Error (toString):', String(err));
        }

        // Provide a safe, structured error message that client code can decode for diagnostics.
        const safeDiag = {
          message: 'AI provider call failed. See server logs for full details.',
          provider: providerSummary,
          connectivityTestOk: true,
          imageInfo: info ?? null,
        };

        // Throw a JSON-encoded message so the caller/API wrapper can parse it (don’t expose secrets).
        throw new Error(JSON.stringify(safeDiag));
      }
    }
    
    // Fallback in case of unexpected loop exit (shouldn't happen with the final throw inside the catch)
    throw new Error('Analysis failed after maximum retries.');
  },
);
