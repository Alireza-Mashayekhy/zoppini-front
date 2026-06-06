'use client';

import { User } from 'lucide-react';
import Link from 'next/link';

import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const items = [
  {
    link: '/admin/users',
    icon: User,
    name: 'کاربران',
  },
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  return (
    <Sidebar
      collapsible="icon"
      dir="rtl"
      side="right"
      bgClassName="bg-white border-l border-sidebar-border"
    >
      <SidebarHeader className="flex flex-row items-center justify-end">
        {state !== 'collapsed' && <span className="ml-auto">Zoppini</span>}
        <SidebarTrigger />
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map(item => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <Link href={item.link}>
                    <item.icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
