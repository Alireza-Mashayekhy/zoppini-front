import { Metadata } from 'next';
import { ReactNode } from 'react';

import Sidebar from '@/components/layout/dashboard/sidebar';
import SidebarContent from '@/components/layout/dashboard/sidebar-content';
import Header from '@/components/layout/public/header';
import CompareBar from '@/components/shared/compare-bar';

export const metadata: Metadata = {
  robots: {
    index: false,
  },
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />

      <div className="flex h-[calc(100vh-52px)] mt-[52px] border-t border-border overflow-hidden bg-background">
        {/* سایدبار دسکتاپ (همیشه نمایش داده می‌شود) */}
        <aside className="hidden md:flex w-64 min-h-full border-l border-border p-6 flex-col shrink-0">
          <SidebarContent />
        </aside>

        <Sidebar />

        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-24 lg:pb-6">
            {children}
          </main>
        </div>

        {/* نوار شناور لیست مقایسه */}
        <CompareBar />
      </div>
    </>
  );
}
