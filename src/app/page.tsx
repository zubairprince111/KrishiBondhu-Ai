import Link from 'next/link';
import Image from 'next/image';
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
import { PlaceHolderImages } from '@/lib/placeholder-images';

const features = [
  {
    title: 'AI Crop Doctor',
    description: 'Diagnose crop diseases from a picture.',
    href: '/crop-doctor',
    icon: <Leaf className="size-8 text-primary" />,
  },
  {
    title: 'Voice Assistant (Mati AI)',
    description: 'Ask questions in Bangla.',
    href: '/voice-assistant',
    icon: <Mic className="size-8 text-primary" />,
  },
  {
    title: 'Weather Alerts',
    description: 'Real-time forecasts and warnings.',
    href: '/weather',
    icon: <CloudSun className="size-8 text-primary" />,
  },
  {
    title: 'Crop Planning Tool',
    description: 'Get suggestions for your next harvest.',
    href: '/crop-planning',
    icon: <ClipboardList className="size-8 text-primary" />,
  },
  {
    title: 'Community Chat',
    description: 'Connect with other farmers.',
    href: '/community',
    icon: <MessageSquare className="size-8 text-primary" />,
  },
  {
    title: 'Market Info',
    description: 'Govt. schemes and market prices.',
    href: '/market-info',
    icon: <Landmark className="size-8 text-primary" />,
  },
];

const weatherData = {
  location: 'Dhaka, Bangladesh',
  temp: 32,
  condition: 'Partly Cloudy',
  icon: <CloudSun className="size-12 text-yellow-500" />,
};

export default function DashboardPage() {
    const slideshowImages = PlaceHolderImages.filter(p => p.id.startsWith('slideshow-'));

    return (
        <SidebarInset>
        <AppHeader title="Dashboard" />
        <main className="flex-1 p-4 md:p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                    <CardTitle className="font-headline">Photo Gallery</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <Carousel className="w-full">
                        <CarouselContent>
                        {slideshowImages.map((image) => (
                            <CarouselItem key={image.id}>
                            <div className="relative h-64 w-full">
                                <Image
                                src={image.imageUrl}
                                alt={image.description}
                                data-ai-hint={image.imageHint}
                                fill
                                className="rounded-md object-cover"
                                />
                            </div>
                            </CarouselItem>
                        ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                    </Carousel>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="font-headline">Daily Weather</CardTitle>
                        <CardDescription className="flex items-center gap-1"><MapPin className="size-4"/>{weatherData.location}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                        {weatherData.icon}
                        <div>
                            <p className="font-headline text-5xl font-bold">{weatherData.temp}°C</p>
                            <p className="text-muted-foreground">{weatherData.condition}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
                <Link href={feature.href} key={feature.href}>
                <Card className="flex h-full flex-col justify-between transition-all hover:shadow-md hover:-translate-y-1">
                    <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                        <CardTitle className="font-headline text-xl">
                            {feature.title}
                        </CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                        </div>
                        {feature.icon}
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
                    <CardTitle className="font-headline text-lg text-accent-foreground">Offline Access</CardTitle>
                    <CardDescription className="text-accent-foreground/80">
                        Key features and your data are available even without an internet connection.
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
