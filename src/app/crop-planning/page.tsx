'use client';

import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarInset } from '@/components/ui/sidebar';
import { getOptimalCrops } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sprout, Wand2 } from 'lucide-react';
import type { OptimalCropSuggestionOutput } from '@/ai/flows/optimal-crop-suggestion';
import { useLanguage } from '@/context/language-context';

const formSchema = z.object({
  region: z.string().min(2, 'Region is required.'),
  soilType: z.string().min(2, 'Soil type is required.'),
  currentSeason: z.string().min(2, 'Season is required.'),
  localClimateData: z.string().min(2, 'Climate data is required.'),
});

export default function CropPlanningPage() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<OptimalCropSuggestionOutput | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      region: '',
      soilType: '',
      currentSeason: '',
      localClimateData: 'Avg. temp 28°C, 80% humidity',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setResult(null);
    startTransition(async () => {
      const { data, error } = await getOptimalCrops(values);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error,
        });
      } else {
        setResult(data);
      }
    });
  }

  return (
    <SidebarInset>
      <AppHeader titleKey="app.header.title.cropPlanning" />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Find Your Optimal Crop</CardTitle>
              <CardDescription>
                Fill in the details below to get AI-powered crop suggestions for your land.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="region" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a region" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Dhaka">Dhaka</SelectItem>
                            <SelectItem value="Chittagong">Chittagong</SelectItem>
                            <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                            <SelectItem value="Khulna">Khulna</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="soilType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soil Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a soil type" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Loamy">Loamy</SelectItem>
                            <SelectItem value="Clay">Clay</SelectItem>
                            <SelectItem value="Sandy">Sandy</SelectItem>
                            <SelectItem value="Alluvial">Alluvial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="currentSeason" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Season</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a season" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Kharif-1 (Summer)">Kharif-1 (Summer)</SelectItem>
                            <SelectItem value="Kharif-2 (Monsoon)">Kharif-2 (Monsoon)</SelectItem>
                            <SelectItem value="Rabi (Winter)">Rabi (Winter)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="localClimateData" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local Climate Data</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</> : 'Get Suggestions'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Wand2 className="text-primary"/>
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!result && !isPending && (
                <div className="flex flex-col items-center justify-center space-y-4 text-center h-full min-h-64">
                    <Sprout className="size-12 text-muted-foreground"/>
                    <p className="text-muted-foreground">Your crop recommendations will appear here.</p>
                </div>
              )}
               {isPending && (
                <div className="flex flex-col items-center justify-center space-y-4 text-center h-full min-h-64">
                    <Loader2 className="size-12 text-primary animate-spin"/>
                    <p className="text-primary">Analyzing your farm data...</p>
                </div>
              )}
              {result && (
                <div className="space-y-6">
                    <div>
                        <h3 className="font-headline text-lg font-semibold">Suggested Crops</h3>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {result.suggestedCrops.map(crop => (
                            <div key={crop} className="rounded-md bg-background p-2 text-center font-medium">{crop}</div>
                          ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-headline text-lg font-semibold">Reasoning</h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {result.reasoning}
                        </p>
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}
