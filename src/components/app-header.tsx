'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import type { TranslationKey } from '@/lib/i18n';
import { LogIn, PanelLeft, Sprout, User, Search } from 'lucide-react';
import { useSidebar } from './ui/sidebar';
import { Sheet, SheetContent, SheetTitle } from './ui/sheet';
import { AppSidebar } from '@/components/app-sidebar';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from './ui/dropdown-menu';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { SearchDialog } from './search-dialog';
import { Input } from './ui/input';

type AppHeaderProps = {
  titleKey?: TranslationKey;
};

export function AppHeader({ titleKey }: AppHeaderProps) {
  const { t } = useLanguage();
  const { open, setOpen, toggleSidebar } = useSidebar();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        setIsSearchOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-primary/20 bg-primary px-4 text-primary-foreground md:px-6">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleSidebar}
            className="hover:bg-primary/50"
          >
            <PanelLeft className="size-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="left" className="w-[var(--sidebar-width-mobile)] p-0">
              <SheetTitle className="sr-only">Main Navigation Menu</SheetTitle>
              <AppSidebar />
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <Sprout className="size-8 text-white" />
            {titleKey ? (
              <h1 className="font-headline text-xl md:text-2xl font-semibold">
                {t(titleKey)}
              </h1>
            ) : (
              <h1 className="font-headline text-lg sm:text-xl font-semibold hidden xs:block">
                {t('app.header.title.welcome')}
              </h1>
            )}
          </Link>
        </div>

        <div className="flex-1 justify-center px-4 hidden md:flex">
            <form onSubmit={handleSearchSubmit} className="w-full max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                    <Input 
                        placeholder="Search crops, prices, suggestions..." 
                        className="bg-primary-foreground/10 text-primary-foreground placeholder:text-muted-foreground/80 pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </form>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button size="icon" variant="ghost" className="md:hidden hover:bg-primary/50" onClick={() => setIsSearchOpen(true)}>
            <Search />
          </Button>
          {isUserLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-primary/50" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full hover:bg-primary/50"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {user.isAnonymous
                        ? 'G'
                        : user.email?.charAt(0).toUpperCase()}
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
                    {!user.isAnonymous && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    )}
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
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              variant="secondary"
              className="bg-accent hover:bg-accent/80 text-accent-foreground"
            >
              <Link href="/login">
                <LogIn className="mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            </Button>
          )}
        </div>
      </header>
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} initialQuery={searchQuery} setInitialQuery={setSearchQuery}/>
    </>
  );
}
