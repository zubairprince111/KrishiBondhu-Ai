
// IMPORTANT: This file is meant to be used for server-side actions and should not be modified.
// Any changes to this file could lead to unexpected behavior and break the application.
// To use these actions, import them in your client-side components and call them as needed.

'use server';

import { aiCropDoctorAnalysis } from '@/ai/flows/ai-crop-doctor-analysis';
import { matiAIVoiceAssistance } from '@/ai/flows/mati-ai-voice-assistance';
import { suggestOptimalCrops } from '@/ai/flows/optimal-crop-suggestion';
import { findGovernmentSchemes as findGovernmentSchemesFlow } from '@/ai/flows/government-scheme-finder';
import { findMarketPrices } from '@/ai/flows/market-price-finder';
import { getCropGuidance } from '@/ai/flows/crop-guidance-flow';
import { getWeatherAdvice } from '@/ai/flows/weather-advisor-flow';


function getCurrentSeason(): { name: string; climate: string } {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 5) {
    return { name: 'Kharif-1 (Summer)', climate: 'Hot and humid' };
  } else if (month >= 6 && month <= 9) {
    return { name: 'Kharif-2 (Monsoon)', climate: 'High rainfall and humidity' };
  } else {
    return { name: 'Rabi (Winter)', climate: 'Cool and dry' };
  }
}

type SuggestionParams = {
  location?: { latitude: number; longitude: number; } | null;
};

export async function suggestSeasonalCrops(params: SuggestionParams = {}): Promise<{
  data: any | null;
  error: string | null;
}> {
  try {
    const seasonInfo = getCurrentSeason();
    // Use location if provided, otherwise default to a general region.
    const region = params.location 
      ? `lat: ${params.location.latitude}, long: ${params.location.longitude}`
      : 'Bangladesh';

    const input = {
      region: region,
      currentSeason: seasonInfo.name,
      soilType: 'Alluvial', // Using a common soil type for general suggestions
      localClimateData: seasonInfo.climate,
    };
    const result = await suggestOptimalCrops(input);
    return {data: result, error: null};
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: 'Failed to get seasonal crop suggestions. Please try again.',
    };
  }
}

export async function getVoiceAssistance(input: any) {
  try {
    const result = await matiAIVoiceAssistance(input);
    return {data: result, error: null};
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: 'Failed to get a response from Mati AI. Please try again.',
    };
  }
}

export async function fetchCropGuidance(input: any) {
    try {
        const result = await getCropGuidance(input);
        return { data: result, error: null };
    } catch (error) {
        console.error(error);
        return { data: null, error: 'Failed to get crop guidance. Please try again.' };
    }
}


export async function findGovernmentSchemes(input: any) {
  try {
    const result = await findGovernmentSchemesFlow(input);
    return {data: result, error: null};
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: 'Failed to find government schemes. Please try again.',
    };
  }
}

export async function getMarketPrices(input: any) {
  try {
    const result = await findMarketPrices(input);
    return {data: result, error: null};
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: 'Failed to find market prices. Please try again.',
    };
  }
}

export async function fetchWeatherAdvice(input: any) {
  try {
    const result = await getWeatherAdvice(input);
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: 'Failed to get weather advice. Please try again.' };
  }
}

export async function analyzeCropImage(input: any) {
  try {
    const result = await aiCropDoctorAnalysis(input);
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: 'Failed to analyze crop image. Please try again.' };
  }
}
