'use client';
import { Menu } from 'lucide-react';
import { useState } from 'react';

import Logo from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import SidebarContent from './sidebar-content';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 right-4 z-50"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] p-6 pt-12">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <SidebarContent onItemClick={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
