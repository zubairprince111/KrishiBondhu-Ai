'use client';

import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarInset } from '@/components/ui/sidebar';
import { fetchCropGuidance } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Tractor, Wand2, CheckCircle, Circle } from 'lucide-react';
import type { CropGuidanceOutput } from '@/ai/flows/crop-guidance-flow';
import { useLanguage } from '@/context/language-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formSchema = z.object({
  cropName: z.string().min(1, 'Crop name is required.'),
  region: z.string().min(1, 'Region is required.'),
  currentStage: z.string().min(1, 'Current stage is required.'),
});

export default function MyCropsPage() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CropGuidanceOutput | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cropName: '',
      region: '',
      currentStage: '',
    },
  });

  const selectedCropName = form.watch('cropName');

  function onSubmit(values: z.infer<typeof formSchema>) {
    setResult(null);
    startTransition(async () => {
      const { data, error } = await fetchCropGuidance(values);
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

  const cropOptions = [
    { value: 'Rice', labelKey: 'myCrops.form.cropName.options.rice' },
    { value: 'Jute', labelKey: 'myCrops.form.cropName.options.jute' },
    { value: 'Wheat', labelKey: 'myCrops.form.cropName.options.wheat' },
    { value: 'Potato', labelKey: 'myCrops.form.cropName.options.potato' },
    { value: 'Tomato', labelKey: 'myCrops.form.cropName.options.tomato' },
    { value: 'Lentil', labelKey: 'myCrops.form.cropName.options.lentil' },
    { value: 'Maize', labelKey: 'myCrops.form.cropName.options.maize' },
    { value: 'Sugarcane', labelKey: 'myCrops.form.cropName.options.sugarcane' },
    { value: 'Onion', labelKey: 'myCrops.form.cropName.options.onion' },
    { value: 'Mustard', labelKey: 'myCrops.form.cropName.options.mustard' },
  ] as const;

  const regionOptions = [
    { value: 'Dhaka', labelKey: 'myCrops.form.region.options.dhaka' },
    { value: 'Chittagong', labelKey: 'myCrops.form.region.options.chittagong' },
    { value: 'Rajshahi', labelKey: 'myCrops.form.region.options.rajshahi' },
    { value: 'Khulna', labelKey: 'myCrops.form.region.options.khulna' },
    { value: 'Barisal', labelKey: 'myCrops.form.region.options.barisal' },
    { value: 'Sylhet', labelKey: 'myCrops.form.region.options.sylhet' },
    { value: 'Rangpur', labelKey: 'myCrops.form.region.options.rangpur' },
    { value: 'Mymensingh', labelKey: 'myCrops.form.region.options.mymensingh' },
  ] as const;

  const stageOptions = [
      { value: 'Land Preparation', labelKey: 'myCrops.form.stage.options.landPreparation' },
      { value: 'Seed Sowing', labelKey: 'myCrops.form.stage.options.seedSowing' },
      { value: 'Germination & Early Growth', labelKey: 'myCrops.form.stage.options.germination' },
      { value: 'Vegetative Growth', labelKey: 'myCrops.form.stage.options.vegetative' },
      { value: 'Flowering & Fruiting', labelKey: 'myCrops.form.stage.options.flowering' },
      { value: 'Harvesting', labelKey: 'myCrops.form.stage.options.harvesting' },
      { value: 'Post-Harvest', labelKey: 'myCrops.form.stage.options.postHarvest' },
  ] as const;

  return (
    <SidebarInset>
      <AppHeader titleKey="sidebar.nav.myCrops" />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline">{t('myCrops.title')}</CardTitle>
              <CardDescription>{t('myCrops.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="cropName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('myCrops.form.cropName.label')}</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                            <SelectTrigger><SelectValue placeholder={t('myCrops.form.cropName.placeholder')} /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cropOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{t(option.labelKey)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="region" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('myCrops.form.region.label')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder={t('myCrops.form.region.placeholder')} /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {regionOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{t(option.labelKey)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField control={form.control} name="currentStage" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('myCrops.form.stage.label')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                            <SelectTrigger><SelectValue placeholder={t('myCrops.form.stage.placeholder')} /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             {stageOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{t(option.labelKey)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('myCrops.form.button.pending')}</> : t('myCrops.form.button.submit')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Wand2 className="text-primary"/>
                {t('myCrops.guide.title')}
              </CardTitle>
               <CardDescription>
                {t('myCrops.guide.description')} {selectedCropName || t('myCrops.guide.defaultCrop')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result && !isPending && (
                <div className="flex min-h-80 flex-col items-center justify-center space-y-4 text-center">
                    <Tractor className="size-12 text-muted-foreground"/>
                    <p className="text-muted-foreground">{t('myCrops.guide.placeholder')}</p>
                </div>
              )}
               {isPending && (
                <div className="flex min-h-80 flex-col items-center justify-center space-y-4 text-center">
                    <Loader2 className="size-12 animate-spin text-primary"/>
                    <p className="text-primary">{t('myCrops.guide.loading')}</p>
                </div>
              )}
              {result && (
                <Accordion type="single" collapsible className="w-full" defaultValue={result.guidance.find(g => !g.isCompleted)?.title}>
                  {result.guidance.map((step) => (
                     <AccordionItem value={step.title} key={step.title}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          {step.isCompleted ? <CheckCircle className="size-5 text-green-500" /> : <Circle className="size-5 text-muted-foreground" />}
                          <span className="font-semibold">{step.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-8 text-muted-foreground">
                        {step.details}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}
