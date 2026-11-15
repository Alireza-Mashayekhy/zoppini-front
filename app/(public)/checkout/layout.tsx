import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * کلِ زیرشاخه‌ی تسویه‌حساب نباید در نتایج جستجو بیاید (محتوای وابسته به
 * کاربر، سبد خرید و نتیجه‌ی پرداخت).
 *
 * سیاست: این مسیرها در `robots.txt` مسدود **نشده‌اند** تا خزنده بتواند متای
 * `noindex` را ببیند؛ ترکیبِ Disallow با noindex باعث می‌شد آدرسِ بدون محتوا
 * در نتایج باقی بماند. متا روی لِی‌اوت گذاشته شده تا تمام زیرمسیرهای فعلی و
 * آینده‌ی `/checkout` (از جمله `payment` و `payment/result`) را پوشش دهد.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
