// ... (omitted boilerplate, imports, schemas, and helper functions)

export const aiCropDoctorAnalysisFlow = ai.defineFlow(
  {
    name: 'aiCropDoctorAnalysisFlow',
    inputSchema: AiCropDoctorInputSchema,
    outputSchema: AiCropDoctorOutputSchema,
  },
  async input => {
    // ... (omitted clientInfo and getDataUriInfo/size check logic)

    // Run a quick connectivity test (Keep this)
    const conn = await connectivityTest();
    if (!conn.ok) {
      // ... (connectivity error handling)
    }

    const MAX_RETRIES = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        
        // 1. **DEFINE THE TEXT PROMPT** (Without the inline media tag)
        const textPrompt = `You are an expert agricultural advisor specializing in diagnosing crop diseases and providing solutions in Bangla.
You will analyze the provided image of the diseased crop and provide a diagnosis and a list of at least 3 potential solutions in Bangla.
Respond entirely in the Bangla language.
`;
        
        // 2. **DEFINE THE MEDIA PART** (The correct way to pass media)
        let mediaPart;
        if (input.photoUrl) {
          // Use the public URL directly for the model
          mediaPart = { media: input.photoUrl }; 
          console.info('aiCropDoctorAnalysisFlow - using photoUrl:', input.photoUrl);
        } else if (input.photoDataUri) {
          // Pass the data URI which Genkit/SDK should convert to an inline part
          mediaPart = { media: input.photoDataUri };
          console.info('aiCropDoctorAnalysisFlow - using photoDataUri, info:', info);
        } else {
            // This should not happen due to the .refine() check on the input schema
            throw new Error('No photoDataUri or photoUrl provided.');
        }

        // 3. **ASSEMBLE THE PARTS ARRAY** (Text + Media)
        const parts = [
          mediaPart, // The image content
          { text: textPrompt } // The instruction text
        ];

        // --- Core AI Call (FIXED) ---
        const { output } = await ai.generate({
          model: 'googleai/gemini-2.5-flash',
          // Use the 'parts' array instead of 'prompt' string
          parts: parts, 
          temperature: 0.2,
          maxOutputTokens: 1000,
          output: { schema: AiCropDoctorOutputSchema },
        });
        // -------------------

        if (!output) {
          throw new Error('AI returned no output.');
        }

        // If successful, return the output and break the loop
        return output as AiCropDoctorOutput;

      } catch (err) {
        // ... (omitted error handling and retry logic)
        // ... (use the original error handling from the snippet)
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
        // ... (omitted detailed error logging)

        const safeDiag = {
          message: 'AI provider call failed. See server logs for full details.',
          provider: providerSummary,
          connectivityTestOk: true,
          imageInfo: info ?? null,
        };

        throw new Error(JSON.stringify(safeDiag));
      }
    }
    
    throw new Error('Analysis failed after maximum retries.');
  },
);
