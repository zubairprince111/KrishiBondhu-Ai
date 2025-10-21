import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CheckCircle, Linkedin, Facebook } from 'lucide-react';

export default function AboutPage() {
  const aboutImage = PlaceHolderImages.find(p => p.id === 'community-post-1');

  return (
    <SidebarInset>
      <AppHeader title="About KrishiBondhu" />
      <main className="flex-1 p-4 md:p-6">
        <Card className="mx-auto max-w-4xl">
            <CardHeader className="items-center text-center">
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
                    <CardTitle className="font-headline text-3xl">About KrishiBondhu AI</CardTitle>
                    <CardDescription>Your AI-Powered Farming Assistant</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground text-center">
                <p className="text-base">
                    KrishiBondhu AI is more than an app — it is a friend of every Bangladeshi farmer, standing beside you in your fields, guiding your hands, and listening to your worries. We understand that farming is more than work — it’s a way of life, a connection to the soil, and the heartbeat of our villages.
                </p>

                <div className="text-left space-y-4 rounded-lg border bg-background p-6">
                    <h3 className="font-headline text-xl font-semibold text-center text-foreground">With KrishiBondhu AI, you are never alone in your fields:</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 shrink-0 text-primary mt-1" />
                            <span><span className="font-semibold text-foreground">Instantly diagnose crop diseases:</span> Take a photo of your crops, and instantly know what’s harming them and how to heal them.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 shrink-0 text-primary mt-1" />
                           <span><span className="font-semibold text-foreground">Speak in Bangla:</span> Speak naturally in Bangla to get advice — our AI listens and talks like a trusted companion.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 shrink-0 text-primary mt-1" />
                            <span><span className="font-semibold text-foreground">Get personalized guidance:</span> Receive guidance on weather, soil, planting, and harvesting — tailored just for your land.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 shrink-0 text-primary mt-1" />
                            <span><span className="font-semibold text-foreground">Learn best practices:</span> Learn simple techniques and best practices to grow healthy, thriving crops.</span>
                        </li>
                         <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 shrink-0 text-primary mt-1" />
                            <span><span className="font-semibold text-foreground">Stay informed:</span> Stay informed about market prices, government schemes, and local support — so your hard work is rewarded.</span>
                        </li>
                    </ul>
                </div>
                
                <p className="text-base">
                    We built KrishiBondhu AI because we believe in the power of the farmer’s hands. Every seed you plant, every field you nurture, is a story of hope, struggle, and resilience. Our AI is here to honor that story — to protect your crops, guide your decisions, and help your harvest shine.
                </p>
                 <p className="font-semibold text-foreground text-lg">
                    KrishiBondhu AI is your companion, your guide, your friend.
                </p>
                <p className="text-base italic">
                    We dream of a Bangladesh where every farmer feels supported, confident, and proud of the fruits of their labor — and we are here to make that dream real.
                </p>
            </CardContent>
             <CardFooter className="flex-col gap-2 justify-center text-center text-sm text-muted-foreground">
                <p>Made by Abdullah Al Jubair prince</p>
                <div className="flex items-center gap-4">
                  <a href="#" aria-label="LinkedIn" className="text-muted-foreground transition-colors hover:text-primary">
                    <Linkedin className="size-5" />
                  </a>
                  <a href="#" aria-label="Facebook" className="text-muted-foreground transition-colors hover:text-primary">
                    <Facebook className="size-5" />
                  </a>
                </div>
            </CardFooter>
        </Card>
      </main>
    </SidebarInset>
  );
}
