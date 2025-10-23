// /genkit/cropGuidanceFlow.ts

'use server';

/**
 * @fileOverview A flow that provides step-by-step guidance for a selected crop.
 */

// Consolidate imports and use the correct import for Zod from Genkit, if required,
// or use the standard Zod import if it's installed separately.
// Assuming 'genkit' handles 'zod' internally for the schemas it uses.
import { ai } from '@/ai/genkit';
import { z } from 'zod'; // Use standard zod import for clarity and common practice

// --- SCHEMAS ---
const CropGuidanceInputSchema = z.object({
  // Removed duplicate keys and kept the most descriptive version
  cropName: z.string().describe('The name of the crop (e.g., "Jute").'),
  region: z.string().describe('The region where the crop is being grown (e.g., "Mymensingh").'),
  currentStage: z.string().describe('The current growth stage of the crop (e.g., Sowing, Vegetative, Flowering). This is calculated from sowing date.'),
});
export type CropGuidanceInput = z.infer<typeof CropGuidanceInputSchema>;

const GuidanceStepSchema = z.object({
  title: z.string().describe('The title of the guidance step.'),
  details: z.string().describe('A detailed description of the tasks and considerations for this step.'),
  // Kept the more explicit and useful description
  isCompleted: z.boolean().describe('Whether this step is considered completed based on the current stage (MUST be true if stage is before or the same as the currentStage).'),
  durationInDays: z.number().describe('The typical duration of this stage in days (MUST be a single integer).'),
});

const CropGuidanceOutputSchema = z.object({
  guidance: z.array(GuidanceStepSchema).describe('An array of step-by-step guidance for the crop lifecycle.'),
});
export type CropGuidanceOutput = z.infer<typeof CropGuidanceOutputSchema>;

// --- PROMPT DEFINITION ---
const cropGuidancePrompt = ai.definePrompt({
  name: 'cropGuidancePrompt',
  // Note: ai.definePrompt in Genkit automatically uses the LLM
  // specified in its configuration unless overridden.
  input: { schema: CropGuidanceInputSchema },
  output: { schema: CropGuidanceOutputSchema },
  prompt: `You are an expert agricultural advisor for Bangladesh. Provide a comprehensive, step-by-step guide for growing the specified crop in the given region.

The guide should cover the entire lifecycle from land preparation to post-harvest.
The farmer's crop is currently at the '{{{currentStage}}}' stage. Mark all stages up to and including the current stage as completed.

For each stage, provide a title, detailed actionable advice, and a typical duration in days.

**STRICT INSTRUCTIONS:**
1. Cover the entire lifecycle from land preparation to post-harvest.
2. The 'isCompleted' field MUST be **true** for all stages that are before or the same as the current stage '{{{currentStage}}}'.
3. For each stage, the 'durationInDays' MUST be a **single integer number** representing the average duration.
4. Provide detailed, actionable advice regarding irrigation, fertilizer/pesticide use, and relevant care.
5. Region: {{{region}}}
6. Crop: {{{cropName}}}

**Required Stages for Guidance Array:**
Generate guidance with the following stages:
1. Land Preparation
2. Seed Sowing
3. Germination & Early Growth
4. Vegetative Growth
5. Flowering & Fruiting
6. Harvesting
7. Post-Harvest
`,
});

// --- FLOW DEFINITION ---
export const cropGuidanceFlow = ai.defineFlow(
  {
    name: 'cropGuidanceFlow',
    inputSchema: CropGuidanceInputSchema,
    outputSchema: CropGuidanceOutputSchema,
  },
  async input => {
    // Call the defined prompt template, passing the input directly.
    // The prompt will use the LLM configured for the flow/application.
    const { output } = await cropGuidancePrompt(input);
    
    // Use the non-null assertion '!' since the flow requires an output.
    return output!; 
  }
);

// --- EXPORTED FUNCTION (for Next.js/Server Component use) ---
// This function allows the flow to be called directly from a server component.
export async function getCropGuidance(input: CropGuidanceInput): Promise<CropGuidanceOutput> {
  return cropGuidanceFlow(input);
}
