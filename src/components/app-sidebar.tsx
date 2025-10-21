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

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/crop-doctor', label: 'Crop Doctor', icon: Leaf },
  { href: '/voice-assistant', label: 'Mati AI', icon: Mic },
  { href: '/weather', label: 'Weather', icon: CloudSun },
  { href: '/crop-planning', label: 'Crop Planning', icon: ClipboardList },
  { href: '/community', label: 'Community', icon: MessageSquare },
  { href: '/market-info', label: 'Market Info', icon: Landmark },
];

const secondaryNavItems = [
    { href: '/about', label: 'About', icon: Info },
    { href: '/admin', label: 'Admin', icon: Shield },
]

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r md:flex">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Sprout className="size-8 text-primary" />
          <h2 className="font-headline text-2xl font-semibold text-primary">
            KrishiBondhu
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
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
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
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
