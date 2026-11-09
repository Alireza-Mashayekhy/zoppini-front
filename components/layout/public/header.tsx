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
          {/*
            Mobile header: logo is dead-center regardless of the right-side
            slot's content. Three equal columns (1fr auto 1fr) inside a
            grid keep the middle column centered even when the left/right
            columns have different widths — flex justify-between would only
            center the logo when both sides are exactly the same width.
            In RTL the first column sits on the right (empty spacer, as
            requested) and the third column on the left (search icon).
          */}
          <div className="grid h-13 grid-cols-[1fr_auto_1fr] items-center px-3 lg:hidden">
            <span aria-hidden="true" />
            <Logo className="h-[27px] w-[112px]" />
            <div className="flex items-center justify-end">
              <Search variant="mobile" />
            </div>
          </div>
        </header>
      </HeaderScroll>

      <MobileBottomNavigation categories={categoryList} />
    </>
  );
}
