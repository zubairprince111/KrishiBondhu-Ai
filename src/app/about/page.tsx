import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { Sprout } from 'lucide-react';

export default function AboutPage() {
  return (
    <SidebarInset>
      <AppHeader title="About KrishiBondhu" />
      <main className="flex-1 p-4 md:p-6">
        <Card className="mx-auto max-w-3xl">
            <CardHeader className="items-center text-center">
                <Sprout className="size-16 text-primary" />
                <CardTitle className="font-headline text-3xl">KrishiBondhu AI</CardTitle>
                <CardDescription>Your AI-Powered Farming Assistant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center text-muted-foreground">
                <p>
                    KrishiBondhu is a revolutionary application designed to empower farmers in Bangladesh with the latest AI technology. Our mission is to provide accessible, intelligent tools that help improve crop yield, manage resources effectively, and connect farmers to a supportive community.
                </p>
                <p>
                    From diagnosing crop diseases with a single photo to providing real-time market prices and personalized advice, KrishiBondhu is here to be your trusted friend in the field.
                </p>
            </CardContent>
        </Card>
      </main>
    </SidebarInset>
  );
}
