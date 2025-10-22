'use client';

import { useTransition, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SidebarInset } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { findGovernmentSchemes, getMarketPrices } from '@/lib/actions';
import { Loader2, ReceiptText, Search, Tag, Wand2 } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/context/language-context';

const schemesFormSchema = z.object({
  crop: z.string().min(2, 'Crop name is required.'),
  region: z.string().min(2, 'Region is required.'),
});

const MarketPriceSchema = z.object({
  crop: z.string(),
  price: z.string(),
  location: z.string(),
});


export default function MarketInfoPage() {
    const [isSchemesPending, startSchemesTransition] = useTransition();
    const [isPricesPending, startPricesTransition] = useTransition();
    const [schemesResult, setSchemesResult] = useState<any | null>(null);
    const [marketPrices, setMarketPrices] = useState<z.infer<typeof MarketPriceSchema>[]>([]);
    const { toast } = useToast();
    const { t } = useLanguage();

    const schemesForm = useForm<z.infer<typeof schemesFormSchema>>({
        resolver: zodResolver(schemesFormSchema),
        defaultValues: { crop: '', region: '' },
    });

    useEffect(() => {
        startPricesTransition(async () => {
            const { data, error } = await getMarketPrices({ region: 'Bangladesh' });
            if (error) {
                toast({ variant: 'destructive', title: 'Error fetching prices', description: error });
            } else if (data) {
                setMarketPrices(data.prices);
            }
        });
    }, [toast]);


    function onSchemesSubmit(values: z.infer<typeof schemesFormSchema>) {
        setSchemesResult(null);
        startSchemesTransition(async () => {
            const { data, error } = await findGovernmentSchemes(values);
            if (error) {
                toast({ variant: 'destructive', title: 'Error', description: error });
            } else {
                setSchemesResult(data);
            }
        });
    }


  return (
    <SidebarInset>
      <AppHeader titleKey="app.header.title.marketInfo" />
      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="schemes">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schemes"><ReceiptText className="mr-2"/>Government Schemes</TabsTrigger>
            <TabsTrigger value="prices"><Tag className="mr-2"/>Market Prices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="schemes">
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Find Relevant Schemes</CardTitle>
                        <CardDescription>Enter your crop and region to find government subsidies and grants.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...schemesForm}>
                            <form onSubmit={schemesForm.handleSubmit(onSchemesSubmit)} className="space-y-6">
                                <FormField control={schemesForm.control} name="crop" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Crop Name (e.g., Rice, Jute)</FormLabel>
                                        <FormControl><Input placeholder="ধান" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={schemesForm.control} name="region" render={({ field }) => (
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
                                            <SelectItem value="Barisal">Barisal</SelectItem>
                                            <SelectItem value="Sylhet">Sylhet</SelectItem>
                                            <SelectItem value="Rangpur">Rangpur</SelectItem>
                                            <SelectItem value="Mymensingh">Mymensingh</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <Button type="submit" disabled={isSchemesPending} className="w-full">
                                    {isSchemesPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...</> : <><Search className="mr-2"/>Find Schemes</>}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card className="bg-primary/5">
                    <CardHeader>
                         <CardTitle className="font-headline flex items-center gap-2">
                            <Wand2 className="text-primary"/>
                            Available Programs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!schemesResult && !isSchemesPending && (
                            <div className="flex flex-col items-center justify-center space-y-4 text-center h-full min-h-64">
                                <ReceiptText className="size-12 text-muted-foreground"/>
                                <p className="text-muted-foreground">Scheme details will appear here.</p>
                            </div>
                        )}
                        {isSchemesPending && (
                            <div className="flex flex-col items-center justify-center space-y-4 text-center h-full min-h-64">
                                <Loader2 className="size-12 text-primary animate-spin"/>
                                <p className="text-primary">Searching for schemes...</p>
                            </div>
                        )}
                        {schemesResult && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-headline text-lg font-semibold">Government Schemes</h3>
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                                        {schemesResult.schemes.map((scheme: string, i: number) => <li key={i}>{scheme}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-headline text-lg font-semibold">Market Details</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">{schemesResult.marketDetails}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value="prices">
             <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="font-headline">Today's Market Prices</CardTitle>
                    <CardDescription>Daily prices from major markets across Bangladesh, updated in real-time.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isPricesPending ? (
                         <div className="flex items-center justify-center p-8">
                            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                            <span>Fetching latest prices...</span>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Crop</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Market Location</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {marketPrices.map((item) => (
                                    <TableRow key={item.crop}>
                                        <TableCell className="font-medium">{item.crop}</TableCell>
                                        <TableCell>{item.price}</TableCell>
                                        <TableCell>{item.location}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </SidebarInset>
  );
}

    