// components/pages/product/share-button.tsx
'use client';

import { Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { ProductsResponse } from '@/services/features/products/type';

interface ProductShareButtonProps {
  product: ProductsResponse;
  className?: string;
}

/**
 * دکمهٔ اشتراک‌گذاری محصول در صفحهٔ جزئیات:
 * - در موبایل/Web Share در دسترس: از `navigator.share` استفاده می‌کند.
 * - در دسکتاپ/در غیر این صورت: لینک canonical محصول را کپی می‌کند و تأیید نشان می‌دهد.
 */
export default function ProductShareButton({
  product,
  className,
}: ProductShareButtonProps) {
  const [pending, setPending] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return `https://zoppinico.com/product/${encodeURIComponent(product.slug)}`;
  }, [product.slug]);

  const handleShare = async () => {
    if (pending) return;
    setPending(true);

    const title = product.title;
    const url = shareUrl;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      // Fallback: کپی به کلیپ‌بورد
      await navigator.clipboard.writeText(url);
      toast.success('لینک محصول کپی شد');
    } catch {
      toast.error('امکان به اشتراک‌گذاری وجود ندارد');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={pending}
      aria-label="اشتراک‌گذاری محصول"
      title="اشتراک‌گذاری محصول"
      className={cn(
        'flex aspect-square h-[50px] items-center justify-center border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 rounded-xl disabled:opacity-50',
        className,
      )}
    >
      <Share2 className="size-5" />
    </button>
  );
}
