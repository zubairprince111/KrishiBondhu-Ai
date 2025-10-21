'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import {
  ClipboardList,
  CloudSun,
  Info,
  Landmark,
  LayoutGrid,
  Leaf,
  MessageSquare,
  Mic,
  Shield,
  Sprout,
  LogIn,
  LogOut,
  User,
  Tractor,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { TranslationKey } from '@/lib/i18n';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

type NavItem = {
    href: string;
    labelKey: TranslationKey;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/', labelKey: 'sidebar.nav.dashboard', icon: LayoutGrid },
  { href: '/crop-doctor', labelKey: 'sidebar.nav.cropDoctor', icon: Leaf },
  { href: '/voice-assistant', labelKey: 'sidebar.nav.matiAI', icon: Mic },
  { href: '/weather', labelKey: 'sidebar.nav.weather', icon: CloudSun },
  { href: '/my-crops', labelKey: 'sidebar.nav.myCrops', icon: Tractor },
  { href: '/community', labelKey: 'sidebar.nav.community', icon: MessageSquare },
  { href: '/market-info', labelKey: 'sidebar.nav.marketInfo', icon: Landmark },
];

const secondaryNavItems: NavItem[] = [
    { href: '/about', labelKey: 'sidebar.nav.about', icon: Info },
    { href: '/admin', labelKey: 'sidebar.nav.admin', icon: Shield },
]

export function AppSidebar() {
    const pathname = usePathname();
    const { t, language, setLanguage } = useLanguage();
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const { setOpen } = useSidebar();

    const handleLogout = async () => {
        await signOut(auth);
    };
    
    const handleLinkClick = () => {
        setOpen(false);
    };

    const handleLanguageChange = (checked: boolean) => {
      setLanguage(checked ? 'bn' : 'en');
    };

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
          <Sprout className="size-8 text-primary" />
          <h2 className="font-headline text-2xl font-semibold text-primary">
            {t('sidebar.title')}
          </h2>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-between">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={t(item.labelKey)}
                onClick={handleLinkClick}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{t(item.labelKey)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <SidebarMenu>
            <SidebarSeparator />
             {secondaryNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={t(item.labelKey)}
                onClick={handleLinkClick}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{t(item.labelKey)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
        <SidebarFooter>
         <div className="flex items-center justify-center gap-2 border-t p-4">
            <Label htmlFor="language-switch-sidebar" className="text-sm font-medium">
              {t('app.header.lang.en')}
            </Label>
            <Switch
              id="language-switch-sidebar"
              checked={language === 'bn'}
              onCheckedChange={handleLanguageChange}
              aria-label="Language switch"
            />
            <Label htmlFor="language-switch-sidebar" className="text-sm font-medium">
              {t('app.header.lang.bn')}
            </Label>
          </div>
          <SidebarSeparator />
        {isUserLoading ? (
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        ) : user ? (
          <div className="p-2">
            <Link href="/profile" onClick={handleLinkClick}>
                <Button variant="ghost" className="flex w-full items-center justify-start gap-2 p-2">
                    <Avatar className="size-8">
                    <AvatarFallback>{user.isAnonymous ? 'G' : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                        <span className="truncate text-sm font-medium">
                        {user.isAnonymous ? 'Guest User' : 'My Account'}
                        </span>
                         {!user.isAnonymous && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
                    </div>
                </Button>
            </Link>
          </div>
        ) : (
          <SidebarMenuButton asChild tooltip="Login" onClick={handleLinkClick}>
            <Link href="/login">
              <LogIn />
              <span>Login</span>
            </Link>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </>
  );
}
