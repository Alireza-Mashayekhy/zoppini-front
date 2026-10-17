'use client';

import { Scale, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { MAX_COMPARE, useCompareStore } from '@/store/compare.store';

/**
 * نوار شناور لیست مقایسه:
 * وقتی محصولی انتخاب شده باشد پایین صفحه نمایش داده می‌شود و
 * دسترسی به صفحه مقایسه، حذف تکی و پاک کردن کل لیست را می‌دهد.
 */
export default function CompareBar() {
  const pathname = usePathname();
  const hydrated = useCompareStore(state => state.hydrated);
  const setHydrated = useCompareStore(state => state.setHydrated);
  const items = useCompareStore(state => state.items);
  const remove = useCompareStore(state => state.remove);
  const clear = useCompareStore(state => state.clear);

  useEffect(() => {
    setHydrated();
  }, [setHydrated]);

  // روی خود صفحه مقایسه نوار تکراری نباشد
  if (!hydrated || items.length === 0 || pathname === '/compare') {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3">
      <div className="pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-xl border bg-white/95 p-2 shadow-lg backdrop-blur">
        {/* تصاویر محصولات انتخابی */}
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto overflow-y-visible p-2">
          {items.map(item => (
            <div key={item.id} className="relative shrink-0">
              <Link href={`/product/${item.slug}`} title={item.title}>
                <Image
                  src={item.image}
                  alt={item.title}
                  width={40}
                  height={40}
                  className="size-10 rounded-lg border object-cover"
                />
              </Link>

              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`حذف ${item.title} از مقایسه`}
                title="حذف از مقایسه"
                className="absolute -left-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-gray-800 text-white shadow transition-colors hover:bg-red-600"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>

        <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
          {items.length} از {MAX_COMPARE}
        </span>

        <div className="ms-auto flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-muted-foreground"
          >
            پاک کردن
          </Button>

          <Link href="/compare">
            <Button size="sm" className="gap-1.5">
              <Scale className="size-4" />
              مقایسه ({items.length})
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
