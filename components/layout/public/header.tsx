// components/layout/public/header.tsx
import Logo from '@/components/shared/logo';
import { getAllCategories } from '@/services/features/categories/server.api';

import AuthButton from './auth-button';
import Cart from './cart';
import Menu from './menu';
import Search from './search';

export default async function Header() {
  const categories = await getAllCategories();

  return (
    <>
      <div className="fixed top-0 left-0 w-screen z-20 bg-background backdrop-blur-2xl">
        <div className="grid grid-cols-3 custom-container py-1 h-13 items-center">
          <div className="flex relative z-10">
            <Menu categories={categories?.data} />
          </div>
          <div className="flex justify-center items-center">
            <Logo className="w-30 h-6.5 md:w-35 md:h-8.25" />
          </div>
          <div className="flex items-center justify-end md:gap-2">
            <Search />
            <Cart />
            <AuthButton />
          </div>
        </div>
      </div>
    </>
  );
}
