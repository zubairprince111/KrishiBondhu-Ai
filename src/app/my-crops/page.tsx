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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
import { Loader2, PlusCircle, Tractor, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const formSchema = z.object({
  cropName: z.string().min(1, 'Crop name is required.'),
  region: z.string().min(1, 'Region is required.'),
  sowingDate: z.date({
    required_error: "A sowing date is required.",
  }),
  status: z.string().min(1, 'Current stage is required.'),
});

export default function MyCropsPage() {
  const [isPending, setIsPending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userCropsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'crops');
  }, [firestore, user]);

  const { data: crops, isLoading: areCropsLoading } = useCollection(userCropsQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cropName: '',
      region: '',
      status: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'User not logged in.' });
        return;
    }
    setIsPending(true);

    const cropData = {
        ...values,
        sowingDate: format(values.sowingDate, 'yyyy-MM-dd'),
        userProfileId: user.uid,
        createdAt: serverTimestamp(),
    };

    try {
      if (userCropsQuery) {
        addDocumentNonBlocking(userCropsQuery, cropData);
        toast({
            title: t('myCrops.addDialog.toast.success.title'),
            description: t('myCrops.addDialog.toast.success.description', { cropName: values.cropName }),
        });
        form.reset();
        setIsDialogOpen(false);
      }
    } catch (error) {
       toast({
        variant: 'destructive',
        title: t('myCrops.addDialog.toast.error.title'),
        description: t('myCrops.addDialog.toast.error.description'),
      });
    } finally {
        setIsPending(false);
    }
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
      { value: 'Land Preparation', labelKey: 'myCrops.form.stage.options.landpreparation' },
      { value: 'Seed Sowing', labelKey: 'myCrops.form.stage.options.seedsowing' },
      { value: 'Germination & Early Growth', labelKey: 'myCrops.form.stage.options.germinationandearlygrowth' },
      { value: 'Vegetative Growth', labelKey: 'myCrops.form.stage.options.vegetativegrowth' },
      { value: 'Flowering & Fruiting', labelKey: 'myCrops.form.stage.options.floweringandfruiting' },
      { value: 'Harvesting', labelKey: 'myCrops.form.stage.options.harvesting' },
      { value: 'Post-Harvest', labelKey: 'myCrops.form.stage.options.postharvest' },
  ] as const;


  return (
    <SidebarInset>
      <AppHeader titleKey="sidebar.nav.myCrops" />
      <main className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline">{t('myCrops.list.title')}</CardTitle>
              <CardDescription>{t('myCrops.list.description')}</CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2"/>{t('myCrops.list.addButton')}</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('myCrops.addDialog.title')}</DialogTitle>
                        <DialogDescription>{t('myCrops.addDialog.description')}</DialogDescription>
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
                                <Button type="button" variant="secondary">{t('myCrops.addDialog.cancelButton')}</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {t('myCrops.addDialog.submitButton')}
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
                        <Link href={`/my-crops/${crop.id}`} key={crop.id}>
                            <Card className="hover:bg-accent/50 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-headline font-semibold">{t(`myCrops.form.cropName.options.${crop.cropName.toLowerCase()}` as any)}</h3>
                                        <p className="text-sm text-muted-foreground">{t(`myCrops.form.region.options.${crop.region.toLowerCase()}` as any)} - {t(`myCrops.form.stage.options.${crop.status.toLowerCase().replace(/ & /g, 'and').replace(/ /g, '')}` as any)}</p>
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
                    <p className="text-muted-foreground">{t('myCrops.list.empty')}</p>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  );
}
