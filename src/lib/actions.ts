// IMPORTANT: This file is meant to be used for server-side actions and should not be modified.
// Any changes to this file could lead to unexpected behavior and break the application.
// To use these actions, import them in your client-side components and call them as needed.

'use server';

import {
  matiAIVoiceAssistance,
  type MatiAIVoiceAssistanceInput,
} from '@/ai/flows/mati-ai-voice-assistance';
import {
  suggestOptimalCrops,
  type OptimalCropSuggestionInput,
} from '@/ai/flows/optimal-crop-suggestion';
import {
  findGovernmentSchemes,
  type GovernmentSchemeFinderInput,
} from '@/ai/flows/government-scheme-finder';

export async function getVoiceAssistance(
  input: MatiAIVoiceAssistanceInput
) {
  try {
    const result = await matiAIVoiceAssistance(input);
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: 'Failed to get a response from Mati AI. Please try again.',
    };
  }
}

export async function getOptimalCrops(
  input: OptimalCropSuggestionInput
) {
  try {
    const result = await suggestOptimalCrops(input);
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: 'Failed to get crop suggestions. Please try again.',
    };
  }
}

export async function getGovernmentSchemes(
  input: GovernmentSchemeFinderInput
) {
  try {
    const result = await findGovernmentSchemes(input);
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: 'Failed to find government schemes. Please try again.',
    };
  }
}
