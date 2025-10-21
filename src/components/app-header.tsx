'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/language-context';
import type { TranslationKey } from '@/lib/i18n';
import { PanelLeft } from 'lucide-react';
import { useSidebar } from './ui/sidebar';

type AppHeaderProps = {
  titleKey: TranslationKey;
};

export function AppHeader({ titleKey }: AppHeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { toggleSidebar } = useSidebar();
  
  const handleLanguageChange = (checked: boolean) => {
    setLanguage(checked ? 'bn' : 'en');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-primary/20 bg-primary px-4 text-primary-foreground md:px-6">
      <div className="flex items-center gap-2">
         <Button size="icon" variant="ghost" onClick={toggleSidebar} className="hover:bg-primary/50">
            <PanelLeft className="size-5" />
            <span className="sr-only">Toggle Menu</span>
        </Button>
        <h1 className="font-headline text-2xl font-semibold">
          {t(titleKey)}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="language-switch" className="text-sm font-medium">
          {t('app.header.lang.en')}
        </Label>
        <Switch
          id="language-switch"
          checked={language === 'bn'}
          onCheckedChange={handleLanguageChange}
        />
        <Label htmlFor="language-switch" className="text-sm font-medium">
          {t('app.header.lang.bn')}
        </Label>
      </div>
    </header>
  );
}
