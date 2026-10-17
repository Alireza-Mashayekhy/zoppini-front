'use client';

import { useQueries } from '@tanstack/react-query';
import { Scale, ShoppingCart, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';

import QuickAddDialog from '@/components/shared/quick-add-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductBySlug } from '@/services/features/products/api';
import { ProductsResponse } from '@/services/features/products/type';
import { CompareItem, useCompareStore } from '@/store/compare.store';

interface CompareColumn {
  item: CompareItem;
  product?: ProductsResponse;
  loading: boolean;
  error: boolean;
}

interface CompareRow {
  label: string;
  render: (column: CompareColumn) => ReactNode;
}

/**
 * صفحه مقایسه محصولات:
 * لیست از استور persist شده خوانده می‌شود و مشخصات کامل هر محصول
 * به‌صورت موازی با slug دریافت و در یک جدول کنار هم نمایش داده می‌شود.
 */
export default function CompareView() {
  const hydrated = useCompareStore(state => state.hydrated);
  const setHydrated = useCompareStore(state => state.setHydrated);
  const items = useCompareStore(state => state.items);
  const remove = useCompareStore(state => state.remove);
  const clear = useCompareStore(state => state.clear);

  const [quickAddSlug, setQuickAddSlug] = useState<string | null>(null);

  useEffect(() => {
    setHydrated();
  }, [setHydrated]);

  const results = useQueries({
    queries: items.map(item => ({
      queryKey: ['product-by-slug', item.slug],
      queryFn: () => getProductBySlug(item.slug),
      enabled: hydrated && items.length > 0,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const columns: CompareColumn[] = items.map((item, index) => {
    const result = results[index];

    return {
      item,
      product: result?.data?.data?.product,
      loading: hydrated && items.length > 0 && (result?.isPending ?? false),
      error: result?.isError ?? false,
    };
  });

  // ---------- حالت اولیه (SSR تا رسیدن به کلاینت) ----------
  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-9/16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // ---------- لیست خالی ----------
  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <Scale className="size-16 stroke-1 text-muted-foreground" />

        <h1 className="text-xl font-light">لیست مقایسه خالی است</h1>

        <p className="max-w-md text-sm text-muted-foreground">
          از روی کارت محصولات، دکمه مقایسه را بزنید تا مشخصات چند محصول را
          کنار هم ببینید.
        </p>

        <Link href="/products">
          <Button variant="dark">مشاهده محصولات</Button>
        </Link>
      </div>
    );
  }

  // ---------- سطرهای جدول ----------
  const rows: CompareRow[] = [
    {
      label: 'قیمت',
      render: column => {
        const base = column.product?.variants?.[0]?.price ?? column.item.price;
        const discountFinal = column.product?.discount?.finalPrice;
        const hasDiscount =
          !!discountFinal && discountFinal > 0 && discountFinal < base;

        return (
          <div>
            {hasDiscount && (
              <div className="text-xs text-muted-foreground line-through">
                {base.toLocaleString()} تومان
              </div>
            )}

            <div className="font-semibold">
              {(hasDiscount ? discountFinal : base).toLocaleString()} تومان
            </div>
          </div>
        );
      },
    },
    {
      label: 'کد محصول',
      render: column => column.product?.productCode ?? '-',
    },
    {
      label: 'رنگ‌ها',
      render: column => {
        const names = Array.from(
          new Set(
            column.product?.variants
              ?.map(variant => variant.color?.name)
              .filter(Boolean),
          ),
        );

        return names.length ? names.join('، ') : '-';
      },
    },
    {
      label: 'سایزها',
      render: column => {
        const names = Array.from(
          new Set(
            column.product?.variants
              ?.map(variant => variant.size?.name)
              .filter(Boolean),
          ),
        );

        return names.length ? names.join('، ') : '-';
      },
    },
    {
      label: 'موجودی',
      render: column => {
        const total = (column.product?.variants ?? []).reduce(
          (sum, variant) => sum + (variant.stock || 0),
          0,
        );

        if (total <= 0) {
          return <span className="text-red-500">ناموجود</span>;
        }

        return <span className="text-green-600">{total} عدد موجود</span>;
      },
    },
    {
      label: 'دسته‌بندی',
      render: column => {
        const names = column.product?.categories
          ?.map(category => category.name)
          .filter(Boolean);

        return names?.length ? names.join('، ') : '-';
      },
    },
    {
      label: 'عملیات',
      render: column => (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setQuickAddSlug(column.item.slug)}
          >
            <ShoppingCart className="size-3.5" />
            افزودن به سبد
          </Button>

          <Link href={`/product/${column.item.slug}`}>
            <Button variant="ghost" size="sm">
              مشاهده
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const renderCellContent = (
    column: CompareColumn,
    content: (column: CompareColumn) => ReactNode,
  ) => {
    if (column.loading) {
      return <Skeleton className="h-5 w-24" />;
    }

    if (column.error || !column.product) {
      return <span className="text-xs text-muted-foreground">در دسترس نیست</span>;
    }

    return content(column);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      {/* عنوان و عملیات گروهی */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-light">مقایسه محصولات</h1>

        <Button variant="ghost" size="sm" onClick={clear}>
          پاک کردن لیست
        </Button>
      </div>

      {/* جدول (در موبایل اسکن افقی) */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky start-0 z-10 w-32 border-b border-s border-gray-200 bg-white p-3 text-start align-top">
                <span className="text-xs font-normal text-muted-foreground">
                  ویژگی
                </span>
              </th>

              {columns.map(column => (
                <th
                  key={column.item.id}
                  className="min-w-[170px] border-b border-s border-gray-200 p-3 align-top"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <Link href={`/product/${column.item.slug}`}>
                        <Image
                          src={column.item.image}
                          alt={column.item.title}
                          width={80}
                          height={104}
                          className="h-26 w-20 object-cover"
                        />
                      </Link>

                      <button
                        type="button"
                        onClick={() => remove(column.item.id)}
                        aria-label={`حذف ${column.item.title} از مقایسه`}
                        title="حذف از مقایسه"
                        className="absolute -left-2 -top-2 flex size-5 items-center justify-center rounded-full bg-gray-800 text-white shadow transition-colors hover:bg-red-600"
                      >
                        <X className="size-3" />
                      </button>
                    </div>

                    <Link
                      href={`/product/${column.item.slug}`}
                      className="line-clamp-2 text-center text-sm font-medium"
                    >
                      {column.item.title}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <th
                  scope="row"
                  className="sticky start-0 z-10 border-b border-s border-gray-200 bg-white p-3 text-start align-middle text-xs font-normal text-muted-foreground"
                >
                  {row.label}
                </th>

                {columns.map(column => (
                  <td
                    key={column.item.id}
                    className="border-b border-s border-gray-200 p-3 text-center align-middle"
                  >
                    {renderCellContent(column, row.render)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <QuickAddDialog
        slug={quickAddSlug}
        open={!!quickAddSlug}
        onOpenChange={open => {
          if (!open) setQuickAddSlug(null);
        }}
      />
    </div>
  );
}
