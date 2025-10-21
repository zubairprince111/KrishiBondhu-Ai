'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="font-headline text-2xl font-semibold text-primary">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="language-switch" className="text-sm font-medium">
          EN
        </Label>
        <Switch id="language-switch" />
        <Label htmlFor="language-switch" className="text-sm font-medium">
          BN
        </Label>
      </div>
    </header>
  );
}
