
'use client';

import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SidebarInset } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { findKrishiOfficer } from '@/lib/actions';
import { Loader2, Search, User, Phone, Building } from 'lucide-react';
import { bdZilas, bdUpazilas } from '@/lib/bd-divisions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/context/language-context';

const officerFormSchema = z.object({
  zila: z.string().min(1, 'Please select a Zila.'),
  upazila: z.string().min(1, 'Please select an Upazila.'),
});

type OfficerResult = z.infer<typeof officerFormSchema> & {
    name: string;
    designation: string;
    contactNumber: string;
    officeAddress: string;
};

export default function FindOfficerPage() {
    const [isOfficerPending, startOfficerTransition] = useTransition();
    const [officerResult, setOfficerResult] = useState<OfficerResult | null>(null);
    const { toast } = useToast();
    const { t } = useLanguage();
    const [selectedZila, setSelectedZila] = useState('');

    const officerForm = useForm<z.infer<typeof officerFormSchema>>({
        resolver: zodResolver(officerFormSchema),
        defaultValues: { zila: '', upazila: '' },
    });

    function onOfficerSubmit(values: z.infer<typeof officerFormSchema>) {
        setOfficerResult(null);
        startOfficerTransition(async () => {
            const { data, error } = await findKrishiOfficer(values);
             if (error) {
                toast({ variant: 'destructive', title: 'Error', description: error });
            } else {
                setOfficerResult(data);
            }
        });
    }

  return (
    <SidebarInset>
      <AppHeader titleKey="app.header.title.findOfficer" />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl grid gap-8 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">{t('findOfficer.title')}</CardTitle>
                  <CardDescription>{t('findOfficer.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...officerForm}>
                    <form onSubmit={officerForm.handleSubmit(onOfficerSubmit)} className="space-y-6">
                      <FormField
                        control={officerForm.control}
                        name="zila"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('findOfficer.form.zila.label')}</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedZila(value);
                                officerForm.resetField('upazila');
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder={t('findOfficer.form.zila.placeholder')} /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {bdZilas.map((zila) => (
                                  <SelectItem key={zila} value={zila}>{zila}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={officerForm.control}
                        name="upazila"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('findOfficer.form.upazila.label')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!selectedZila}
                            >
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder={t('findOfficer.form.upazila.placeholder')} /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(bdUpazilas[selectedZila] || []).map((upazila) => (
                                  <SelectItem key={upazila} value={upazila}>{upazila}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isOfficerPending} className="w-full">
                        {isOfficerPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('findOfficer.form.button.loading')}</> : <><Search className="mr-2" />{t('findOfficer.form.button')}</>}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <User className="text-primary" />
                    {t('findOfficer.results.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    {isOfficerPending ? (
                        <div className="flex flex-col items-center justify-center space-y-4 text-center h-full min-h-64">
                            <Loader2 className="size-12 text-primary animate-spin" />
                            <p className="text-primary">{t('findOfficer.results.loading')}</p>
                        </div>
                    ) : officerResult ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-bold font-headline">{officerResult.name}</h3>
                                <p className="text-sm text-muted-foreground">{officerResult.designation}</p>
                            </div>
                            <div className="space-y-3 rounded-md border bg-background p-4">
                                <div className="flex items-start gap-3">
                                    <Phone className="size-5 mt-1 text-primary"/>
                                    <div>
                                        <p className="font-semibold text-sm">{t('findOfficer.results.contact')}</p>
                                        <p className="text-sm text-muted-foreground">{officerResult.contactNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Building className="size-5 mt-1 text-primary"/>
                                    <div>
                                        <p className="font-semibold text-sm">{t('findOfficer.results.address')}</p>
                                        <p className="text-sm text-muted-foreground">{officerResult.officeAddress}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-4 text-center h-full min-h-64">
                            <User className="size-12 text-muted-foreground" />
                            <p className="text-muted-foreground">{t('findOfficer.results.placeholder')}</p>
                        </div>
                    )}
                </CardContent>
              </Card>
            </div>
      </main>
    </SidebarInset>
  );
}

    