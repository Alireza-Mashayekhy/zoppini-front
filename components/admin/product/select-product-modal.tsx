// components/admin/product/select-product-modal.tsx
'use client';

import { AlertCircleIcon, CheckCircle2Icon, LinkIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import CustomPagination from '@/components/shared/custom-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { normalizeSku } from '@/lib/sku';
import { cn, formatPrice } from '@/lib/utils';
import {
  useAdminProducsList,
  useProductByVariantSku,
} from '@/services/features/products/hooks';
import {
  IncomingVariantFromRahkaran,
  ProductsResponse,
} from '@/services/features/products/type';

const PAGE_SIZE = 8;

/**
 * مرحله‌ی اول «افزودن به محصولات»:
 *
 * هر کالای راهکاران در واقع یک واریانت (یک سایز از یک رنگ) از محصولات ماست.
 * بنابراین به‌جای انتخاب دستی رنگ و سایز، اینجا لیست محصولات را نشان می‌دهیم
 * و ادمین محصولی را انتخاب می‌کند که این کالا باید به آن اضافه شود.
 *
 * بعد از انتخاب، مودال محصول باز می‌شود تا ادمین واریانت را ببیند،
 * ویرایش کند و ذخیره کند.
 */
export default function SelectProductModal({
  open,
  onOpenChange,
  incoming,
  onSelectProduct,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incoming: IncomingVariantFromRahkaran | null;
  onSelectProduct: (product: ProductsResponse) => void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const { data: productsList, isLoading } = useAdminProducsList({
    all: true,
    search: debouncedSearch,
    page,
    limit: PAGE_SIZE,
  });

  /*
   * محصولی که این کد کالا (SKU) از قبل روی یکی از واریانت‌هایش نشسته است.
   *
   * چون SKU یکتاست، هر کالای راهکاران فقط به یک واریانت وصل می‌شود.
   */
  const { data: linkedProduct } = useProductByVariantSku(
    incoming?.productNumber,
  );

  const incomingSku = normalizeSku(incoming?.productNumber);

  const products = productsList?.data ?? [];

  const linkedVariant = useMemo(() => {
    if (!linkedProduct || !incomingSku) return null;

    return (
      linkedProduct.variants?.find(
        variant => normalizeSku(variant.sku) === incomingSku,
      ) ?? null
    );
  }, [linkedProduct, incomingSku]);

  const handleSelect = (product: ProductsResponse) => {
    /*
     * اگر کد کالا از قبل به محصول دیگری وصل است، اجازه نمی‌دهیم
     * دوباره به محصول دیگری وصل شود (SKU در دیتابیس یکتاست).
     * ادمین باید اول آن واریانت را از محصول قبلی حذف کند.
     */
    if (linkedProduct && linkedProduct.id !== product.id) {
      toast.error(
        `کد کالای ${incoming?.productNumber} قبلاً به محصول «${linkedProduct.title}» متصل شده است. برای جابه‌جایی، ابتدا آن واریانت را از محصول قبلی حذف کنید.`,
      );

      return;
    }

    onSelectProduct(product);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="flex max-h-[90vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>انتخاب محصول</DialogTitle>

          <DialogDescription>
            این کالا به‌عنوان یک سایز (واریانت) به محصول انتخاب‌شده اضافه
            می‌شود. محصول را از لیست زیر انتخاب کنید تا مودال ویرایش باز شود.
          </DialogDescription>
        </DialogHeader>

        {/* کالای در حال افزودن */}
        {incoming && (
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {incoming.productName}
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  کد کالا: {incoming.productNumber || '—'} · قیمت:{' '}
                  {formatPrice(incoming.price)} تومان · موجودی:{' '}
                  {incoming.stock.toLocaleString('fa-IR')}
                </div>
              </div>

              {linkedProduct ? (
                <Badge variant="secondary">
                  <LinkIcon />
                  قبلاً متصل شده
                </Badge>
              ) : (
                <Badge variant="outline">واریانت جدید</Badge>
              )}
            </div>

            {linkedProduct && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />

                  <div>
                    <div className="font-medium">
                      این کالا قبلاً به محصول «{linkedProduct.title}» اضافه شده
                      است.
                    </div>

                    <div className="mt-1 text-muted-foreground">
                      {linkedVariant
                        ? `سایز ${linkedVariant.size?.name ?? '—'} · رنگ ${linkedVariant.color?.name ?? '—'}`
                        : 'واریانت مربوطه در این محصول پیدا شد.'}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => onSelectProduct(linkedProduct)}
                >
                  ویرایش همان محصول
                </Button>
              </div>
            )}

            {!linkedProduct && (
              <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                این کالا هنوز به هیچ محصولی متصل نیست. محصول مورد نظر را از لیست
                زیر انتخاب کنید.
              </div>
            )}
          </div>
        )}

        {/* جستجو */}
        <Input
          placeholder="جستجوی محصول بر اساس نام یا کد محصول..."
          value={search}
          onChange={event => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="bg-white"
        />

        {/* لیست محصولات */}
        <div className="-mx-1 flex-1 overflow-y-auto px-1 scrollbar-thin">
          {isLoading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              محصولی با این عبارت پیدا نشد.
            </div>
          )}

          {!isLoading && products.length > 0 && (
            <div className="flex flex-col gap-2">
              {products.map(product => {
                const isLinkedProduct = linkedProduct?.id === product.id;

                const colorNames = [
                  ...new Set(
                    (product.variants ?? [])
                      .map(variant => variant.color?.name)
                      .filter(Boolean),
                  ),
                ].join('، ');

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelect(product)}
                    className={cn(
                      'flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-right transition-colors hover:border-primary/60 hover:bg-muted/40',
                      isLinkedProduct && 'border-primary/60 bg-primary/5',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {product.title}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        کد محصول: {product.productCode} ·{' '}
                        {(product.variants ?? []).length} سایز
                        {colorNames ? ` · رنگ: ${colorNames}` : ''}
                      </div>
                    </div>

                    {isLinkedProduct && (
                      <Badge variant="secondary" className="shrink-0">
                        <LinkIcon />
                        این کد قبلاً وصل شده
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* صفحه‌بندی */}
        {(productsList?.pagination?.totalPages ?? 1) > 1 && (
          <CustomPagination
            totalPages={productsList?.pagination?.totalPages ?? 1}
            currentPage={page}
            onPageChange={setPage}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
