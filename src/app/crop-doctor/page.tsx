'use client';
import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { Upload, Wand2, Loader2, AlertTriangle } from 'lucide-react'; // Import AlertTriangle
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/context/language-context';
import { useState, useTransition, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analyzeCropImage } from '@/lib/actions';
import type { AiCropDoctorOutput } from '@/ai/schemas';

// Define the size limit (1MB in bytes)
const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1 MB

export default function CropDoctorPage() {
  const defaultImage = PlaceHolderImages.find(p => p.id === 'crop-disease');
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const [imagePreview, setImagePreview] = useState<string | null>(defaultImage?.imageUrl || null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [result, setResult] = useState<AiCropDoctorOutput | null>(null);
  const [fileSizeError, setFileSizeError] = useState(false); // State to manage the visual warning

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileSizeError(false); // Reset error on new file selection

    if (file) {
      // Add file size validation
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          variant: 'destructive',
          title: t('cropDoctor.toast.fileSize.title'), 
          description: t('cropDoctor.toast.fileSize.description'), 
        });
        setFileSizeError(true); // Set error state to true for the visual warning

        // Clear the file input so the user can try again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setImagePreview(null); // Clear preview for large file
        setImageData(null); // Clear data for large file
        return; 
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        setImageData(dataUri);
        setResult(null); // Clear previous results
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    if (!imageData) {
      toast({
        variant: 'destructive',
        title: t('cropDoctor.toast.noImage.title'),
        description: t('cropDoctor.toast.noImage.description'),
      });
      return;
    }
    
    startTransition(async () => {
      const { data, error } = await analyzeCropImage({ photoDataUri: imageData });
      if (error) {
        toast({
          variant: 'destructive',
          title: t('cropDoctor.toast.error.title'),
          description: error,
        });
      } else {
        setResult(data);
      }
    });
  };

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
                {imagePreview && (
                  <div className="relative h-48 w-full max-w-sm">
                    <Image
                      src={imagePreview}
                      alt="Crop to be analyzed"
                      fill
                      className="rounded-md object-cover"
                    />
                  </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2" />
                  {t('cropDoctor.upload.button')}
                </Button>
                
                {/* New: Red Warning Below Image/Button 
                */}
                <div className={`mt-4 flex items-center justify-center gap-2 p-2 rounded-md ${fileSizeError ? 'text-destructive font-semibold bg-destructive/10 border border-destructive/50' : 'text-amber-600 dark:text-amber-400 font-medium'}`}>
                    <AlertTriangle className="size-5 shrink-0" />
                    <span className="text-sm">
                        {t('Upload picture under 1MB')}
                    </span>
                </div>
                {/* End New Warning */}
              </div>
            </CardContent>
          </Card>

          {/* ... Analysis Card remains unchanged ... */}
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
              <Button onClick={handleAnalyze} disabled={isPending || !imageData} className="w-full">
                {isPending ? (
                  <><Loader2 className="mr-2 animate-spin"/> {t('cropDoctor.analysis.button.loading')}</>
                ) : (
                  <>{t('cropDoctor.analysis.button')}</>
                )}
              </Button>

              {isPending && (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-primary">
                    <Loader2 className="size-10 animate-spin"/>
                    <p className="mt-4">{t('cropDoctor.analysis.loading')}</p>
                </div>
              )}

              {result ? (
                <>
                  <div className="space-y-2">
                      <h3 className="font-headline text-lg font-semibold">{t('cropDoctor.analysis.diagnosisTitle')} <span className="text-destructive font-medium">{result.diagnosis}</span></h3>
                  </div>
                  <div className="space-y-2">
                      <h3 className="font-headline text-lg font-semibold">{t('cropDoctor.analysis.recommendationTitle')}</h3>
                      <ul className="list-disc space-y-2 pl-5 text-sm">
                          {result.solutions.map((solution, index) => (
                              <li key={index}>{solution}</li>
                          ))}
                      </ul>
                  </div>
                  <Button variant="secondary" className="w-full">
                      {t('cropDoctor.analysis.findProductsButton')}
                  </Button>
                </>
              ) : !isPending && (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
                    <p>{t('cropDoctor.analysis.resultsPlaceholder')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}
