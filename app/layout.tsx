import './globals.css';

import type { Metadata, Viewport } from 'next';

import GoogleAnalytics from '@/components/analytics/google-analytics';
import YektanetAnalytics from '@/components/analytics/yektanet';
import ConsentManager from '@/components/consent/manager';
import { iranSans } from '@/components/font';
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
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Zoppini' },
  icons: { icon: '/favicon.ico', apple: '/pwa/apple-touch-icon.png' },
  title: 'فروشگاه پوشاک مردانه - زوپینی',
  description:
    'فروشگاه آنلاین پوشاک مردانه زوپینی | خرید انواع کت شلوار مردانه، کت تک، پالتو، پیراهن و شلوار- خرید حضوری و اینترنتی | پرداخت در محل✓ امکان بازگشت کالا✓',
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
        <Providers>
          <AuthProvider initialUser={null}>{children}</AuthProvider>
        </Providers>

        <GoogleAnalytics />
        <ConsentManager />
      </body>
    </html>
  );
}
