import './globals.css';

import type { Metadata } from 'next';

import { iranSans } from '@/components/font';
import { cn } from '@/lib/utils';
import AuthProvider from '@/providers/auth.provider';
import { getMe } from '@/services/features/auth/server.api';

import Providers from './providers';

export const metadata: Metadata = {
  title: 'فروشگاه پوشاک مردانه - زوپینی',
  description:
    'فروشگاه آنلاین پوشاک مردانه زوپینی | خرید انواع کت شلوار مردانه، کت تک، پالتو، پیراهن و شلوار- خرید حضوری و اینترنتی | پرداخت در محل✓ امکان بازگشت کالا✓',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;

  try {
    const response = await getMe();

    user = response.data;
  } catch {}

  return (
    <html
      lang="fa"
      dir="rtl"
      className={cn('h-full', 'antialiased', 'font-sans', iranSans.className)}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <AuthProvider initialUser={user}>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
