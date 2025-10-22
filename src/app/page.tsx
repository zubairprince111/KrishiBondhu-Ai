'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useRef, useState, useEffect, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Leaf,
  Mic,
  Tractor,
  MessageSquare,
  Landmark,
  WifiOff,
  MapPin,
  Sprout,
  Wind,
  Droplets,
  Loader2,
  CloudSun,
  AlertTriangle,
  ScanEye
} from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { SidebarInset } from '@/components/ui/sidebar';
import { useLanguage } from '@/context/language-context';
import type { TranslationKey } from '@/lib/i18n';
import { suggestOptimalCrops } from '@/lib/actions';
import type { OptimalCropSuggestionOutput } from '@/ai/flows/optimal-crop-suggestion';
import { cn } from '@/lib/utils';
import { useGeolocation } from '@/hooks/use-geolocation';
import { getWeather, getConditionIcon, getConditionKey } from '@/lib/weather';
import type { WeatherData } from '@/lib/weather';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser } from '@/firebase';

export default function DashboardPage() {
    const { user } = useUser();
    const [seasonalCrops, setSeasonalCrops] = useState<OptimalCropSuggestionOutput | null>(null);
    const [isPending, startTransition] = useTransition();
    const { location, error: locationError } = useGeolocation();
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(true);
    const { t } = useLanguage();
    
    const heroImage = PlaceHolderImages.find(p => p.id === 'hero-image');

    useEffect(() => {
        startTransition(async () => {
            const { data } = await suggestSeasonalCrops();
            setSeasonalCrops(data);
        });
    }, []);

    useEffect(() => {
      if (location) {
        setIsWeatherLoading(true);
        getWeather(location.latitude, location.longitude)
          .then(setWeatherData)
          .catch(console.error)
          .finally(() => setIsWeatherLoading(false));
      } else {
        setIsWeatherLoading(false);
      }
    }, [location]);

    const features = [
      {
        gridClass: 'col-span-2 md:col-span-4 bg-primary text-primary-foreground p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4',
        titleKey: 'dashboard.feature.myCrops.title',
        descriptionKey: 'dashboard.feature.myCrops.description',
        href: '/my-crops',
        icon: <Tractor className="size-8" />,
        buttonText: 'Go to Dashboard',
        buttonVariant: 'accent',
        buttonClass: 'bg-accent text-accent-foreground hover:bg-accent/90',
        contentAlignment: 'start',
      },
      {
        gridClass: 'col-span-2 md:col-span-2',
        titleKey: 'dashboard.feature.cropDoctor.title',
        descriptionKey: 'dashboard.feature.cropDoctor.description',
        href: '/crop-doctor',
        icon: <ScanEye className="size-6 text-muted-foreground" />,
        buttonText: 'Open',
        buttonVariant: 'secondary',
        contentAlignment: 'start',
      },
      {
        gridClass: 'col-span-2 md:col-span-2 bg-primary/5',
        titleKey: 'dashboard.feature.voiceAssistant.title',
        descriptionKey: 'dashboard.feature.voiceAssistant.description',
        href: '/voice-assistant',
        icon: <Mic className="size-6 text-muted-foreground" />,
        buttonText: 'Ask Now',
        buttonVariant: 'secondary',
        contentAlignment: 'start',
      },
       {
        gridClass: 'col-span-2 md:col-span-2 bg-warning/20 border-warning/50',
        titleKey: 'dashboard.feature.weather.title',
        descriptionKey: 'dashboard.feature.weather.description',
        href: '/weather',
        icon: <AlertTriangle className="size-6 text-warning-foreground" />,
        buttonText: 'View Details',
        buttonVariant: 'secondary',
        buttonClass: 'bg-warning/80 text-warning-foreground hover:bg-warning',
        contentAlignment: 'start',
      },
       {
        gridClass: 'col-span-2 md:col-span-2',
        titleKey: 'dashboard.feature.community.title',
        descriptionKey: 'dashboard.feature.community.description',
        href: '/community',
        icon: <MessageSquare className="size-6 text-muted-foreground" />,
        buttonText: 'Join',
        buttonVariant: 'secondary',
        contentAlignment: 'start',
      },
       {
        gridClass: 'col-span-2 md:col-span-2',
        titleKey: 'dashboard.feature.marketInfo.title',
        descriptionKey: 'dashboard.feature.marketInfo.description',
        href: '/market-info',
        icon: <Landmark className="size-6 text-muted-foreground" />,
        buttonText: 'Explore',
        buttonVariant: 'secondary',
        contentAlignment: 'start',
      },
    ] as const;

    const renderWeather = () => {
         if (isWeatherLoading) return <div className="flex items-center gap-2"><Loader2 className="animate-spin size-4" /> <span>Loading...</span></div>;
         if (locationError || !weatherData) return <div className="flex items-center gap-2"><MapPin className="size-4" /> <span>Location Off</span></div>;

         return (
            <>
                {getConditionIcon(weatherData.current.conditionCode, "size-6")}
                <span className="font-bold text-2xl">{weatherData.current.temperature}°C</span>
                <div className="text-xs">
                    <p className="font-semibold">{weatherData.locationName.split(',')[0]}</p>
                    <p>{weatherData.locationName.split(',').slice(1).join(', ')}</p>
                </div>
            </>
         )
    }

    return (
        <SidebarInset>
            <AppHeader />
            <main className="flex-1 space-y-6 p-4 md:p-6 bg-muted/40">
                 <div className="relative h-[350px] w-full rounded-2xl overflow-hidden text-white flex flex-col justify-between p-6 md:p-8">
                     {heroImage && (
                        <Image
                            src={heroImage.imageUrl}
                            alt={heroImage.description}
                            data-ai-hint={heroImage.imageHint}
                            fill
                            className="object-cover"
                            priority
                        />
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     
                     <div className="relative flex items-center gap-2 rounded-full bg-black/30 p-2 pr-4 backdrop-blur-sm max-w-fit">
                         {renderWeather()}
                     </div>

                     <div className="relative">
                         <h2 className="font-headline text-3xl md:text-4xl font-bold max-w-md">
                            {isPending ? "Finding suggestions..." : seasonalCrops ? "Seasonal suggestions for you:" : "Seasonal suggestions are based on your crops."}
                         </h2>
                         <p className="text-sm max-w-md mt-2">
                             {isPending && <Loader2 className="animate-spin" />}
                             {!isPending && seasonalCrops ? seasonalCrops.reasoning : "Add your first crop to get started!"}
                         </p>

                         {seasonalCrops && !isPending && (
                            <div className="flex gap-2 mt-4">
                                {seasonalCrops.suggestedCrops.map(crop => (
                                    <div key={crop} className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold">
                                        {crop}
                                    </div>
                                ))}
                            </div>
                         )}
                     </div>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                    {features.map((feature, index) => (
                        <Card key={index} className={cn("rounded-2xl shadow-sm hover:shadow-md transition-shadow", feature.gridClass)}>
                            <div className="flex flex-col h-full">
                                <div className={cn("flex-grow flex items-start gap-4", feature.contentAlignment === 'start' ? 'flex-col' : 'items-center')}>
                                    {feature.icon}
                                    <div>
                                        <h3 className="font-headline font-semibold">{t(feature.titleKey)}</h3>
                                        <p className="text-sm text-muted-foreground">{t(feature.descriptionKey)}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                     <Button asChild variant={feature.buttonVariant} size="sm" className={feature.buttonClass}>
                                        <Link href={feature.href}>{feature.buttonText}</Link>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                 </div>

            </main>
        </SidebarInset>
    );
}
