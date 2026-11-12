'use client';

import Link from 'next/link';

import { useFirstPurchaseGiftConfig } from '@/services/features/first-purchase-gift/hooks';

export default function FirstPurchaseGiftAnnouncement() {
  const { data } = useFirstPurchaseGiftConfig();
  const config = data?.data;
  if (!config?.active || !config.announcementEnabled) return null;

  const announcement = (
    <span className="inline-flex items-center gap-2 px-5" dir="rtl">
      <span aria-hidden="true">✦</span>
      <span>{config.title}</span>
      <span className="font-bold">{config.discountPercent}٪ تخفیف</span>
      <span>{config.description}</span>
      <span className="underline underline-offset-4">مشاهده جزئیات</span>
    </span>
  );

  return (
    <div
      className="relative overflow-hidden bg-gradient-to-l from-rose-950 via-rose-900 to-amber-900 text-amber-50"
      role="region"
      aria-label="هدیهٔ اولین خرید آنلاین"
    >
      <Link
        href="/products"
        className="block py-2.5 text-center text-xs font-medium sm:text-sm"
        aria-label={`${config.title}: ${config.discountPercent} درصد تخفیف`}
      >
        <span className="gift-marquee-track mx-auto flex w-max items-center">
          {announcement}
          <span aria-hidden="true">{announcement}</span>
        </span>
      </Link>
      <style jsx>{`
        .gift-marquee-track {
          animation: gift-marquee 26s linear infinite;
        }
        @keyframes gift-marquee {
          from { transform: translateX(50%); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .gift-marquee-track { animation: none; width: 100%; justify-content: center; }
          .gift-marquee-track > span[aria-hidden='true'] { display: none; }
        }
      `}</style>
    </div>
  );
}
