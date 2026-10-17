'use client';

import { Scale } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { MAX_COMPARE, useCompareStore } from '@/store/compare.store';

/** استایل مشترک دکمه‌های کوچک آیکن‌دار روی کارت محصول */
export const cardActionButtonClass =
  'flex size-9 items-center justify-center rounded-none border bg-white/90 text-gray-700 shadow-md backdrop-blur transition-colors hover:bg-gray-200';

interface CompareToggleProps {
  product: {
    id: number;
    title: string;
    slug: string;
    image: string;
    price: number;
  };
  className?: string;
}

/**
 * دکمه افزودن/حذف محصول از لیست مقایسه (روی کارت‌های محصول).
 * state از استور persist شده (localStorage) خوانده می‌شود.
 */
export default function CompareToggle({
  product,
  className,
}: CompareToggleProps) {
  const hydrated = useCompareStore(state => state.hydrated);
  const setHydrated = useCompareStore(state => state.setHydrated);
  const toggle = useCompareStore(state => state.toggle);
  const inCompare = useCompareStore(state =>
    state.items.some(item => item.id === product.id),
  );

  // تا رسیدن به کلاینت، state سمت سرور (خالی) نمایش داده می‌شود
  useEffect(() => {
    setHydrated();
  }, [setHydrated]);

  const active = hydrated && inCompare;

  const handleClick = () => {
    const result = toggle(product);

    if (result === 'added') {
      toast.success('به لیست مقایسه اضافه شد');
    } else if (result === 'removed') {
      toast.info('از لیست مقایسه حذف شد');
    } else {
      toast.info(`حداکثر ${MAX_COMPARE} محصول قابل مقایسه است`);
    }
  };

  const label = active ? 'حذف از مقایسه' : 'افزودن به مقایسه';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        cardActionButtonClass,
        active && 'bg-primary text-background hover:bg-primary/90',
        className,
      )}
    >
      <Scale className="size-4" />
    </button>
  );
}
