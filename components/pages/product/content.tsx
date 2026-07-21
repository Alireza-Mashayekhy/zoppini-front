// components/pages/product/content.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import ProductColors from '@/components/pages/product/colors';
import ProductGallery from '@/components/pages/product/gallery';
import ProductSizes from '@/components/pages/product/sizes';
import { useAddToCart } from '@/services/features/cart/hooks';
import { ProductResponse } from '@/services/features/products/type';
import { useCartStore } from '@/store/cart.store';

import ProductInfo from './description';
import RelatedSlider from './relatedSlider';
import WishlistButton from './wishlist-button';

export default function ProductContent({
  products,
}: {
  products: ProductResponse;
}) {
  const product = products.product;

  // ==================== ساخت لیست رنگ‌ها با لینک ====================
  // ۱. رنگ‌های خود محصول (برای نمایش در گالری و انتخاب)
  const selfColors =
    product.colorImages?.map(v => ({
      color: v.color,
      productSlug: product.slug, // لینک به خود محصول
      url: v.url,
    })) || [];

  // ۲. رنگ‌های محصولات هم‌رنگ
  const sameColorColors =
    product.sameColorProducts?.flatMap(
      p =>
        p.colorImages?.map(v => ({
          color: v.color,
          productSlug: p.slug,
          url: v.url,
        })) || [],
    ) || [];

  // ۳. ادغام و حذف تکراری‌ها (بر اساس id رنگ)
  const colorMap = new Map<number, { color: any; productSlug: string }>();
  [...selfColors, ...sameColorColors].forEach(item => {
    if (!colorMap.has(item.color.id)) {
      colorMap.set(item.color.id, item);
    }
  });
  const colorLinks = Array.from(colorMap.values());
  // ========================================================
  console.log(colorLinks);

  const defaultColorId = product.variants?.[0]?.color?.id;
  const [selectedColorId, setSelectedColorId] = useState<number | undefined>(
    defaultColorId,
  );
  const [selectedSizeId, setSelectedSizeId] = useState<number | undefined>(
    product.variants?.[0]?.size?.id,
  );

  const activeColorId = selectedColorId || defaultColorId;
  const firstVariant = product.variants?.[0];
  const price = firstVariant?.price || 0;

  const addToCart = useAddToCart();
  const { openCart } = useCartStore();

  const handleAddToCart = () => {
    const variant = product.variants?.find(
      v => v.color.id === activeColorId && v.size.id === selectedSizeId,
    );

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
        },
        onError: (error: any) => {
          toast.error(error?.message || 'خطا در افزودن به سبد خرید');
        },
      },
    );
  };

  return (
    <div className="pt-[52px] flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="order-1 md:order-2">
          <ProductGallery product={product} colorImages={product.colorImages} />
        </div>

        <div className="order-2 md:order-1 px-4 md:px-0 md:pt-5 flex flex-col gap-10 justify-between w-full md:w-1/2 mx-auto">
          <div>
            <h1 className="text-2xl font-bold mb-4">{product.title}</h1>

            {/* ارسال colorLinks به کامپوننت ProductColors */}
            <ProductColors
              colorLinks={colorLinks}
              selectedColorId={activeColorId}
              onColorSelect={setSelectedColorId}
              currentSlug={product.slug} // برای تشخیص رنگ‌های خود محصول
            />

            <ProductSizes
              product={product}
              selectedSizeId={selectedSizeId}
              onSizeSelect={setSelectedSizeId}
            />

            <div className="flex gap-1 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={addToCart.isPending}
                className="w-full text-sm border flex items-center justify-between h-[50px] px-5 bg-gray-800 text-background disabled:opacity-60"
              >
                {addToCart.isPending
                  ? 'در حال افزودن...'
                  : 'افزودن به سبد خرید'}
                <span>{parseInt(price.toString()).toLocaleString()} تومان</span>
              </button>
              <WishlistButton productId={product.id} />
            </div>
          </div>
          <ProductInfo product={product} />
        </div>
      </div>
      <RelatedSlider
        products={product.suggestedProducts}
        label="محصولات پیشنهادی"
      />
      <RelatedSlider
        products={products.relatedProducts}
        label="محصولات مرتبط"
      />
    </div>
  );
}
