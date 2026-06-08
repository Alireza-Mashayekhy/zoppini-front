import { Menu, ShoppingBasket, User } from 'lucide-react';

import Logo from '@/components/shared/logo';
import { Button } from '@/components/ui/button';

import Search from './search';

export default function Header() {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-20 bg-white/20 backdrop-blur-2xl">
        <div className="grid grid-cols-3 custom-container py-1">
          <div className="flex">
            <Button variant="ghost" size="icon">
              <Menu />
            </Button>
          </div>
          <div className="flex justify-center items-center">
            <Logo />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Search />
            <Button variant="ghost" size="icon">
              <ShoppingBasket />
            </Button>
            <Button variant="ghost" size="icon">
              <User />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
