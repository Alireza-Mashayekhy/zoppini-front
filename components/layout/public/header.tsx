import { User } from 'lucide-react';

import Logo from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { getAllCategories } from '@/services/features/categories/server.api';

import Cart from './cart';
import Menu from './menu';
import Search from './search';

export default async function Header() {
  const categories = await getAllCategories();

  return (
    <>
      <div className="fixed top-0 left-0 w-screen z-20 bg-background backdrop-blur-2xl ">
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
            <Button variant="ghost" size="icon">
              <User className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
