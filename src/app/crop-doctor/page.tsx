
'use client';
import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { Upload, Wand2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/context/language-context';

export default function CropDoctorPage() {
  const diseasedLeafImage = PlaceHolderImages.find(p => p.id === 'crop-disease');
  const { t } = useLanguage();

  return (
    <SidebarInset>
      <AppHeader titleKey="app.header.title.cropDoctor" />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">{t('cropDoctor.upload.title')}</CardTitle>
              <CardDescription>
                {t('cropDoctor.upload.description')}
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
                <p className="text-muted-foreground">{t('cropDoctor.upload.preview')}</p>
                <Button>
                  <Upload className="mr-2" />
                  {t('cropDoctor.upload.button')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Wand2 className="text-primary"/>
                {t('cropDoctor.analysis.title')}
              </CardTitle>
              <CardDescription>
                {t('cropDoctor.analysis.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <h3 className="font-headline text-lg font-semibold">{t('cropDoctor.analysis.diagnosisTitle')} <span className="text-destructive font-medium">{t('cropDoctor.analysis.diagnosisResult')}</span></h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('cropDoctor.analysis.diagnosisText')}
                    </p>
                </div>
                <div className="space-y-2">
                    <h3 className="font-headline text-lg font-semibold">{t('cropDoctor.analysis.recommendationTitle')}</h3>
                    <ul className="list-disc space-y-2 pl-5 text-sm">
                        <li>
                           {t('cropDoctor.analysis.action1')}
                        </li>
                        <li>
                           {t('cropDoctor.analysis.action2')}
                        </li>
                        <li>
                           {t('cropDoctor.analysis.action3')}
                        </li>
                    </ul>
                </div>
                 <Button variant="secondary" className="w-full">
                    {t('cropDoctor.analysis.findProductsButton')}
                </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}
