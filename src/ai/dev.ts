
import { config } from 'dotenv';
config();

// This file is used to load all Genkit flows for local development
// and for the Genkit developer UI.
// It is not used in the production Vercel build.

import './flows/ai-crop-doctor-analysis';
import './flows/critical-weather-alert-flow';
import './flows/crop-guidance-flow';
import './flows/farming-news-flow';
import './flows/government-scheme-finder';
import './flows/krishi-officer-finder';
import './flows/market-price-finder';
import './flows/mati-ai-voice-assistance';
import './flows/optimal-crop-suggestion';
import './flows/universal-search-flow';
import './flows/weather-advisor-flow';
