'use client';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { Sun, Cloud, CloudRain, CloudSun, MapPin, Zap } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

const weatherData = {
  current: {
    location: 'Dhaka, Bangladesh',
    temp: 32,
    condition: 'Partly Cloudy',
    icon: <CloudSun className="size-16 text-yellow-500" />,
    details: {
      humidity: '78%',
      wind: '12 km/h',
      uvIndex: 'High',
    },
  },
  forecast: [
    { day: 'Mon', temp: 33, icon: <Sun className="size-8 text-yellow-500" /> },
    { day: 'Tue', temp: 31, icon: <CloudRain className="size-8 text-blue-500" /> },
    { day: 'Wed', temp: 34, icon: <Sun className="size-8 text-yellow-500" /> },
    { day: 'Thu', temp: 30, icon: <CloudRain className="size-8 text-blue-500" /> },
    { day: 'Fri', temp: 32, icon: <Cloud className="size-8 text-gray-500" /> },
  ],
};

export default function WeatherPage() {
  const { t } = useLanguage();
  return (
    <SidebarInset>
      <AppHeader titleKey="app.header.title.weather" />
      <main className="flex-1 p-4 md:p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                        <CardTitle className="font-headline">Current Weather</CardTitle>
                        <CardDescription className="flex items-center gap-1"><MapPin className="size-4"/>{weatherData.current.location}</CardDescription>
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
                  <span className="font-headline text-7xl font-bold">{weatherData.current.temp}</span>
                  <span className="mt-2 text-2xl font-medium">°C</span>
                </div>
                <p className="text-xl text-muted-foreground">{weatherData.current.condition}</p>
              </div>
              <div className="flex flex-1 items-center justify-center">{weatherData.current.icon}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 flex-1 gap-4 text-center w-full">
                <div>
                  <p className="text-sm text-muted-foreground">Humidity</p>
                  <p className="font-semibold">{weatherData.current.details.humidity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wind</p>
                  <p className="font-semibold">{weatherData.current.details.wind}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">UV Index</p>
                  <p className="font-semibold">{weatherData.current.details.uvIndex}</p>
                </div>
              </div>
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
                    {day.icon}
                    <p className="text-lg font-bold">{day.temp}°</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}
