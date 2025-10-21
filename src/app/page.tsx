'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useRef } from 'react';
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
} from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { SidebarInset } from '@/components/ui/sidebar';
import { useSlideshow } from '@/context/slideshow-context';
import { useLanguage } from '@/context/language-context';

const weatherData = {
  location: 'Dhaka, Bangladesh',
  temp: 32,
  conditionKey: 'dashboard.weather.condition.partlyCloudy',
  icon: <CloudSun className="size-12 text-yellow-500" />,
};

export default function DashboardPage() {
    const { slideshowImages } = useSlideshow();
    const plugin = useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    );
    const { t } = useLanguage();

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
        <AppHeader titleKey="app.header.title.welcome" />
        <main className="flex-1 p-4 md:p-6">
            <Card className="relative overflow-hidden">
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
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
               <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                    <Card className="max-w-md bg-white/20 backdrop-blur-sm text-white border-white/30">
                         <CardHeader>
                            <CardTitle className="font-headline text-white">{t('dashboard.weather.title')}</CardTitle>
                            <CardDescription className="flex items-center gap-1 text-white/90"><MapPin className="size-4"/>{weatherData.location}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-around gap-4 text-center">
                            <div className='text-yellow-300'>{weatherData.icon}</div>
                            <div>
                                <p className="font-headline text-5xl font-bold">{weatherData.temp}°C</p>
                                <p className="text-white/90">{t(weatherData.conditionKey)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Card>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
                <Link href={feature.href} key={feature.href}>
                <Card className="flex h-full flex-col justify-between transition-all hover:shadow-md hover:-translate-y-1">
                    <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                        <CardTitle className="font-headline text-lg sm:text-xl">
                            {t(feature.titleKey)}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{t(feature.descriptionKey)}</CardDescription>
                        </div>
                        {React.cloneElement(feature.icon, { className: 'size-6 sm:size-8 text-primary shrink-0 ml-2' })}
                    </div>
                    </CardHeader>
                </Card>
                </Link>
            ))}
            </div>

            <div className="mt-8">
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
