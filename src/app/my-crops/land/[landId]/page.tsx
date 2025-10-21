
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarInset } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Tractor, ChevronRight, Sprout } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { fetchCropGuidance } from '@/lib/actions';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getGrowthStage } from '@/lib/crop-stages';

type LandDetailsPageProps = {
  params: { landId: string };
};

const cropFormSchema = z.object({
  cropName: z.string().min(1, 'Crop name is required.'),
  sowingDate: z.date({
    required_error: "A sowing date is required.",
  }),
  status: z.string().min(1, 'Crop stage is required.'),
});

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

const stageOptions = [
    { value: 'Seed Sowing', labelKey: 'myCrops.form.stage.options.seedsowing' },
    { value: 'Germination & Early Growth', labelKey: 'myCrops.form.stage.options.germinationandearlygrowth' },
    { value: 'Vegetative Growth', labelKey: 'myCrops.form.stage.options.vegetativegrowth' },
    { value: 'Flowering & Fruiting', labelKey: 'myCrops.form.stage.options.floweringandfruiting' },
    { value: 'Harvesting', labelKey: 'myCrops.form.stage.options.harvesting' },
    { value: 'Post-Harvest', labelKey: 'myCrops.form.stage.options.postharvest' },
] as const;


export default function LandDetailsPage({ params }: LandDetailsPageProps) {
  const { landId } = params;
  const [isPending, setIsPending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const landDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'lands', landId);
  }, [firestore, user, landId]);
  const { data: land, isLoading: isLandLoading } = useDoc(landDocRef);

  const landCropsQuery = useMemoFirebase(() => {
    if (!landDocRef) return null;
    return collection(landDocRef, 'crops');
  }, [landDocRef]);
  const { data: crops, isLoading: areCropsLoading } = useCollection(landCropsQuery);

  const form = useForm<z.infer<typeof cropFormSchema>>({
    resolver: zodResolver(cropFormSchema),
    defaultValues: {
      cropName: '',
      status: '',
    },
  });

  async function onSubmit(values: z.infer<typeof cropFormSchema>) {
    if (!user || !firestore || !landCropsQuery || !land) {
        toast({ variant: 'destructive', title: t('myCrops.addCropDialog.toast.error.title'), description: 'User or land not found.' });
        return;
    }
    setIsPending(true);

    const cropData = {
        ...values,
        sowingDate: format(values.sowingDate, 'yyyy-MM-dd'),
        status: values.status,
        userProfileId: user.uid,
        landId: landId,
        createdAt: serverTimestamp(),
        guidance: null, // Initially null
    };

    try {
      // Add the document optimistically
      const newDocRef = await addDocumentNonBlocking(landCropsQuery, cropData);
      
      toast({
          title: t('myCrops.addCropDialog.toast.success.title'),
          description: t('myCrops.addCropDialog.toast.success.description', { cropName: values.cropName }),
      });
      form.reset();
      setIsDialogOpen(false);

      // Now, fetch the guidance in the background
      const { data: guidanceData, error: guidanceError } = await fetchCropGuidance({
        cropName: values.cropName,
        region: land.location || 'Bangladesh',
        currentStage: values.status,
      });

      if (guidanceData && newDocRef) {
        // Update the document with the fetched guidance
        updateDocumentNonBlocking(doc(firestore, newDocRef.path), { guidance: guidanceData });
      } else if (guidanceError) {
        console.error("Failed to fetch guidance for new crop:", guidanceError);
        // Optional: show a non-blocking toast that guidance failed
      }

    } catch (error) {
       toast({
        variant: 'destructive',
        title: t('myCrops.addCropDialog.toast.error.title'),
        description: t('myCrops.addCropDialog.toast.error.description'),
      });
    } finally {
        setIsPending(false);
    }
  }

  const renderGrowthStage = (sowingDate: string) => {
    if (!sowingDate) return null;
    const { stageKey } = getGrowthStage(new Date(sowingDate));
    return t(stageKey);
  };

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
                <BreadcrumbPage>
                  {isLandLoading ? <Loader2 className="size-4 animate-spin"/> : land?.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline">{t('myCrops.crops.title')}</CardTitle>
              <CardDescription>{t('myCrops.crops.description', { landName: land?.name || '...' })}</CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button disabled={isLandLoading} size="sm">
                      <PlusCircle className="size-5 sm:mr-2"/>
                      <span className="hidden sm:inline">{t('myCrops.crops.addCropButton')}</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('myCrops.addCropDialog.title')}</DialogTitle>
                        <DialogDescription>{t('myCrops.addCropDialog.description')}</DialogDescription>
                    </DialogHeader>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          <FormField
                            control={form.control}
                            name="sowingDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>{t('myCrops.form.sowingDate.label')}</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>{t('myCrops.form.sowingDate.placeholder')}</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                           />
                             <FormField control={form.control} name="status" render={({ field }) => (
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
                          <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">{t('myCrops.addCropDialog.cancelButton')}</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {t('myCrops.addCropDialog.submitButton')}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isUserLoading || areCropsLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="size-8 animate-spin text-primary" />
                </div>
            ) : crops && crops.length > 0 ? (
                <div className="space-y-2">
                    {crops.map((crop: any) => (
                        <Link href={`/my-crops/land/${landId}/crop/${crop.id}`} key={crop.id}>
                            <Card className="hover:bg-accent/50 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Sprout className="size-8 text-primary" />
                                        <div>
                                            <h3 className="font-headline font-semibold">{t(`myCrops.form.cropName.options.${crop.cropName.toLowerCase()}` as any)}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {renderGrowthStage(crop.sowingDate)}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-5 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                 <div className="flex min-h-40 flex-col items-center justify-center space-y-4 text-center rounded-lg border-2 border-dashed">
                    <Tractor className="size-12 text-muted-foreground"/>
                    <p className="text-muted-foreground">{t('myCrops.crops.empty')}</p>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  );
}
