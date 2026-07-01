'use client';

import { Flag, Heart, LayoutDashboard, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'داشبورد', href: '/dashboard' },
  { icon: ShoppingBag, label: 'سفارشات', href: '/dashboard/orders' },
  { icon: User, label: 'پروفایل', href: '/dashboard/profile' },
  { icon: Heart, label: 'علاقه‌مندی‌ها', href: '/dashboard/wishlist' },
  { icon: Flag, label: 'آدرس ها', href: '/dashboard/addresses' },
];

interface SidebarContentProps {
  onItemClick?: () => void;
}

export default function SidebarContent({ onItemClick }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1">
      {menuItems.map(item => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-3 px-4 py-3 border border-transparent text-sm transition-all duration-200',
              'hover:border-gray-800!',
              isActive
                ? 'bg-gray-800 text-background font-medium'
                : 'text-black',
            )}
          >
            <item.icon className="w-5 h-5" strokeWidth={1.5} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
