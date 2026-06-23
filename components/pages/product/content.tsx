'use client';

import { useState } from 'react';

import ProductColors from '@/components/pages/product/colors';
import ProductGallery from '@/components/pages/product/gallery';
import ProductSizes from '@/components/pages/product/sizes';
import { ProductsResponse } from '@/services/features/products/type';

import ProductInfo from './description';
import RelatedSlider from './relatedSlider';

interface ContentProps {
  product: ProductsResponse;
  relatedProducts: ProductsResponse[];
}

export default function ProductContent({
  products,
}: {
  products: ContentProps;
}) {
  const product = products.product;

  // استخراج اولین رنگ از واریانت‌ها به عنوان پیش‌فرض
  const defaultColorId = product.variants?.[0]?.color?.id;

  // State برای نگهداری رنگ انتخاب‌شده
  const [selectedColorId, setSelectedColorId] = useState<number | undefined>(
    defaultColorId,
  );

  // اگر رنگی انتخاب نشده باشد، از اولین واریانت استفاده کن
  const activeColorId = selectedColorId || defaultColorId;

  // پیدا کردن قیمت بر اساس رنگ و سایز انتخاب‌شده (اختیاری)
  const firstVariant = product.variants?.[0];
  const price = firstVariant?.price || 0;

  return (
    <div className="pt-[52px] flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* گالری تصاویر */}
        <div className="order-1 md:order-2">
          <ProductGallery product={product} selectedColorId={activeColorId} />
        </div>

        {/* اطلاعات محصول */}
        <div className="order-2 md:order-1 px-4 md:px-0 md:pt-5 flex flex-col gap-10 justify-between w-full md:w-1/2 mx-auto">
          <div>
            <h1 className="text-2xl font-bold mb-4">{product.title}</h1>

            {/* انتخاب رنگ */}
            <ProductColors
              product={product}
              selectedColorId={activeColorId}
              onColorSelect={setSelectedColorId}
            />

            {/* انتخاب سایز */}
            <ProductSizes product={product} />

            {/* دکمه افزودن به سبد خرید */}
            <button className="w-full text-sm mt-6 border flex items-center justify-between h-[50px] px-5 bg-gray-800 text-background">
              افزودن به سبد خرید
              <span>{parseInt(price.toString()).toLocaleString()} تومان</span>
            </button>
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
