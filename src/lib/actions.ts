'use server';

import {
  aiCropDoctorAnalysisFlow,
  AiCropDoctorInput,
  AiCropDoctorOutput,
} from '@/ai/flows/ai-crop-doctor-analysis';
import {
  matiAIVoiceAssistanceFlow,
  MatiAIVoiceAssistanceInput,
  MatiAIVoiceAssistanceOutput,
} from '@/ai/flows/mati-ai-voice-assistance';
import {
  suggestOptimalCropsFlow,
  OptimalCropSuggestionInput,
  OptimalCropSuggestionOutput,
} from '@/ai/flows/optimal-crop-suggestion';
import {
  governmentSchemeFinderFlow,
  GovernmentSchemeFinderInput,
  GovernmentSchemeFinderOutput,
} from '@/ai/flows/government-scheme-finder';
import {
  marketPriceFinderFlow,
  MarketPriceFinderInput,
  MarketPriceFinderOutput,
} from '@/ai/flows/market-price-finder';
import {
  cropGuidanceFlow,
  CropGuidanceInput,
  CropGuidanceOutput,
} from '@/ai/flows/crop-guidance-flow';
import {
  weatherAdvisorFlow,
  WeatherAdvisorInput,
  WeatherAdvisorOutput,
} from '@/ai/flows/weather-advisor-flow';
import {
  universalSearchFlow,
  UniversalSearchInput,
  UniversalSearchOutput,
} from '@/ai/flows/universal-search-flow';
import {
  criticalWeatherAlertFlow,
  CriticalWeatherAlertInput,
  CriticalWeatherAlertOutput,
} from '@/ai/flows/critical-weather-alert-flow';
import {
  farmingNewsFlow,
  FarmingNewsOutput,
} from '@/ai/flows/farming-news-flow';
import {
  krishiOfficerFinderFlow,
  KrishiOfficerFinderInput,
  KrishiOfficerFinderOutput,
} from '@/ai/flows/krishi-officer-finder';
import { getCurrentSeason } from '@/lib/weather';

async function runFlow<Input, Output>(
  flow: (input: Input) => Promise<Output>,
  input: Input,
  errorMessage: string
): Promise<{ data: Output | null; error: string | null }> {
  try {
    const result = await flow(input);
    return { data: result, error: null };
  } catch (e: any) {
    console.error(e);
    return { data: null, error: e.message || errorMessage };
  }
}

export async function suggestSeasonalCrops(params: { location?: { latitude: number; longitude: number; } | null; } = {}): Promise<{
  data: OptimalCropSuggestionOutput | null;
  error: string | null;
}> {
  const seasonInfo = getCurrentSeason();
  const region = params.location 
    ? `lat: ${params.location.latitude}, long: ${params.location.longitude}`
    : 'Bangladesh';

  const input: OptimalCropSuggestionInput = {
    region: region,
    currentSeason: seasonInfo.name,
    soilType: 'Alluvial',
    localClimateData: seasonInfo.climate,
  };
  return runFlow(suggestOptimalCropsFlow, input, 'Failed to get seasonal crop suggestions. Please try again.');
}

export async function getCriticalWeatherAlert(input: CriticalWeatherAlertInput): Promise<{
  data: CriticalWeatherAlertOutput | null;
  error: string | null;
}> {
  return runFlow(criticalWeatherAlertFlow, input, 'Failed to get critical weather alerts.');
}

export async function getVoiceAssistance(input: MatiAIVoiceAssistanceInput): Promise<{
  data: MatiAIVoiceAssistanceOutput | null;
  error: string | null;
}> {
  return runFlow(matiAIVoiceAssistanceFlow, input, 'Failed to get a response from Mati AI. Please try again.');
}

export async function fetchCropGuidance(input: CropGuidanceInput): Promise<{
  data: CropGuidanceOutput | null;
  error: string | null;
}> {
    return runFlow(cropGuidanceFlow, input, 'Failed to get crop guidance. Please try again.');
}

export async function findGovernmentSchemes(input: GovernmentSchemeFinderInput): Promise<{
  data: GovernmentSchemeFinderOutput | null;
  error: string | null;
}> {
  return runFlow(governmentSchemeFinderFlow, input, 'Failed to find government schemes. Please try again.');
}

export async function findKrishiOfficer(input: KrishiOfficerFinderInput): Promise<{
  data: KrishiOfficerFinderOutput | null;
  error: string | null;
}> {
    return runFlow(krishiOfficerFinderFlow, input, 'Failed to find officer details. Please try again.');
}

export async function getMarketPrices(input: MarketPriceFinderInput): Promise<{
  data: MarketPriceFinderOutput | null;
  error: string | null;
}> {
  return runFlow(marketPriceFinderFlow, input, 'Failed to find market prices. Please try again.');
}

export async function fetchWeatherAdvice(input: WeatherAdvisorInput): Promise<{
  data: WeatherAdvisorOutput | null;
  error: string | null;
}> {
  return runFlow(weatherAdvisorFlow, input, 'Failed to get weather advice. Please try again.');
}

export async function analyzeCropImage(input: AiCropDoctorInput): Promise<{ data: AiCropDoctorOutput | null; error: string | null; }> {
  return runFlow(aiCropDoctorAnalysisFlow, input, 'Failed to analyze crop image. Please try again.');
}

export async function universalSearch(input: UniversalSearchInput): Promise<{
  data: UniversalSearchOutput | null;
  error: string | null;
}> {
  return runFlow(universalSearchFlow, input, 'Failed to get search results from AI. Please try again.');
}

export async function getFarmingNews(): Promise<{ data: FarmingNewsOutput | null; error: string | null; }> {
    try {
        const result = await farmingNewsFlow();
        return { data: result, error: null };
    } catch (e: any) {
        console.error(e);
        return { data: null, error: e.message || 'Failed to get farming news. Please try again.' };
    }
}
