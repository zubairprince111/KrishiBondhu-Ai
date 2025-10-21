
'use client';

import { useTransition, useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { fetchCropGuidance } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, CheckCircle, Circle, Tractor, CalendarDays, Timer } from 'lucide-react';
import type { CropGuidanceOutput } from '@/ai/flows/crop-guidance-flow';
import { useLanguage } from '@/context/language-context';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { differenceInDays, addDays, format } from 'date-fns';
import { Progress } from '@/components/ui/progress';


type CropDetailsClientPageProps = {
  landId: string;
  cropId: string;
};

export default function CropDetailsPageClient({ landId, cropId }: CropDetailsClientPageProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CropGuidanceOutput | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();

  const landDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !landId) return null;
    return doc(firestore, 'users', user.uid, 'lands', landId);
  }, [firestore, user, landId]);
  const { data: land, isLoading: isLandLoading } = useDoc(landDocRef);

  const cropDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !landId || !cropId) return null;
    return doc(firestore, 'users', user.uid, 'lands', landId, 'crops', cropId);
  }, [firestore, user, landId, cropId]);

  const { data: crop, isLoading: isCropLoading } = useDoc(cropDocRef);

  useEffect(() => {
    if (crop && land) {
      setResult(null);
      startTransition(async () => {
        const { data, error } = await fetchCropGuidance({
            cropName: crop.cropName,
            region: land?.location || 'Bangladesh',
            currentStage: crop.status,
        });
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error,
          });
        } else if (data) {
          setResult(data);
        }
      });
    }
  }, [crop, land, toast]);

  const cropNameTranslationKey = `myCrops.form.cropName.options.${(crop?.cropName || '').toLowerCase()}` as const;

  const sowingDate = crop?.sowingDate ? new Date(crop.sowingDate) : null;
  const daysPassed = sowingDate ? differenceInDays(new Date(), sowingDate) : 0;

  const currentStageInfo = result?.guidance.find(step => !step.isCompleted);
  const stageDuration = currentStageInfo?.durationInDays ?? 0;
  
  const completedStagesDuration = result?.guidance
    .filter(step => step.isCompleted && step.title !== currentStageInfo?.title)
    .reduce((acc, step) => acc + step.durationInDays, 0) ?? 0;
    
  const daysIntoCurrentStage = Math.max(0, daysPassed - completedStagesDuration);
  const daysRemaining = Math.max(0, stageDuration - daysIntoCurrentStage);
  const progressPercentage = stageDuration > 0 ? (daysIntoCurrentStage / stageDuration) * 100 : 0;


  return (
    <SidebarInset>
      <AppHeader titleKey="sidebar.nav.myCrops" />
      <main className="flex-1 p-4 md:p-6">
        <div className="mb-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/my-crops">{t('sidebar.nav.myCrops')}</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                     <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href={`/my-crops/land/${landId}`}>{isLandLoading ? <Loader2 className="size-4 animate-spin"/> : land?.name}</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>
                            {isCropLoading ? <Loader2 className="size-4 animate-spin"/> : t(cropNameTranslationKey)}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </div>

        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Wand2 className="text-primary" />
              {t('myCrops.guide.title')}
            </CardTitle>
            <CardDescription>
              {t('myCrops.guide.description')}{' '}
              {crop ? t(cropNameTranslationKey) : t('myCrops.guide.defaultCrop')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCropLoading || isPending ? (
              <div className="flex min-h-80 flex-col items-center justify-center space-y-4 text-center">
                <Loader2 className="size-12 animate-spin text-primary" />
                <p className="text-primary">{t('myCrops.guide.loading')}</p>
              </div>
            ) : !result ? (
               <div className="flex min-h-80 flex-col items-center justify-center space-y-4 text-center">
                    <Tractor className="size-12 text-muted-foreground"/>
                    <p className="text-muted-foreground">{t('myCrops.guide.placeholder')}</p>
                </div>
            ) : (
              <>
                <Card className="mb-6">
                    <CardHeader className="pb-2">
                        <CardTitle className="font-headline text-lg">Growth Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="rounded-lg bg-background p-3">
                                <p className="text-sm text-muted-foreground">Days Passed</p>
                                <p className="text-2xl font-bold">{daysPassed}</p>
                            </div>
                            <div className="rounded-lg bg-background p-3">
                                <p className="text-sm text-muted-foreground">Days Remaining (Current Stage)</p>
                                <p className="text-2xl font-bold">{daysRemaining}</p>
                            </div>
                        </div>
                        <div>
                             <Progress value={progressPercentage} className="h-2" />
                             <p className="mt-2 text-center text-xs text-muted-foreground">
                                {currentStageInfo?.title ?? 'Completed'} Stage Progress
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    defaultValue={currentStageInfo?.title}
                >
                    {result.guidance.map((step) => (
                    <AccordionItem value={step.title} key={step.title}>
                        <AccordionTrigger>
                        <div className="flex items-center gap-3">
                            {step.isCompleted ? (
                            <CheckCircle className="size-5 text-green-500" />
                            ) : (
                            <Circle className="size-5 text-muted-foreground" />
                            )}
                            <span className="font-semibold">{step.title}</span>
                        </div>
                        </AccordionTrigger>
                        <AccordionContent className="pl-8 text-muted-foreground space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                                <Timer className="size-4"/>
                                <span>Typical Duration: {step.durationInDays} days</span>
                            </div>
                            <p>{step.details}</p>
                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  );
}
