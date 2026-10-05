'use client';

import {
  Flag,
  Heart,
  LayoutDashboard,
  LogOutIcon,
  ShoppingBag,
  User,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useLogout } from '@/services/features/auth/hooks';

const menuItems = [
  { icon: LayoutDashboard, label: 'داشبورد', href: '/dashboard' },
  { icon: ShoppingBag, label: 'سفارشات', href: '/dashboard/orders' },
  { icon: Wallet, label: 'کیف پول', href: '/dashboard/wallet' },
  { icon: User, label: 'پروفایل', href: '/dashboard/profile' },
  { icon: Heart, label: 'علاقه‌مندی‌ها', href: '/dashboard/wishlist' },
  { icon: Flag, label: 'آدرس ها', href: '/dashboard/addresses' },
];

interface SidebarContentProps {
  onItemClick?: () => void;
}

export default function SidebarContent({ onItemClick }: SidebarContentProps) {
  const pathname = usePathname();
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.refresh();
  };

  return (
    <nav className="flex flex-col flex-1 justify-between space-y-1">
      <div className="space-y-1">
        {menuItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 px-4 py-3 border border-transparent text-sm transition-all duration-200',
                'hover:border-primary!',
                isActive
                  ? 'bg-primary text-background font-medium'
                  : 'text-black',
              )}
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div
        onClick={handleLogout}
        className={cn(
          'flex items-center gap-3 px-4 py-3 border border-destructive bg-destructive/10 text-destructive text-sm cursor-pointer transition-all duration-200',
        )}
      >
        <LogOutIcon className="w-5 h-5" strokeWidth={1.5} />
        خروج
      </div>
    </nav>
  );
}
