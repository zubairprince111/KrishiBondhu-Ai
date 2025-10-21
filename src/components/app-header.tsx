'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/language-context';
import type { TranslationKey } from '@/lib/i18n';
import { LogIn, LogOut, PanelLeft, Sprout, User } from 'lucide-react';
import { useSidebar } from './ui/sidebar';
import { Sheet, SheetContent, SheetTitle } from './ui/sheet';
import { AppSidebar } from '@/components/app-sidebar';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from './ui/dropdown-menu';

type AppHeaderProps = {
  titleKey?: TranslationKey;
};

export function AppHeader({ titleKey }: AppHeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { open, setOpen, toggleSidebar } = useSidebar();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  const handleLanguageChange = (checked: boolean) => {
    setLanguage(checked ? 'bn' : 'en');
  };

  const handleLogout = async () => {
    await signOut(auth);
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
            <h1 className="font-headline text-lg sm:text-xl font-semibold hidden xs:block">
              {t('app.header.title.welcome')}
            </h1>
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <Label htmlFor="language-switch" className="text-sm font-medium">
            {t('app.header.lang.en')}
          </Label>
          <Switch
            id="language-switch"
            checked={language === 'bn'}
            onCheckedChange={handleLanguageChange}
            aria-label="Language switch"
          />
          <Label htmlFor="language-switch" className="text-sm font-medium">
            {t('app.header.lang.bn')}
          </Label>
        </div>

        {isUserLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-primary/50" />
        ) : user ? (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-primary/50">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-accent text-accent-foreground">
                                {user.isAnonymous ? 'G' : user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {user.isAnonymous ? 'Guest User' : 'My Account'}
                            </p>
                            {!user.isAnonymous && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ) : (
             <Button asChild variant="secondary" className="bg-accent hover:bg-accent/80 text-accent-foreground">
                <Link href="/login">
                  <LogIn className="mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
            </Button>
        )}
      </div>
    </header>
  );
}
