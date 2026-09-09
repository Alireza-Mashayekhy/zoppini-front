import './globals.css';

import type { Metadata } from 'next';

import { iranSans } from '@/components/font';
import { cn } from '@/lib/utils';
import AuthProvider from '@/providers/auth.provider';

import Providers from './providers';

export const metadata: Metadata = {
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
      <body className="min-h-full flex flex-col">
        <Providers>
          <AuthProvider initialUser={null}>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
