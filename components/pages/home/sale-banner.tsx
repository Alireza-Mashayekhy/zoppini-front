'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Single-variant sale banner. Previously two `<Image priority quality={100}>`
 * (4269px desktop + 1080px mobile) were both in the DOM with CSS-only
 * `hidden` toggling — both downloaded on every device. Now exactly one
 * lazy image loads, below-fold (not LCP), quality 80.
 */
export default function SaleBanner() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSR placeholder reserves layout to avoid CLS; no image fetched on server
  // beyond what Next needs. Client mounts the correct variant only.
  if (!mounted) {
    return (
      <Link
        href="/discounted-products"
        aria-label="محصولات تخفیف‌دار زوپینی"
        className="relative block w-full aspect-[16/9] sm:aspect-[16/9] overflow-hidden bg-neutral-200"
      />
    );
  }

  if (isMobile) {
    return (
      <Link href="/discounted-products">
        <div className="relative w-full aspect-[9/16] max-h-[80vh] overflow-hidden">
          <Image
            src="/home/mobile_sale.webp"
            alt="محصولات تخفیف‌دار زوپینی"
            fill
            sizes="100vw"
            quality={80}
            loading="lazy"
            className="object-cover"
          />
        </div>
      </Link>
    );
  }

  return (
    <Link href="/discounted-products">
      <div className="relative w-full aspect-[16/9] overflow-hidden">
        <Image
          src="/home/sale.webp"
          alt="محصولات تخفیف‌دار زوپینی"
          fill
          sizes="100vw"
          quality={80}
          loading="lazy"
          className="object-cover"
        />
      </div>
    </Link>
  );
}
