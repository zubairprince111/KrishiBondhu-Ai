
'use client';

import { useTransition, useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { fetchCropGuidance } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, CheckCircle, Circle, Tractor, Timer } from 'lucide-react';
import type { CropGuidanceOutput } from '@/ai/flows/crop-guidance-flow';
import { useLanguage } from '@/context/language-context';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { differenceInDays } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';

type CropDetailsPageProps = {
  params: {
    landId: string;
    cropId: string;
  };
};

export default function CropDetailsPage({ params }: CropDetailsPageProps) {
  const { landId, cropId } = params;
  const [isGuidanceLoading, startGuidanceLoading] = useTransition();
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
    if (crop && !crop.guidance && !isGuidanceLoading && cropDocRef && land) {
      startGuidanceLoading(async () => {
        const { data: guidanceData, error } = await fetchCropGuidance({
            cropName: crop.cropName,
            region: land.location || 'Bangladesh',
            currentStage: crop.status,
        });
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch AI guidance for this crop.',
          });
        } else if (guidanceData) {
          await updateDoc(cropDocRef, { guidance: guidanceData });
        }
      });
    }
  }, [crop, land, cropDocRef, isGuidanceLoading, toast]);

  const result: CropGuidanceOutput | null = crop?.guidance || null;

  const cropNameTranslationKey = `myCrops.form.cropName.options.${(crop?.cropName || '').toLowerCase()}` as const;

  const sowingDate = crop?.sowingDate ? new Date(crop.sowingDate) : null;
  const daysPassed = sowingDate ? differenceInDays(new Date(), sowingDate) : 0;

  const handleTaskToggle = async (stepTitle: string, isCompleted: boolean) => {
    if (!cropDocRef || !result) return;

    const newGuidance = {
        ...result,
        guidance: result.guidance.map(step =>
            step.title === stepTitle ? { ...step, isCompleted } : step
        ),
    };

    try {
        await updateDoc(cropDocRef, { guidance: newGuidance });
    } catch (error) {
        console.error("Failed to update task status:", error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not save your changes. Please try again.',
        });
    }
  };


  // Client-side calculation based on time, for suggesting which accordion item to open.
  const timeBasedGuidance = result?.guidance.map(step => {
      const completedStepsDuration = result.guidance
          .slice(0, result.guidance.indexOf(step))
          .reduce((acc, s) => acc + s.durationInDays, 0);
      return {
          ...step,
          isTimeCompleted: daysPassed >= completedStepsDuration,
      };
  });

  // The currently active stage is the first one that isn't completed by time.
  const currentStageByTime = timeBasedGuidance?.find(step => !step.isTimeCompleted);

  const stageDuration = currentStageByTime?.durationInDays ?? 0;
  
  const completedStagesDuration = timeBasedGuidance
    ?.filter(step => step.isTimeCompleted && step.title !== currentStageByTime?.title)
    .reduce((acc, step) => acc + step.durationInDays, 0) ?? 0;
    
  const daysIntoCurrentStage = Math.max(0, daysPassed - completedStagesDuration);
  const daysRemaining = Math.max(0, stageDuration - daysIntoCurrentStage);
  const progressPercentage = stageDuration > 0 ? (daysIntoCurrentStage / stageDuration) * 100 : 0;

  return (
    <SidebarInset>
      <AppHeader titleKey="sidebar.nav.myCrops" />
      <main className="flex-1 p-4 md:p-6 space-y-6">
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

        {isCropLoading ? (
            <Card>
                <CardContent className="flex min-h-80 flex-col items-center justify-center space-y-4 text-center">
                    <Loader2 className="size-12 animate-spin text-primary" />
                </CardContent>
            </Card>
        ) : crop ? (
            <>
                <Card>
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
                                {currentStageByTime?.title ?? 'Completed'} Stage Progress
                            </p>
                        </div>
                    </CardContent>
                </Card>

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
                    {!result || isGuidanceLoading ? (
                       <div className="flex min-h-60 flex-col items-center justify-center space-y-4 text-center">
                            <Loader2 className="size-12 animate-spin text-primary" />
                            <p className="text-primary">{t('myCrops.guide.loading')}</p>
                        </div>
                    ) : (
                      <Accordion
                        type="single"
                        collapsible
                        className="w-full"
                        defaultValue={currentStageByTime?.title}
                      >
                        {result.guidance.map((step) => (
                          <AccordionItem value={step.title} key={step.title}>
                            <AccordionTrigger>
                              <div className="flex flex-1 items-center gap-3">
                                <Checkbox
                                  id={`task-${step.title}`}
                                  checked={step.isCompleted}
                                  onCheckedChange={(checked) => {
                                      handleTaskToggle(step.title, !!checked);
                                  }}
                                  onClick={(e) => e.stopPropagation()} // Prevent accordion from toggling
                                  className="size-5"
                                />
                                <span className="font-semibold">{step.title}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-10 text-muted-foreground space-y-2">
                                <div className="flex items-center gap-2 text-xs">
                                    <Timer className="size-4"/>
                                    <span>Typical Duration: {step.durationInDays} days</span>
                                </div>
                                <p>{step.details}</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
            </>
        ) : (
            <Card>
                <CardContent className="flex min-h-80 flex-col items-center justify-center space-y-4 text-center">
                    <Tractor className="size-12 text-muted-foreground"/>
                    <p className="text-muted-foreground">Crop not found.</p>
                </CardContent>
            </Card>
        )}
      </main>
    </SidebarInset>
  );
}
