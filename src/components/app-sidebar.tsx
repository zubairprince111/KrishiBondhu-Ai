'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarFooter,
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
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { TranslationKey } from '@/lib/i18n';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';


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
  { href: '/crop-planning', labelKey: 'sidebar.nav.cropPlanning', icon: ClipboardList },
  { href: '/community', labelKey: 'sidebar.nav.community', icon: MessageSquare },
  { href: '/market-info', labelKey: 'sidebar.nav.marketInfo', icon: Landmark },
];

const secondaryNavItems: NavItem[] = [
    { href: '/about', labelKey: 'sidebar.nav.about', icon: Info },
    { href: '/admin', labelKey: 'sidebar.nav.admin', icon: Shield },
]

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };
  
  return (
    <Sidebar className="hidden border-r md:flex">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
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
                tooltip={{ children: t(item.labelKey) }}
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
                tooltip={{ children: t(item.labelKey) }}
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
        {isUserLoading ? (
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex w-full items-center justify-start gap-2 p-2">
                <Avatar className="size-8">
                  <AvatarFallback>{user.isAnonymous ? 'G' : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium">
                  {user.isAnonymous ? 'Guest User' : user.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem>
                  <User className="mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SidebarMenuButton asChild>
            <Link href="/login">
              <LogIn />
              <span>Login</span>
            </Link>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export function MobileAppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };
  
  return (
    <div className="flex h-full flex-col border-r">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
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
                tooltip={{ children: t(item.labelKey) }}
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
                tooltip={{ children: t(item.labelKey) }}
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
        {isUserLoading ? (
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex w-full items-center justify-start gap-2 p-2">
                <Avatar className="size-8">
                  <AvatarFallback>{user.isAnonymous ? 'G' : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium">
                  {user.isAnonymous ? 'Guest User' : user.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem>
                  <User className="mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SidebarMenuButton asChild>
            <Link href="/login">
              <LogIn />
              <span>Login</span>
            </Link>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </div>
  );
}