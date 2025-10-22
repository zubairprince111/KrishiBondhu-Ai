
'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  ScanEye,
  Loader2,
  MapPin,
  Mic,
  BarChart,
  Plus,
  BookOpen,
  Video,
  ListChecks,
  RefreshCw,
  Droplets,
  Sprout,
  Tractor,
  LogIn,
  CalendarDays,
} from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { SidebarInset } from '@/components/ui/sidebar';
import { useLanguage } from '@/context/language-context';
import { suggestSeasonalCrops } from '@/lib/actions';
import type { OptimalCropSuggestionOutput } from '@/ai/flows/optimal-crop-suggestion';
import { useGeolocation } from '@/hooks/use-geolocation';
import { getWeather, getConditionIcon, getCurrentSeason } from '@/lib/weather';
import type { WeatherData } from '@/lib/weather';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';


const RANK_STYLES = {
    0: { icon: '🥇', color: 'bg-yellow-400/10 border-yellow-500/50', textColor: 'text-yellow-600' },
    1: { icon: '🥈', color: 'bg-slate-300/20 border-slate-400/50', textColor: 'text-slate-600' },
    2: { icon: '🥉', color: 'bg-orange-400/10 border-orange-500/50', textColor: 'text-orange-600' },
};

function SeasonalSuggestionCard() {
    const { t } = useLanguage();
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<OptimalCropSuggestionOutput | null>(null);
    const { location } = useGeolocation();

    useEffect(() => {
        startTransition(async () => {
            const { data } = await suggestSeasonalCrops();
            setResult(data);
        });
    }, []);

    const season = getCurrentSeason();

    if (isPending) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">{t('dashboard.insights.title')}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center min-h-[200px]">
                    <Loader2 className="animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">{t('dashboard.insights.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1 rounded-lg border bg-muted/50 p-3">
                    <p className="text-xs font-semibold text-muted-foreground">{t('seasonalSuggestions.locationLabel')}</p>
                    <p className="font-medium flex items-center gap-1"><MapPin className="size-4" /> {location ? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : 'Bangladesh'}</p>
                </div>
                <div className="space-y-1 rounded-lg border bg-muted/50 p-3">
                    <p className="text-xs font-semibold text-muted-foreground">{t('seasonalSuggestions.seasonLabel')}</p>
                    <p className="font-medium flex items-center gap-1"><CalendarDays className="size-4" /> {season.name}</p>
                </div>
                
                <div className="space-y-3 pt-2">
                    {result?.suggestedCrops.map((crop, index) => {
                        const rankStyle = RANK_STYLES[index as keyof typeof RANK_STYLES] || RANK_STYLES[2];
                        return (
                            <div key={crop.cropName} className={`p-3 rounded-lg border flex items-center gap-4 ${rankStyle.color}`}>
                                <span className="text-2xl">{rankStyle.icon}</span>
                                <div className="flex-1">
                                    <p className={`font-headline font-bold text-lg ${rankStyle.textColor}`}>{crop.cropName}</p>
                                    <p className="text-xs text-muted-foreground">{crop.variety}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-xl ${rankStyle.textColor}`}>{crop.suitabilityScore}%</p>
                                    <p className="text-xs text-muted-foreground">{t('seasonalSuggestions.suitability')}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {result?.reasoning && <p className="text-xs text-muted-foreground text-center pt-2">{result.reasoning}</p>}
            </CardContent>
        </Card>
    );
}


export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [seasonalCrops, setSeasonalCrops] =
    useState<OptimalCropSuggestionOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { location, error: locationError } = useGeolocation();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const { t } = useLanguage();

  const heroImage = PlaceHolderImages.find((p) => p.id === 'hero-image');

  const userLandsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'lands');
  }, [firestore, user]);
  const { data: lands } = useCollection(userLandsQuery);


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

  const quickActions = [
    {
      title: t('dashboard.action.addCrop'),
      icon: Plus,
      href: '/my-crops',
    },
    {
      title: t('dashboard.action.diagnose'),
      icon: ScanEye,
      href: '/crop-doctor',
    },
    { title: t('dashboard.action.askAI'), icon: Mic, href: '/voice-assistant' },
    {
      title: t('dashboard.action.marketPrices'),
      icon: BarChart,
      href: '/market-info',
    },
  ];

  const resources = [
      { title: t('dashboard.resources.fertilizerGuide'), icon: BookOpen },
      { title: t('dashboard.resources.leafSpotsVideo'), icon: Video },
      { title: t('dashboard.resources.planningChecklist'), icon: ListChecks },
  ];

  const renderWeather = () => {
    if (isWeatherLoading)
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />{' '}
          <span>{t('dashboard.weather.loading')}</span>
        </div>
      );
    if (locationError || !weatherData)
      return (
        <div className="flex items-center gap-2">
          <MapPin className="size-4" /> <span>{t('dashboard.weather.locationOff')}</span>
        </div>
      );

    return (
      <div className="flex items-center gap-3">
        {getConditionIcon(weatherData.current.conditionCode, 'size-8')}
        <div>
          <p className="font-headline text-2xl font-bold">
            {weatherData.current.temperature}°C
          </p>
          <p className="text-xs">{weatherData.locationName.split(',')[0]}</p>
        </div>
      </div>
    );
  };

  const fieldsMonitored = lands?.length ?? 0;
  const upcomingTasks = lands?.length ?? 0; // Simplified for now

  return (
    <SidebarInset>
      <AppHeader />
      <main className="flex-1 space-y-6 bg-muted/40 p-4 md:p-6">
        {/* Hero Section */}
        <div className="relative min-h-[300px] w-full overflow-hidden rounded-2xl p-6 text-white md:p-8 flex flex-col justify-between">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          <div className="relative ml-auto rounded-full bg-black/30 p-2 px-4 backdrop-blur-sm">
            {renderWeather()}
          </div>

          <div className="relative">
            <h2 className="font-headline text-3xl font-bold md:text-4xl">
              {user ? t('dashboard.welcome', { name: user.displayName?.split(' ')[0] || t('dashboard.farmer') }) : 'Welcome to KrishiBondhu!'}
            </h2>
            {user ? (
                 <>
                    <p className="mt-1 max-w-lg">
                      {fieldsMonitored > 0 ? t('dashboard.farmStatus') : 'Add your first crop to get personalized insights.'}
                    </p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                            <p className="text-sm text-white/80">{t('dashboard.metrics.health')}</p>
                            <p className="font-bold text-lg">{fieldsMonitored > 0 ? t('dashboard.metrics.healthValue') : '--'}</p>
                        </div>
                        <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                            <p className="text-sm text-white/80">{t('dashboard.metrics.fields')}</p>
                            <p className="font-bold text-lg">{fieldsMonitored}</p>
                        </div>
                        <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                            <p className="text-sm text-white/80">{t('dashboard.metrics.tasks')}</p>
                            <p className="font-bold text-lg">{upcomingTasks}</p>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <p className="mt-1 max-w-lg">Your AI farming companion. Sign in to personalize your experience.</p>
                    <Button asChild size="lg" className="mt-4 bg-accent text-accent-foreground hover:bg-accent/80">
                        <Link href="/login"><LogIn className="mr-2"/> Login / Get Started</Link>
                    </Button>
                </>
            )}
          </div>
        </div>

        {/* Alert Bar */}
        <div className="flex items-center justify-between gap-4 rounded-xl border-l-4 border-orange-500 bg-orange-100 p-4 text-orange-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-6" />
            <p className="font-semibold">
             {t('dashboard.alert.critical')} {t('dashboard.alert.floodWarning')}
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-orange-300 bg-transparent hover:bg-orange-200/50">
            {t('dashboard.alert.openAlerts')}
          </Button>
        </div>

        {/* Actionable Insights */}
        <section>
             <h3 className="font-headline text-xl font-semibold">{t('dashboard.actionableInsights.title')}</h3>
             <p className="text-muted-foreground text-sm">{t('dashboard.actionableInsights.description')}</p>
            <div className="mt-4 grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <SeasonalSuggestionCard />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    {quickActions.map(action => (
                         <Link href={action.href} key={action.title}>
                            <Card className="flex flex-col items-center justify-center gap-2 p-4 h-full text-center hover:bg-accent/20 transition-colors">
                                <action.icon className="size-6 text-primary"/>
                                <p className="text-sm font-semibold">{action.title}</p>
                            </Card>
                         </Link>
                    ))}
                </div>
            </div>
        </section>

        {/* My Crops Banner */}
        <div className="rounded-xl bg-primary p-6 text-primary-foreground flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Tractor className="size-10"/>
                <div>
                    <h3 className="font-headline text-xl font-bold">{t('sidebar.nav.myCrops')}</h3>
                    <p className="text-sm opacity-80">{t('dashboard.myCrops.description')}</p>
                </div>
            </div>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
                <Link href="/my-crops">{t('dashboard.myCrops.viewDashboard')}</Link>
            </Button>
        </div>


        {/* Community & Resources */}
        <section>
             <h3 className="font-headline text-xl font-semibold">{t('dashboard.communityAndResources.title')}</h3>
             <p className="text-muted-foreground text-sm">{t('dashboard.communityAndResources.description')}</p>
             <div className="mt-4 grid gap-6 md:grid-cols-3">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.community.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="group">
                             <p className="font-semibold group-hover:underline">{t('dashboard.community.post1')}</p>
                             <p className="text-xs text-muted-foreground">27 replies • Local group</p>
                         </div>
                         <div className="group">
                             <p className="font-semibold group-hover:underline">{t('dashboard.community.post2')}</p>
                             <p className="text-xs text-muted-foreground">Active now</p>
                         </div>
                         <Button variant="secondary" className="w-full" asChild><Link href="/community">{t('dashboard.community.openCommunity')}</Link></Button>
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.resources.title')}</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-2">
                        {resources.map((res, i) => (
                             <Button key={i} variant="ghost" className="w-full justify-start gap-3">
                                <res.icon className="text-muted-foreground"/>{res.title}
                             </Button>
                        ))}
                         <Button variant="secondary" className="w-full mt-2 !ml-0">{t('dashboard.resources.viewAll')}</Button>
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.market.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <BarChart className="size-8 mb-2"/>
                        <p>{t('dashboard.market.placeholder')}</p>
                    </CardContent>
                 </Card>
             </div>
        </section>

      </main>
    </SidebarInset>
  );
}
