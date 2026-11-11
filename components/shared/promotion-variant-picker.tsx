'use client';

import { Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatPrice } from '@/lib/utils';
import { useAddToCart } from '@/services/features/cart/hooks';
import {
  useCategoryProducts,
  useProductBySlug,
} from '@/services/features/products/hooks';
import { useSelectPromotionReward } from '@/services/features/promotions/hooks';

interface PromotionVariantPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotionId: number;
  /** اگر مشخص باشد، انتخاب رنگ/سایز همین محصول است */
  productId: number | null;
  /** اگر محصول مشخص نباشد، انتخاب از دسته‌بندی انجام می‌شود */
  categoryId: number | null;
  title: string;
  /**
   * `reward`: کالا از مسیر پاداش و رایگان اضافه می‌شود.
   * `paid`: کالا با قیمت عادی اضافه می‌شود (برای کامل‌کردن شرط پیشنهاد).
   */
  mode?: 'reward' | 'paid';
  onSelected?: () => void;
}

/**
 * انتخاب واریانت (رنگ/سایز) کالای هدیه پیش از افزودن.
 * فقط واریانت‌های موجود قابل انتخاب‌اند و موجودی کمتر از یک غیرفعال است.
 */
export default function PromotionVariantPicker({
  open,
  onOpenChange,
  promotionId,
  productId,
  categoryId,
  title,
  mode = 'reward',
  onSelected,
}: PromotionVariantPickerProps) {
  const selectReward = useSelectPromotionReward();
  const addPaidItem = useAddToCart();

  const isPaid = mode === 'paid';

  const [slug, setSlug] = useState<string | null>(null);

  // اگر فقط دسته مشخص است، محصول انتخاب‌شده توسط کاربر لود می‌شود
  const { data, isLoading } = useProductBySlug(slug);

  const product = data?.data?.product;

  const variants = useMemo(
    () => (product?.variants ?? []).filter(variant => variant.stock > 0),
    [product?.variants],
  );

  const colors = useMemo(() => {
    const map = new Map<number, string>();

    for (const variant of variants) {
      map.set(variant.color.id, variant.color.name);
    }

    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [variants]);

  const [colorId, setColorId] = useState<number | null>(null);
  const [sizeId, setSizeId] = useState<number | null>(null);

  const activeColorId = colorId ?? colors[0]?.id ?? null;

  const sizes = useMemo(
    () =>
      variants
        .filter(variant => variant.color.id === activeColorId)
        .map(variant => ({
          id: variant.size.id,
          name: variant.size.name,
          stock: variant.stock,
          variantId: variant.id,
          price: variant.price,
        })),
    [variants, activeColorId],
  );

  const activeSizeId = sizeId ?? sizes[0]?.id ?? null;

  const selectedVariant = sizes.find(size => size.id === activeSizeId);

  const handleConfirm = () => {
    if (!selectedVariant) {
      return;
    }

    const onSuccess = () => {
      onOpenChange(false);
      onSelected?.();
    };

    if (isPaid) {
      // کالای پولی: از مسیر معمولی سبد، با قیمت واقعی
      addPaidItem.mutate(
        { variantId: selectedVariant.variantId, quantity: 1 },
        { onSuccess },
      );

      return;
    }

    selectReward.mutate(
      { promotionId, variantId: selectedVariant.variantId, quantity: 1 },
      { onSuccess },
    );
  };

  const isPending = isPaid ? addPaidItem.isPending : selectReward.isPending;

  if (!productId && !categoryId) {
    return null;
  }

  // حالت «انتخاب از دسته‌بندی»: کاربر محصول را جست‌وجو/انتخاب می‌کند
  if (!productId && categoryId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {isPaid
                ? 'کالا را از محصولات مشمول پیشنهاد انتخاب کنید.'
                : 'کالای هدیه را از محصولات واجد شرایط انتخاب کنید.'}
            </DialogDescription>
          </DialogHeader>

          <RewardCategoryPicker
            categoryId={categoryId}
            onPick={nextSlug => setSlug(nextSlug)}
          />

          {slug && (
            <div className="space-y-3">
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <VariantSelection
                  colors={colors}
                  sizes={sizes}
                  activeColorId={activeColorId}
                  activeSizeId={activeSizeId}
                  onColorChange={setColorId}
                  onSizeChange={setSizeId}
                />
              )}

              <Button
                className="w-full"
                onClick={handleConfirm}
                disabled={!selectedVariant || isPending}
              >
                {isPending && <Loader2 className="ml-2 size-4 animate-spin" />}
                {isPaid ? 'افزودن به سبد' : 'افزودن هدیه به سبد'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isPaid
              ? 'رنگ و سایز را انتخاب کنید؛ کالا با قیمت عادی به سبد اضافه می‌شود.'
              : 'رنگ و سایز کالای هدیه را انتخاب کنید؛ مبلغ آن رایگان محاسبه می‌شود.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            {product?.image && (
              <div className="relative h-32 w-full overflow-hidden bg-[#f7f7f7]">
                <Image
                  src={process.env.NEXT_PUBLIC_IMAGE_URL + product.image}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <VariantSelection
              colors={colors}
              sizes={sizes}
              activeColorId={activeColorId}
              activeSizeId={activeSizeId}
              onColorChange={setColorId}
              onSizeChange={setSizeId}
            />

            {selectedVariant &&
              (isPaid ? (
                <p className="text-xs text-muted-foreground">
                  مبلغ قابل پرداخت:{' '}
                  <strong>{formatPrice(selectedVariant.price)} تومان</strong>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  ارزش کالای هدیه:{' '}
                  <del>{formatPrice(selectedVariant.price)}</del> — مبلغ قابل
                  پرداخت <strong className="text-green-700">۰ تومان</strong>
                </p>
              ))}

            <Button
              className="w-full"
              onClick={handleConfirm}
              disabled={!selectedVariant || isPending}
            >
              {isPending && <Loader2 className="ml-2 size-4 animate-spin" />}
              {isPaid ? 'افزودن به سبد' : 'افزودن هدیه به سبد'}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VariantSelection({
  colors,
  sizes,
  activeColorId,
  activeSizeId,
  onColorChange,
  onSizeChange,
}: {
  colors: { id: number; name: string }[];
  sizes: { id: number; name: string; stock: number }[];
  activeColorId: number | null;
  activeSizeId: number | null;
  onColorChange: (id: number) => void;
  onSizeChange: (id: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium">رنگ</p>

        <div className="flex flex-wrap gap-2">
          {colors.map(color => (
            <button
              key={color.id}
              type="button"
              onClick={() => onColorChange(color.id)}
              className={cn(
                'border px-3 py-1.5 text-xs',
                activeColorId === color.id
                  ? 'border-primary bg-primary text-background'
                  : 'border-border bg-white',
              )}
            >
              {color.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium">سایز</p>

        <div className="flex flex-wrap gap-2">
          {sizes.map(size => (
            <button
              key={size.id}
              type="button"
              onClick={() => onSizeChange(size.id)}
              className={cn(
                'flex items-center gap-1 border px-3 py-1.5 text-xs',
                activeSizeId === size.id
                  ? 'border-primary bg-primary text-background'
                  : 'border-border bg-white',
              )}
            >
              {activeSizeId === size.id && <Check className="size-3" />}
              {size.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * انتخاب محصول از یک دسته‌بندی برای هدیه‌هایی که مشتری باید انتخاب کند.
 * محصولات «فقط موجود» فیلتر می‌شوند تا هدیهٔ ناموجود پیشنهاد نشود.
 */
function RewardCategoryPicker({
  categoryId,
  onPick,
}: {
  categoryId: number;
  onPick: (slug: string) => void;
}) {
  const { data, isLoading } = useRewardCategoryProducts(categoryId);

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  const products = data?.data ?? [];

  if (!products.length) {
    return (
      <p className="text-sm text-muted-foreground">
        در حال حاضر کالای موجودی برای این پیشنهاد نیست.
      </p>
    );
  }

  return (
    <div className="max-h-56 space-y-2 overflow-y-auto">
      {products.map(product => (
        <button
          key={product.id}
          type="button"
          onClick={() => onPick(product.slug)}
          className="flex w-full items-center gap-2 border p-2 text-right text-xs hover:bg-muted"
        >
          {product.image && (
            <span className="relative size-10 shrink-0 overflow-hidden bg-[#f7f7f7]">
              <Image
                src={process.env.NEXT_PUBLIC_IMAGE_URL + product.image}
                alt={product.title}
                fill
                className="object-cover"
                sizes="40px"
              />
            </span>
          )}
          <span className="line-clamp-1">{product.title}</span>
        </button>
      ))}
    </div>
  );
}

function useRewardCategoryProducts(categoryId: number) {
  return useCategoryProducts(categoryId, 12);
}
