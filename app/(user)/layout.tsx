import { Metadata } from 'next';
import { ReactNode } from 'react';

import Sidebar from '@/components/layout/dashboard/sidebar';
import SidebarContent from '@/components/layout/dashboard/sidebar-content';
import Logo from '@/components/shared/logo';

export const metadata: Metadata = {
  robots: {
    index: false,
  },
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* سایدبار دسکتاپ (همیشه نمایش داده می‌شود) */}
      <aside className="hidden md:flex w-64 min-h-screen border-l border-border p-6 flex-col shrink-0">
        <div className="mb-5 flex justify-center">
          <Logo />
        </div>
        <SidebarContent />
      </aside>

      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="md:hidden flex items-center justify-end p-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
          <Logo />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
