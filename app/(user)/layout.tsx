'use client';

import { Menu } from 'lucide-react';
import { ReactNode, useState } from 'react';

import SidebarContent from '@/components/layout/dashboard/sidebar-content';
import Logo from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function PanelLayout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* سایدبار دسکتاپ (همیشه نمایش داده می‌شود) */}
      <aside className="hidden md:flex w-64 min-h-screen border-l border-border p-6 flex-col shrink-0">
        <div className="mb-5 flex justify-center">
          <Logo />
        </div>
        <SidebarContent onItemClick={() => {}} />
      </aside>

      {/* سایدبار موبایل (کشویی) */}
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

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="md:hidden flex items-center justify-end p-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
          <Logo />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
