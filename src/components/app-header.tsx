'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/language-context';
import type { TranslationKey } from '@/lib/i18n';
import { PanelLeft, Sprout } from 'lucide-react';
import { useSidebar } from './ui/sidebar';
import { Sheet, SheetContent, SheetTitle } from './ui/sheet';
import { AppSidebar } from '@/components/app-sidebar';

type AppHeaderProps = {
  titleKey?: TranslationKey;
};

export function AppHeader({ titleKey }: AppHeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { open, setOpen, toggleSidebar } = useSidebar();
  
  const handleLanguageChange = (checked: boolean) => {
    setLanguage(checked ? 'bn' : 'en');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-primary/20 bg-primary px-4 text-primary-foreground md:px-6">
       <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[var(--sidebar-width-mobile)] p-0">
            <SheetTitle className="sr-only">Main Navigation Menu</SheetTitle>
            <AppSidebar />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
         <Button size="icon" variant="ghost" onClick={toggleSidebar} className="hover:bg-primary/50">
            <PanelLeft className="size-5" />
            <span className="sr-only">Toggle Menu</span>
        </Button>
        {titleKey ? (
           <h1 className="font-headline text-xl md:text-2xl font-semibold">
            {t(titleKey)}
          </h1>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <Sprout className="size-8 text-white" />
            <h1 className="font-headline text-xl sm:text-2xl font-semibold hidden sm:block">
              {t('app.header.title.welcome')}
            </h1>
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="language-switch" className="text-sm font-medium hidden sm:block">
          {t('app.header.lang.en')}
        </Label>
        <Switch
          id="language-switch"
          checked={language === 'bn'}
          onCheckedChange={handleLanguageChange}
          aria-label="Language switch"
        />
        <Label htmlFor="language-switch" className="text-sm font-medium hidden sm:block">
          {t('app.header.lang.bn')}
        </Label>
      </div>
    </header>
  );
}
