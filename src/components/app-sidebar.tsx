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
} from '@/components/ui/sidebar';
import {
  BarChart,
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
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { TranslationKey } from '@/lib/i18n';

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
    </Sidebar>
  );
}
