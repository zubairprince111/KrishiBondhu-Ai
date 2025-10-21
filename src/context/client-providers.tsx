
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { SlideshowProvider } from '@/context/slideshow-context';
import { LanguageProvider } from '@/context/language-context';

export function ClientProviders({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent rendering on the server and during the initial client render
  // to avoid hydration mismatch.
  if (!isMounted) {
    return null;
  }

  return (
    <LanguageProvider>
      <SlideshowProvider>
        <SidebarProvider>
          {children}
          <Toaster />
        </SidebarProvider>
      </SlideshowProvider>
    </LanguageProvider>
  );
}
