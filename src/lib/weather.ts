import { Sun, Cloud, CloudRain, CloudSun, Zap, Snowflake, CloudFog, CloudDrizzle, CloudHail } from 'lucide-react';
import type { TranslationKey } from './i18n';

// WMO Weather interpretation codes
const WEATHER_CONDITIONS: { [code: number]: { key: TranslationKey, icon: React.ElementType } } = {
  0: { key: 'weather.condition.clear', icon: Sun },
  1: { key: 'weather.condition.mainlyClear', icon: CloudSun },
  2: { key: 'weather.condition.partlyCloudy', icon: CloudSun },
  3: { key: 'weather.condition.overcast', icon: Cloud },
  45: { key: 'weather.condition.fog', icon: CloudFog },
  48: { key: 'weather.condition.rimeFog', icon: CloudFog },
  51: { key: 'weather.condition.drizzleLight', icon: CloudDrizzle },
  53: { key: 'weather.condition.drizzleModerate', icon: CloudDrizzle },
  55: { key: 'weather.condition.drizzleDense', icon: CloudDrizzle },
  61: { key: 'weather.condition.rainSlight', icon: CloudRain },
  63: { key: 'weather.condition.rainModerate', icon: CloudRain },
  65: { key: 'weather.condition.rainHeavy', icon: CloudRain },
  80: { key: 'weather.condition.rainShowersSlight', icon: CloudRain },
  81: { key: 'weather.condition.rainShowersModerate', icon: CloudRain },
  82: { key: 'weather.condition.rainShowersViolent', icon: CloudRain },
  95: { key: 'weather.condition.thunderstormSlight', icon: Zap },
  96: { key: 'weather.condition.thunderstormHailSlight', icon: CloudHail },
  99: { key: 'weather.condition.thunderstormHailHeavy', icon: CloudHail },
};

export function getCurrentSeason(): { name: string; climate: string } {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 5) {
    return { name: 'Kharif-1 (Summer)', climate: 'Hot and humid' };
  } else if (month >= 6 && month <= 9) {
    return { name: 'Kharif-2 (Monsoon)', climate: 'High rainfall and humidity' };
  } else {
    return { name: 'Rabi (Winter)', climate: 'Cool and dry' };
  }
}


const SEASONS: { [month: number]: TranslationKey } = {
    0: 'weather.season.winter', 1: 'weather.season.winter', 
    2: 'weather.season.summer', 3: 'weather.season.summer', 4: 'weather.season.summer', 5: 'weather.season.summer',
    6: 'weather.season.monsoon', 7: 'weather.season.monsoon', 8: 'weather.season.monsoon', 9: 'weather.season.monsoon',
    10: 'weather.season.autumn', 11: 'weather.season.autumn'
};

export type WeatherData = {
  locationName: string;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    conditionCode: number;
    uvIndex: string;
    seasonKey: TranslationKey;
  };
  forecast: {
    day: string;
    temp: number;
    conditionCode: number;
  }[];
};

export async function getWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max&timezone=auto`;
  const locationApiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`;
  
  const [weatherResponse, locationResponse] = await Promise.all([
    fetch(weatherApiUrl),
    fetch(locationApiUrl)
  ]);

  if (!weatherResponse.ok) throw new Error("Failed to fetch weather data.");
  if (!locationResponse.ok) throw new Error("Failed to fetch location data.");

  const weather = await weatherResponse.json();
  const locationData = await locationResponse.json();

  const locationName = `${locationData.address.city || locationData.address.town || locationData.address.village}, ${locationData.address.country}`;
  
  const currentMonth = new Date().getMonth();

  return {
    locationName,
    current: {
      temperature: Math.round(weather.current.temperature_2m),
      humidity: weather.current.relative_humidity_2m,
      windSpeed: Math.round(weather.current.wind_speed_10m),
      conditionCode: weather.current.weather_code,
      uvIndex: 'High', // Placeholder
      seasonKey: SEASONS[currentMonth] as TranslationKey
    },
    forecast: weather.daily.time.slice(1, 6).map((time: string, index: number) => ({
      day: new Date(time).toLocaleDateString('en-US', { weekday: 'short' }),
      temp: Math.round(weather.daily.temperature_2m_max[index + 1]),
      conditionCode: weather.daily.weather_code[index + 1]
    }))
  };
}

export function getConditionIcon(code: number, className?: string) {
    const Icon = WEATHER_CONDITIONS[code]?.icon || Cloud;
    return <Icon className={className} />;
}

export function getConditionKey(code: number): TranslationKey {
    return WEATHER_CONDITIONS[code]?.key || 'weather.condition.unknown';
}
