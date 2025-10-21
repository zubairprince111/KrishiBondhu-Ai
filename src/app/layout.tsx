import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { SlideshowProvider } from '@/context/slideshow-context';
import { LanguageProvider } from '@/context/language-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'KrishiBondhu AI',
  description: 'AI-powered assistant for farmers in Bangladesh',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <LanguageProvider>
            <SlideshowProvider>
              <SidebarProvider>
                <AppSidebar />
                <main className="min-h-svh w-full bg-background">
                  {children}
                </main>
              </SidebarProvider>
            </SlideshowProvider>
          </LanguageProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
