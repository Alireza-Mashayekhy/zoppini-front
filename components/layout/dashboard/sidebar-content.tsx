'use client';

import {
  Award,
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
  { icon: Award, label: 'باشگاه مشتریان', href: '/dashboard/club' },
  { icon: User, label: 'پروفایل', href: '/dashboard/profile' },
  { icon: Heart, label: 'علاقه‌مندی‌ها', href: '/dashboard/wishlist' },
  { icon: Flag, label: 'آدرس‌ها', href: '/dashboard/addresses' },
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
    <nav
      aria-label="منوی حساب کاربری"
      className="flex flex-1 flex-col justify-between gap-6"
    >
      <ul className="space-y-1">
        {menuItems.map(item => {
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onItemClick}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-200',
                  'focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none',
                  isActive
                    ? 'bg-neutral-900 font-medium text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900',
                )}
              >
                {/* نشانگرِ انتخاب‌شده در سمتِ شروعِ متن (راست در RTL) */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-y-0 start-0 w-0.5 transition-colors',
                    isActive ? 'bg-neutral-900' : 'bg-transparent',
                  )}
                />
                <item.icon
                  className="h-[18px] w-[18px] shrink-0"
                  strokeWidth={isActive ? 1.75 : 1.5}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={handleLogout}
        disabled={logout.isPending}
        className="flex w-full items-center gap-3 border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none disabled:opacity-60"
      >
        <LogOutIcon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
        {logout.isPending ? 'در حال خروج…' : 'خروج از حساب'}
      </button>
    </nav>
  );
}
