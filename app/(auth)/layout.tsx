import type { Metadata } from 'next';

import SidebarAuth from '@/components/layout/auth/sidebar';

/**
 * صفحات ورود/ثبت‌نام نباید در نتایج جستجو بیایند.
 *
 * سیاست: این مسیرها **در robots.txt مسدود نشده‌اند** (برخلاف /admin،
 * /dashboard و /checkout). دلیل: اگر یک صفحه هم `Disallow` شود و هم `noindex`
 * داشته باشد، خزنده صفحه را نمی‌خزد، متای noindex را نمی‌بیند و آدرسِ بدون
 * محتوا می‌تواند در نتایج بماند. چون این صفحات از هدرِ سایت لینک می‌شوند و
 * خزش‌شان ارزان است، سیاستِ درست این است: «خزش آزاد + noindex روی خود صفحه».
 *
 * `follow: false` هم گذاشته شده چون این صفحات ارزشِ انتقالِ لینک ندارند.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 h-screen w-screen overflow-hidden">
      <div className="hidden md:block md:col-span-2">
        <SidebarAuth />
      </div>
      <div className="col-span-1 md:col-span-3 flex flex-col items-center justify-center p-4 md:p-8 bg-background">
        {children}
      </div>
    </div>
  );
}
