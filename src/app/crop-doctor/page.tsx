import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { Upload, Wand2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function CropDoctorPage() {
  const diseasedLeafImage = PlaceHolderImages.find(p => p.id === 'crop-disease');

  return (
    <SidebarInset>
      <AppHeader title="AI Crop Doctor" />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Upload Crop Image</CardTitle>
              <CardDescription>
                Take or upload a picture of the affected crop. Our AI will analyze it for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-muted p-8 text-center">
                {diseasedLeafImage && (
                  <div className="relative h-48 w-full max-w-sm">
                    <Image
                      src={diseasedLeafImage.imageUrl}
                      alt={diseasedLeafImage.description}
                      data-ai-hint={diseasedLeafImage.imageHint}
                      fill
                      className="rounded-md object-cover"
                    />
                  </div>
                )}
                <p className="text-muted-foreground">A preview of your uploaded image will appear here.</p>
                <Button>
                  <Upload className="mr-2" />
                  Upload Image
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Wand2 className="text-primary"/>
                AI Analysis & Solution
              </CardTitle>
              <CardDescription>
                Based on the image, here is our diagnosis and suggested actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <h3 className="font-headline text-lg font-semibold">Diagnosis: <span className="text-destructive font-medium">Leaf Blight</span></h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        The symptoms visible on the leaf, such as the brown spots with yellow halos, are characteristic of Leaf Blight, a common fungal disease.
                    </p>
                </div>
                <div className="space-y-2">
                    <h3 className="font-headline text-lg font-semibold">Recommended Actions (in Bangla):</h3>
                    <ul className="list-disc space-y-2 pl-5 text-sm">
                        <li>
                            <span className="font-semibold">সার প্রয়োগ:</span> আক্রান্ত পাতাগুলি সরিয়ে ফেলুন এবং একটি কপার-ভিত্তিক ছত্রাকনাশক প্রয়োগ করুন।
                        </li>
                        <li>
                            <span className="font-semibold">পানি ব্যবস্থাপনা:</span> সকালে গাছের গোড়ায় জল দিন এবং পাতা ভেজানো থেকে বিরত থাকুন।
                        </li>
                        <li>
                           <span className="font-semibold">প্রতিরোধ:</span> রোগ-প্রতিরোধী জাত লাগানোর কথা বিবেচনা করুন এবং ফসলের আবর্তন অনুশীলন করুন।
                        </li>
                    </ul>
                </div>
                 <Button variant="secondary" className="w-full">
                    Find Recommended Products
                </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}
