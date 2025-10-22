
'use client';
import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { CheckCircle, Linkedin, Facebook } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function AboutPage() {
  const aboutImage = {
      imageUrl: 'https://drive.google.com/uc?export=preview&id=1GqdKjAhHUx4ZVV-jYEs5DF32cQWMnUYg',
      description: 'Farmers working in a field',
      imageHint: 'farmers field'
  };
  const { t } = useLanguage();

  return (
    <SidebarInset>
      <AppHeader titleKey="app.header.title.about" />
      <main className="flex-1 p-4 md:p-6">
        <Card className="mx-auto max-w-4xl">
            <CardHeader className="items-center text-center p-0">
                 {aboutImage && (
                    <div className="relative h-56 w-full rounded-t-lg overflow-hidden">
                        <Image
                            src={aboutImage.imageUrl}
                            alt={aboutImage.description}
                            data-ai-hint={aboutImage.imageHint}
                            fill
                            className="object-cover"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                )}
                <div className="p-6">
                    <CardTitle className="font-headline text-3xl">{t('about.title')}</CardTitle>
                    <CardDescription>{t('about.subtitle')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground text-center">
                <p className="text-base">{t('about.p1')}</p>

                <div className="text-left space-y-4 rounded-lg border bg-background p-6">
                    <h3 className="font-headline text-xl font-semibold text-center text-foreground">{t('about.featureSection.title')}</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 shrink-0 text-primary mt-1" />
                            <span><span className="font-semibold text-foreground">{t('about.feature1.title')}</span> {t('about.feature1.description')}</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 shrink-0 text-primary mt-1" />
                           <span><span className="font-semibold text-foreground">{t('about.feature2.title')}</span> {t('about.feature2.description')}</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 shrink-0 text-primary mt-1" />
                            <span><span className="font-semibold text-foreground">{t('about.feature3.title')}</span> {t('about.feature3.description')}</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 shrink-0 text-primary mt-1" />
                            <span><span className="font-semibold text-foreground">{t('about.feature4.title')}</span> {t('about.feature4.description')}</span>
                        </li>
                         <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 shrink-0 text-primary mt-1" />
                            <span><span className="font-semibold text-foreground">{t('about.feature5.title')}</span> {t('about.feature5.description')}</span>
                        </li>
                    </ul>
                </div>
                
                <p className="text-base">{t('about.p2')}</p>
                 <p className="font-semibold text-foreground text-lg">{t('about.p3')}</p>
                <p className="text-base italic">{t('about.p4')}</p>
            </CardContent>
             <CardFooter className="flex-col gap-2 justify-center text-center text-sm text-muted-foreground">
                <p>{t('about.footer.author')}</p>
                <div className="flex items-center gap-4">
                  <a href="https://www.linkedin.com/in/aajubairprincee/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-muted-foreground transition-colors hover:text-primary">
                    <Linkedin className="size-5" />
                  </a>
                  <a href="https://www.facebook.com/jubair.prince009/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted-foreground transition-colors hover:text-primary">
                    <Facebook className="size-5" />
                  </a>
                </div>
            </CardFooter>
        </Card>
      </main>
    </SidebarInset>
  );
}

    