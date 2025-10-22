
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
import { Loader2, PlusCircle, Tractor, ChevronRight, LandPlot } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const landFormSchema = z.object({
  name: z.string().min(1, 'Land name is required.'),
  location: z.string().optional(),
  area: z.coerce.number().optional(),
  areaUnit: z.string().optional(),
});

export default function MyCropsPage() {
  const [isPending, setIsPending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userLandsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'lands');
  }, [firestore, user]);

  const { data: lands, isLoading: areLandsLoading } = useCollection(userLandsQuery);

  const form = useForm<z.infer<typeof landFormSchema>>({
    resolver: zodResolver(landFormSchema),
    defaultValues: {
      name: '',
      location: '',
      area: undefined,
      areaUnit: 'acre',
    },
  });

  async function onSubmit(values: z.infer<typeof landFormSchema>) {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: t('myCrops.addLandDialog.toast.error.title'), description: 'User not logged in.' });
      return;
    }
    setIsPending(true);

    const landData = {
      ...values,
      userProfileId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      if (userLandsQuery) {
        addDocumentNonBlocking(userLandsQuery, landData);
        toast({
          title: t('myCrops.addLandDialog.toast.success.title'),
          description: t('myCrops.addLandDialog.toast.success.description', { landName: values.name }),
        });
        form.reset({
          name: '',
          location: '',
          area: undefined,
          areaUnit: 'acre',
        });
        setIsDialogOpen(false);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('myCrops.addLandDialog.toast.error.title'),
        description: t('myCrops.addLandDialog.toast.error.description'),
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <SidebarInset>
      <AppHeader titleKey="sidebar.nav.myCrops" />
      <main className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline">{t('myCrops.lands.title')}</CardTitle>
              <CardDescription>{t('myCrops.lands.description')}</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="size-5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('myCrops.lands.addLandButton')}</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('myCrops.addLandDialog.title')}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('myCrops.addLandDialog.nameLabel')}</FormLabel>
                        <FormControl><Input placeholder={t('myCrops.addLandDialog.namePlaceholder')} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('myCrops.addLandDialog.locationLabel')}</FormLabel>
                        <FormControl><Input placeholder={t('myCrops.addLandDialog.locationPlaceholder')} {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex gap-4">
                        <FormField control={form.control} name="area" render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>{t('myCrops.addLandDialog.areaLabel')}</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 5" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="areaUnit" render={({ field }) => (
                          <FormItem className="w-1/3">
                            <FormLabel>{t('myCrops.addLandDialog.areaUnitLabel')}</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="acre">{t('myCrops.addLandDialog.areaUnit.acre')}</SelectItem>
                                    <SelectItem value="bigha">{t('myCrops.addLandDialog.areaUnit.bigha')}</SelectItem>
                                    <SelectItem value="katha">{t('myCrops.addLandDialog.areaUnit.katha')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">{t('myCrops.addLandDialog.cancelButton')}</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('myCrops.addLandDialog.submitButton')}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isUserLoading || areLandsLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : lands && lands.length > 0 ? (
              <div className="space-y-2">
                {lands.map((land: any) => (
                  <Link href={`/my-crops/land/${land.id}`} key={land.id}>
                    <Card className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <LandPlot className="size-8 text-primary" />
                           <div>
                                <h3 className="font-headline font-semibold">{land.name}</h3>
                                <p className="text-sm text-muted-foreground">{land.location || t('myCrops.land.noLocation')}</p>
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
                <Tractor className="size-12 text-muted-foreground" />
                <p className="text-muted-foreground">{t('myCrops.lands.empty')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  );
}

    