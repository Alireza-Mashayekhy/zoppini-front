import Link from 'next/link';

import Logo from '@/components/shared/logo';
import { getAllCategories } from '@/services/features/categories/server.api';

import AuthButton from './auth-button';
import Cart from './cart';
import HeaderScroll from './header-scroll';
import Menu from './menu';
import MobileBottomNavigation from './mobile-bottom-navigation';
import Search from './search';

export default async function Header() {
  const categories = await getAllCategories();
  const categoryList = categories?.data ?? [];

  return (
    <>
      <HeaderScroll>
        <header className="w-full bg-background backdrop-blur-2xl">
          {/* Desktop header intentionally retains its existing layout. */}
          <div className="hidden h-13 items-center justify-between px-6 lg:flex">
            <div className="flex items-center">
              <Logo className="ml-5 hidden h-6.5 w-30 md:h-8.25 md:w-35 lg:block" />
              <Menu categories={categoryList} />

              <nav className="hidden items-center gap-5 lg:flex">
                <Link
                  href="/blog"
                  className="text-sm transition-colors hover:text-black/50"
                >
                  مقالات
                </Link>
                <Link
                  href="/about-us"
                  className="text-sm transition-colors hover:text-black/50"
                >
                  درباره‌ما
                </Link>
                <Link
                  href="/contact"
                  className="text-sm transition-colors hover:text-black/50"
                >
                  تماس‌با‌ما
                </Link>
                <Link
                  href="/b2bsale"
                  className="text-sm transition-colors hover:text-black/50"
                >
                  فروش سازمانی
                </Link>
                <Link
                  href="https://zoppinico.com/dashboard/club"
                  className="text-sm transition-colors hover:text-black/50"
                >
                  باشگاه مشتریان
                </Link>
              </nav>
            </div>

            <div className="flex items-center justify-end gap-1 md:gap-2">
              <Search variant="desktop" />
              <Cart />
              <AuthButton />
            </div>
          </div>

          {/* Keep the mobile header compact; search opens from its icon. */}
          <div className="flex h-13 items-center justify-between px-3 lg:hidden">
            <Logo className="h-[27px] w-[112px] shrink-0" />
            <Search variant="mobile" />
          </div>
        </header>
      </HeaderScroll>

      <MobileBottomNavigation categories={categoryList} />
    </>
  );
}
