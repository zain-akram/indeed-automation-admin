'use client';

import {
  BriefcaseIcon,
  CalendarPlusIcon,
  CalendarIcon,
  InboxIcon,
  LayoutDashboardIcon,
  MailIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/jobs', label: 'Jobs', icon: BriefcaseIcon },
  { href: '/contacts', label: 'Contacts', icon: UsersIcon },
  { href: '/interviews', label: 'Interviews', icon: CalendarIcon },
  { href: '/interviews/new', label: 'New Interview', icon: CalendarPlusIcon },
  { href: '/emails', label: 'Emails', icon: InboxIcon },
  { href: '/email-templates', label: 'Email Templates', icon: MailIcon },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <span className="px-2 py-1 text-sm font-semibold">Simple Automation</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<Link href={item.href} />} isActive={pathname === item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/settings" />} isActive={pathname === '/settings'}>
              <SettingsIcon />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
