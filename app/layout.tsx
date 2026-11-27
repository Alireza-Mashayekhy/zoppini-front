import './globals.css';

import type { Metadata, Viewport } from 'next';

import GoogleAnalytics from '@/components/analytics/google-analytics';
import YektanetAnalytics from '@/components/analytics/yektanet';
import ConsentManager from '@/components/consent/manager';
import { iranSans } from '@/components/font';
import NavigationScrollManager from '@/components/navigation/navigation-scroll-manager';
import { SITE_DEFAULT_DESCRIPTION, SITE_DEFAULT_TITLE } from '@/lib/seo';
import { cn } from '@/lib/utils';
import AuthProvider from '@/providers/auth.provider';

import Providers from './providers';

export const viewport: Viewport = {
  themeColor: '#f9f9f9',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  /**
   * مبنای canonical سایت (باید **ویژگیِ شیءِ metadata** باشد؛ export جداگانه
   * نادیده گرفته می‌شود و نکست همچنان از `http://localhost:3000` استفاده
   * می‌کند).
   *
   * با تنظیم این مقدار، هر آدرس نسبی‌ای که در متادیتا استفاده شود (canonical،
   * تصویر OG، آیکون‌ها و …) به این origin و نه به هاستِ درخواست (که می‌تواند
   * `www` یا هر میزبان دیگری باشد) حل می‌شود. مقدار عمداً ثابت است: non-www و
   * https.
   */
  metadataBase: new URL('https://zoppinico.com'),
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Zoppini' },
  icons: { icon: '/favicon.ico', apple: '/pwa/apple-touch-icon.png' },
  /** منبعِ حقیقتِ این دو مقدار `lib/seo.ts` است (هم آن‌ها را برای لِی‌اوت
   * می‌سازد و هم برای تشخیصِ «مقدارِ خالیِ پنل سئو» استفاده می‌کند). */
  title: SITE_DEFAULT_TITLE,
  description: SITE_DEFAULT_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={cn('h-full', 'antialiased', 'font-sans', iranSans.variable)}
    >
      <head>
        {/* Yektanet — must stay the first script of <head> and must not be deferred. */}
        <YektanetAnalytics />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col">
        <NavigationScrollManager />
        <Providers>
          <AuthProvider initialUser={null}>{children}</AuthProvider>
        </Providers>

        <GoogleAnalytics />
        <ConsentManager />
      </body>
    </html>
  );
}
