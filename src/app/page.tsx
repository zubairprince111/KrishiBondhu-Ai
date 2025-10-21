'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useRef, useState, useEffect, useTransition } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Leaf,
  Mic,
  CloudSun,
  ClipboardList,
  MessageSquare,
  Landmark,
  WifiOff,
  MapPin,
  Sprout,
  Wind,
  Droplets,
  Loader2,
} from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { SidebarInset } from '@/components/ui/sidebar';
import { useSlideshow } from '@/context/slideshow-context';
import { useLanguage } from '@/context/language-context';
import type { TranslationKey } from '@/lib/i18n';
import { suggestSeasonalCrops } from '@/lib/actions';
import { OptimalCropSuggestionOutput } from '@/ai/flows/optimal-crop-suggestion';

const weatherData = {
  location: 'Dhaka, Bangladesh',
  temp: 32,
  conditionKey: 'dashboard.weather.condition.partlyCloudy',
  icon: <CloudSun className="size-10 text-yellow-400" />,
  humidity: '78%',
  wind: '12 km/h',
};

export default function DashboardPage() {
    const { slideshowImages } = useSlideshow();
    const [isPending, startTransition] = useTransition();
    const [seasonalCrops, setSeasonalCrops] = useState<OptimalCropSuggestionOutput | null>(null);

    const plugin = useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    );
    const { t } = useLanguage();

     useEffect(() => {
        startTransition(async () => {
            const { data } = await suggestSeasonalCrops();
            setSeasonalCrops(data);
        });
    }, []);


    const features = [
      {
        titleKey: 'dashboard.feature.cropDoctor.title',
        descriptionKey: 'dashboard.feature.cropDoctor.description',
        href: '/crop-doctor',
        icon: <Leaf className="size-8 text-primary" />,
      },
      {
        titleKey: 'dashboard.feature.voiceAssistant.title',
        descriptionKey: 'dashboard.feature.voiceAssistant.description',
        href: '/voice-assistant',
        icon: <Mic className="size-8 text-primary" />,
      },
      {
        titleKey: 'dashboard.feature.weather.title',
        descriptionKey: 'dashboard.feature.weather.description',
        href: '/weather',
        icon: <CloudSun className="size-8 text-primary" />,
      },
      {
        titleKey: 'dashboard.feature.cropPlanning.title',
        descriptionKey: 'dashboard.feature.cropPlanning.description',
        href: '/crop-planning',
        icon: <ClipboardList className="size-8 text-primary" />,
      },
      {
        titleKey: 'dashboard.feature.community.title',
        descriptionKey: 'dashboard.feature.community.description',
        href: '/community',
        icon: <MessageSquare className="size-8 text-primary" />,
      },
      {
        titleKey: 'dashboard.feature.marketInfo.title',
        descriptionKey: 'dashboard.feature.marketInfo.description',
        href: '/market-info',
        icon: <Landmark className="size-8 text-primary" />,
      },
    ] as const;

    return (
        <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 space-y-6">
            <Card className="overflow-hidden">
              <Carousel 
                className="w-full"
                plugins={[plugin.current]}
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
              >
                <CarouselContent>
                  {slideshowImages.map((image) => (
                    <CarouselItem key={image.id}>
                      <div className="relative h-56 sm:h-80 w-full">
                        <Image
                          src={image.imageUrl}
                          alt={image.description}
                          data-ai-hint={image.imageHint}
                          fill
                          className="object-cover"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4" />
                <CarouselNext className="absolute right-4" />
              </Carousel>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-blue-900/10 dark:bg-blue-500/10 border-blue-200 dark:border-blue-900">
                     <CardHeader className="p-3">
                        <CardTitle className="font-headline text-base flex items-center justify-between">
                            <span>{t('dashboard.weather.title')}</span>
                            <span className="font-medium">{weatherData.temp}°C</span>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-xs"><MapPin className="size-3"/>{weatherData.location}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 flex items-center justify-between gap-4 text-center">
                        <div className="flex flex-col items-center">
                            {weatherData.icon}
                            <p className="text-muted-foreground text-xs mt-1">{t(weatherData.conditionKey)}</p>
                        </div>
                        <div className="flex gap-4 text-left">
                            <div className="flex items-center gap-2">
                                <Droplets className="size-4 text-blue-400"/>
                                <div>
                                    <p className="text-xs text-muted-foreground">Humidity</p>
                                    <p className="font-bold text-sm">{weatherData.humidity}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-2">
                                <Wind className="size-4 text-gray-400"/>
                                 <div>
                                    <p className="text-xs text-muted-foreground">Wind</p>
                                    <p className="font-bold text-sm">{weatherData.wind}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 <Card className="bg-green-900/10 dark:bg-green-500/10 border-green-200 dark:border-green-900">
                     <CardHeader className="p-3">
                        <CardTitle className="font-headline text-base">AI Seasonal Suggestions</CardTitle>
                        <CardDescription className="text-xs">Based on your region's current conditions</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 flex items-center justify-center min-h-[78px]">
                      {isPending && <Loader2 className="size-6 animate-spin text-primary" />}
                      {!isPending && seasonalCrops && (
                         <div className="w-full space-y-1">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-center">
                              {seasonalCrops.suggestedCrops.map(crop => (
                                  <div key={crop} className="bg-background/50 rounded-lg p-1">
                                      <p className="font-bold text-xs">{crop}</p>
                                  </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center pt-1">{seasonalCrops.reasoning}</p>
                         </div>
                      )}
                       {!isPending && !seasonalCrops && (
                          <p className="text-sm text-muted-foreground">Could not load suggestions.</p>
                       )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {features.map((feature) => (
                <Link href={feature.href} key={feature.href}>
                <Card className="flex h-full flex-col justify-between transition-all hover:shadow-md hover:-translate-y-1">
                    <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                        <CardTitle className="font-headline text-base sm:text-xl">
                            {t(feature.titleKey)}
                        </CardTitle>
                        <CardDescription className="hidden sm:block text-xs sm:text-sm">{t(feature.descriptionKey)}</CardDescription>
                        </div>
                        {React.cloneElement(feature.icon, { className: 'size-6 sm:size-8 text-primary shrink-0 ml-2' })}
                    </div>
                    </CardHeader>
                </Card>
                </Link>
            ))}
            </div>

            <div >
            <Card className="bg-accent/50">
                <CardHeader>
                <div className="flex items-center gap-4">
                    <WifiOff className="size-6 text-accent-foreground" />
                    <div>
                    <CardTitle className="font-headline text-lg text-accent-foreground">{t('dashboard.offline.title')}</CardTitle>
                    <CardDescription className="text-accent-foreground/80">
                       {t('dashboard.offline.description')}
                    </CardDescription>
                    </div>
                </div>
                </CardHeader>
            </Card>
            </div>
        </main>
        </SidebarInset>
    );
}
