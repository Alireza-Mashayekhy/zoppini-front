// components/layout/public/auth-button.tsx
'use client';

import {
  Heart,
  LogOutIcon,
  ShoppingBasket,
  User,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/services/features/auth/hooks';
import { UserResponse } from '@/services/features/auth/types';

export default function AuthButton({ user }: { user: UserResponse | null }) {
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.refresh();
  };

  // اگر کاربر لاگین کرده باشد
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <User className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
              <UserIcon />
              پروفایل
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/orders">
              <ShoppingBasket />
              سفارشات
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/favorites">
              <Heart />
              علاقه مندی ها
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOutIcon />
            خروج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // کاربر لاگین نکرده → دکمه ورود
  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href="/login">
        <User className="size-5" />
      </Link>
    </Button>
  );
}
