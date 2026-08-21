import Link from 'next/link';

import Logo from '@/components/shared/logo';
import { getAllCategories } from '@/services/features/categories/server.api';

import AuthButton from './auth-button';
import Cart from './cart';
import HeaderScroll from './header-scroll';
import Menu from './menu';
import Search from './search';

export default async function Header() {
  const categories = await getAllCategories();

  return (
    <HeaderScroll>
      <header className="w-full bg-background backdrop-blur-2xl">
        <div className="custom-container grid h-13 grid-cols-3 items-center lg:flex lg:justify-between">
          {/* RIGHT */}
          <div className="flex items-center">
            <Logo className="ml-5 hidden h-6.5 w-30 md:h-8.25 md:w-35 lg:block" />

            <Menu categories={categories?.data ?? []} />

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
            </nav>
          </div>

          {/* MOBILE LOGO */}
          <div className="flex justify-center lg:hidden">
            <Logo className="h-6.5 w-30 md:h-8.25 md:w-35" />
          </div>

          {/* LEFT */}
          <div className="flex items-center justify-end gap-1 md:gap-2">
            <Search />
            <Cart />
            <AuthButton />
          </div>
        </div>
      </header>
    </HeaderScroll>
  );
}
