'use client';
import { useState, useEffect, useTransition } from 'react';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { MapPin, Zap, Lightbulb, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { fetchWeatherAdvice } from '@/lib/actions';
import type { WeatherAdvisorOutput } from '@/ai/flows/weather-advisor-flow';
import { useGeolocation } from '@/hooks/use-geolocation';
import { getWeather, getConditionIcon, getConditionKey } from '@/lib/weather';
import type { WeatherData } from '@/lib/weather';

export default function WeatherPage() {
  const { t } = useLanguage();
  const [isAdvicePending, startAdviceTransition] = useTransition();
  const [advice, setAdvice] = useState<WeatherAdvisorOutput | null>(null);
  const { location, error: locationError } = useGeolocation();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);

  useEffect(() => {
    if (location) {
      setIsWeatherLoading(true);
      getWeather(location.latitude, location.longitude)
        .then(data => {
          setWeatherData(data);
        })
        .catch(console.error)
        .finally(() => setIsWeatherLoading(false));
    } else {
        setIsWeatherLoading(false);
    }
  }, [location]);

  useEffect(() => {
    if (weatherData) {
      startAdviceTransition(async () => {
          const { data } = await fetchWeatherAdvice({
              condition: t(getConditionKey(weatherData.current.conditionCode)),
              temperature: weatherData.current.temperature,
              wind: `${weatherData.current.windSpeed} km/h`,
          });
          setAdvice(data);
      });
    }
  }, [weatherData, t]);

  const renderContent = () => {
    if (isWeatherLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed p-8 text-center min-h-[50vh]">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Fetching weather for your location...</p>
        </div>
      );
    }

    if (locationError || !weatherData) {
       return (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed p-8 text-center min-h-[50vh]">
          <MapPin className="size-12 text-muted-foreground" />
          <p className="text-muted-foreground font-semibold">Could not access your location.</p>
          <p className="text-sm text-muted-foreground">Please enable location services in your browser to get local weather.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                      <CardTitle className="font-headline">Current Weather</CardTitle>
                      <CardDescription className="flex items-center gap-1"><MapPin className="size-4"/>{weatherData.locationName} &bull; {t(weatherData.current.seasonKey)}</CardDescription>
                  </div>
                   <div className="flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                      <Zap className="size-4"/>
                      <span>Cyclone Warning Issued</span>
                   </div>
              </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <div className="flex flex-1 flex-col items-center gap-4 md:items-start">
              <div className="flex items-start">
                <span className="font-headline text-7xl font-bold">{weatherData.current.temperature}</span>
                <span className="mt-2 text-2xl font-medium">°C</span>
              </div>
              <p className="text-xl text-muted-foreground">{t(getConditionKey(weatherData.current.conditionCode))}</p>
            </div>
            <div className="flex flex-1 items-center justify-center">{getConditionIcon(weatherData.current.conditionCode, "size-16 text-yellow-500")}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 flex-1 gap-4 text-center w-full">
              <div>
                <p className="text-sm text-muted-foreground">Humidity</p>
                <p className="font-semibold">{weatherData.current.humidity}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wind</p>
                <p className="font-semibold">{weatherData.current.windSpeed} km/h</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">UV Index</p>
                <p className="font-semibold">{weatherData.current.uvIndex}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Lightbulb className="text-primary"/>
              AI Weather Tip
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-16">
             {isAdvicePending ? (
                  <Loader2 className="size-6 animate-spin text-primary"/>
              ) : advice ? (
                  <p className="text-center text-primary-foreground/90">{advice.advice}</p>
              ) : (
                  <p className="text-muted-foreground">Could not load AI advice.</p>
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">5-Day Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
              {weatherData.forecast.map((day) => (
                <div key={day.day} className="flex flex-col items-center gap-2 rounded-lg bg-background p-2 sm:p-4 text-center">
                  <p className="font-semibold">{day.day}</p>
                  {getConditionIcon(day.conditionCode, "size-8")}
                  <p className="text-lg font-bold">{day.temp}°</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <SidebarInset>
      <AppHeader titleKey="app.header.title.weather" />
      <main className="flex-1 p-4 md:p-6">
        {renderContent()}
      </main>
    </SidebarInset>
  );
}
