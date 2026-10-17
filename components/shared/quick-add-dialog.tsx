'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAddToCart } from '@/services/features/cart/hooks';
import { useProductBySlug } from '@/services/features/products/hooks';
import {
  ColorResponse,
  ProductsResponse,
  SizeResponse,
} from '@/services/features/products/type';
import { useCartStore } from '@/store/cart.store';

interface QuickAddDialogProps {
  /** slug محصول؛ وقتی null باشد درخواستی ارسال نمی‌شود */
  slug: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * خرید سریع از روی کارت محصول:
 * اطلاعات محصول را با slug می‌گیرد، رنگ/سایز را انتخاب و به سبد اضافه می‌کند.
 */
export default function QuickAddDialog({
  slug,
  open,
  onOpenChange,
}: QuickAddDialogProps) {
  const { data, isLoading, isError } = useProductBySlug(open ? slug : null);
  const product = data?.data?.product;

  const imageUrl = product?.image
    ? process.env.NEXT_PUBLIC_IMAGE_URL + product.image
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">
            {product?.title ?? 'افزودن به سبد خرید'}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {isError && (
          <p className="py-6 text-center text-sm text-red-500">
            خطا در دریافت اطلاعات محصول. دوباره تلاش کنید.
          </p>
        )}

        {/* key باعث ریست انتخاب‌ها وقتی محصول عوض می‌شود (بدون useEffect) */}
        {product && (
          <QuickAddContent
            key={product.id}
            product={product}
            imageUrl={imageUrl}
            onAdded={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickAddContent({
  product,
  imageUrl,
  onAdded,
}: {
  product: ProductsResponse;
  imageUrl: string | null;
  onAdded: () => void;
}) {
  const [selectedColorId, setSelectedColorId] = useState<number | undefined>(
    product.variants?.[0]?.color?.id,
  );
  const [selectedSizeId, setSelectedSizeId] = useState<number | undefined>(
    product.variants?.[0]?.size?.id,
  );

  const colors = useMemo(() => {
    const map = new Map<number, ColorResponse>();

    product.variants?.forEach(variant => {
      if (variant.color && !map.has(variant.color.id)) {
        map.set(variant.color.id, variant.color);
      }
    });

    return Array.from(map.values());
  }, [product.variants]);

  const sizes = useMemo(() => {
    const map = new Map<number, SizeResponse>();

    product.variants?.forEach(variant => {
      if (variant.size && !map.has(variant.size.id)) {
        map.set(variant.size.id, variant.size);
      }
    });

    return Array.from(map.values());
  }, [product.variants]);

  const variant = product.variants?.find(
    item =>
      item.color?.id === selectedColorId && item.size?.id === selectedSizeId,
  );

  const basePrice = variant?.price ?? product.variants?.[0]?.price ?? 0;

  const productDiscountFinal =
    product.discount?.finalPrice &&
    product.discount.finalPrice > 0 &&
    product.discount.finalPrice < basePrice
      ? product.discount.finalPrice
      : null;

  const variantDiscountFinal =
    variant?.discountedPrice &&
    variant.discountedPrice > 0 &&
    variant.discountedPrice < basePrice
      ? variant.discountedPrice
      : null;

  const finalPrice = productDiscountFinal ?? variantDiscountFinal ?? basePrice;
  const hasDiscount = finalPrice < basePrice;
  const inStock = (variant?.stock ?? 0) > 0;

  const addToCart = useAddToCart();
  const openCart = useCartStore(state => state.openCart);

  const handleAdd = () => {
    if (!variant) {
      toast.error('لطفاً رنگ و سایز را انتخاب کنید');
      return;
    }

    addToCart.mutate(
      { variantId: variant.id, quantity: 1 },
      {
        onSuccess: () => {
          toast.success('به سبد خرید اضافه شد');
          openCart();
          onAdded();
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || 'خطا در افزودن به سبد خرید',
          );
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={product.title}
            width={64}
            height={80}
            className="h-20 w-16 shrink-0 object-cover"
          />
        )}

        <div className="min-w-0">
          <div className="line-clamp-2 text-sm font-medium">
            {product.title}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            کد محصول: {product.productCode}
          </div>
        </div>
      </div>

      {/* رنگ */}
      {colors.length > 0 && (
        <div>
          <div className="mb-2 text-xs text-muted-foreground">رنگ</div>

          <div className="flex flex-wrap gap-2">
            {colors.map(color => (
              <button
                key={color.id}
                type="button"
                onClick={() => setSelectedColorId(color.id)}
                className={cn(
                  'flex items-center gap-2 border px-3 py-1.5 text-sm transition-colors',
                  selectedColorId === color.id
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:border-primary/50',
                )}
              >
                <span
                  className="size-4 rounded-full border"
                  style={{ backgroundColor: color.hexCode }}
                />
                {color.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* سایز */}
      {sizes.length > 0 && (
        <div>
          <div className="mb-2 text-xs text-muted-foreground">سایز</div>

          <div className="flex flex-wrap gap-2">
            {sizes.map(size => (
              <button
                key={size.id}
                type="button"
                onClick={() => setSelectedSizeId(size.id)}
                className={cn(
                  'border px-3 py-1.5 text-sm transition-colors',
                  selectedSizeId === size.id
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:border-primary/50',
                )}
              >
                {size.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* قیمت و موجودی */}
      <div className="flex items-end justify-between border-t pt-3">
        <div>
          {hasDiscount && (
            <div className="text-xs text-muted-foreground line-through">
              {basePrice.toLocaleString()} تومان
            </div>
          )}

          <div className="font-semibold">
            {finalPrice.toLocaleString()} تومان
          </div>
        </div>

        <span
          className={cn(
            'text-sm',
            inStock ? 'text-green-600' : 'text-red-500',
          )}
        >
          {inStock ? 'موجود' : 'ناموجود'}
        </span>
      </div>

      <Button
        variant="dark"
        className="w-full"
        onClick={handleAdd}
        disabled={addToCart.isPending || !inStock}
      >
        {addToCart.isPending
          ? 'در حال افزودن...'
          : inStock
            ? 'افزودن به سبد خرید'
            : 'ناموجود'}
      </Button>
    </div>
  );
}
