'use client';

import {
  Boxes,
  Briefcase,
  Grid2X2,
  Newspaper,
  Palette,
  Ruler,
  Star,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
import { cn } from '@/lib/utils';

const items = [
  {
    link: '/admin/users',
    icon: User,
    name: 'کاربران',
  },
  {
    link: '/admin/categories',
    icon: Grid2X2,
    name: 'دسته‌بندی‌‌ها',
  },
  {
    link: '/admin/products',
    icon: Boxes,
    name: 'محصولات',
  },
  {
    link: '/admin/blog',
    icon: Newspaper,
    name: 'بلاگ',
  },
  { icon: Star, name: 'محصولات ویژه', link: '/admin/featured' },
  { icon: Star, name: 'محصولات پیشنهاد استایل', link: '/admin/style' },
  { icon: Briefcase, name: 'درخواست های سازمانی', link: '/admin/b2b' },
  { name: 'رنگ‌ها', link: '/admin/colors', icon: Palette }, // اضافه شد
  { name: 'سایزها', link: '/admin/sizes', icon: Ruler }, // اضافه شد
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();

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
          <SidebarMenu className="gap-2">
            {items.map(item => {
              const isActive = pathname.startsWith(item.link);

              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.link}
                      className={cn(
                        'flex items-center gap-2 border rounded-sm px-2 py-1 transition',
                        isActive
                          ? 'bg-primary/10 border-primary text-primary hover:bg-primary/10! hover:border-primary! hover:text-primary!'
                          : 'hover:bg-muted',
                      )}
                    >
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}
