// components/layout/public/header.tsx
import Logo from '@/components/shared/logo';
import { getMe } from '@/services/features/auth/server.api';
import { getAllCategories } from '@/services/features/categories/server.api';

import AuthButton from './auth-button';
import Cart from './cart';
import Menu from './menu';
import Search from './search';

export default async function Header() {
  const categories = await getAllCategories();

  let user = null;
  try {
    const response = await getMe();
    user = response?.data || null;
  } catch {
    user = null;
  }

  return (
    <>
      <div className="fixed top-0 left-0 w-screen z-20 bg-background backdrop-blur-2xl">
        <div className="grid grid-cols-3 custom-container py-1 h-[52px] items-center">
          <div className="flex">
            <Menu categories={categories?.data} />
          </div>
          <div className="flex justify-center items-center">
            <Logo />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Search />
            <Cart />
            <AuthButton user={user} />
          </div>
        </div>
      </div>
    </>
  );
}
