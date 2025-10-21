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
  cropName: z.string().min(2, 'Crop name is required.'),
  region: z.string().min(2, 'Region is required.'),
  currentStage: z.string().min(2, 'Current stage is required.'),
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
      currentStage: 'Seed Sowing',
    },
  });

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

  return (
    <SidebarInset>
      <AppHeader titleKey="app.header.title.myCrops" />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline">My Active Crop</CardTitle>
              <CardDescription>
                Select your crop to get personalized AI guidance from sowing to harvest.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="cropName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crop Name</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a crop" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Rice">Rice (ধান)</SelectItem>
                            <SelectItem value="Jute">Jute (পাট)</SelectItem>
                            <SelectItem value="Wheat">Wheat (গম)</SelectItem>
                            <SelectItem value="Potato">Potato (আলু)</SelectItem>
                            <SelectItem value="Tomato">Tomato (টমেটো)</SelectItem>
                            <SelectItem value="Lentil">Lentil (মসুর ডাল)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="region" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select your region" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Dhaka">Dhaka</SelectItem>
                            <SelectItem value="Chittagong">Chittagong</SelectItem>
                            <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                            <SelectItem value="Khulna">Khulna</SelectItem>
                            <SelectItem value="Barisal">Barisal</SelectItem>
                            <SelectItem value="Sylhet">Sylhet</SelectItem>
                            <SelectItem value="Rangpur">Rangpur</SelectItem>
                            <SelectItem value="Mymensingh">Mymensingh</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField control={form.control} name="currentStage" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Crop Stage</FormLabel>                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select current stage" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Land Preparation">Land Preparation</SelectItem>
                            <SelectItem value="Seed Sowing">Seed Sowing</SelectItem>
                            <SelectItem value="Germination & Early Growth">Germination & Early Growth</SelectItem>
                            <SelectItem value="Vegetative Growth">Vegetative Growth</SelectItem>
                            <SelectItem value="Flowering & Fruiting">Flowering & Fruiting</SelectItem>
                            <SelectItem value="Harvesting">Harvesting</SelectItem>
                            <SelectItem value="Post-Harvest">Post-Harvest</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</> : 'Get Guidance'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Wand2 className="text-primary"/>
                AI Farming Guide
              </CardTitle>
               <CardDescription>
                Your personalized step-by-step guide for growing {form.getValues('cropName') || 'your crop'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result && !isPending && (
                <div className="flex min-h-80 flex-col items-center justify-center space-y-4 text-center">
                    <Tractor className="size-12 text-muted-foreground"/>
                    <p className="text-muted-foreground">Your personalized crop guide will appear here.</p>
                </div>
              )}
               {isPending && (
                <div className="flex min-h-80 flex-col items-center justify-center space-y-4 text-center">
                    <Loader2 className="size-12 animate-spin text-primary"/>
                    <p className="text-primary">Generating your personalized guide...</p>
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
