'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import HlsVideo from '@/components/shared/hls-video';
import HomeImage from '@/components/shared/home-image';
import { HomeImage as HomeImageData } from '@/lib/home-images';
import { CategoriesResponse } from '@/services/features/categories/types';

interface CategoriesSectionProps {
  categories: CategoriesResponse[];
  /**
   * تصاویر بخش دسته‌بندی‌ها (از پنل مدیریت).
   *
   * اگر مدیر تصویری آپلود نکرده باشد، تصویر پیش‌فرض سایت استفاده می‌شود.
   */
  images?: {
    first?: HomeImageData;
    second?: HomeImageData;
  };
}

/**
 * خانه‌ی دسته‌بندی: رسانه + برچسب.
 *
 * برچسب همیشه دیده می‌شود (نه فقط با hover) تا روی موبایل و دستگاه‌های لمسی
 * هم خوانا باشد؛ hover فقط یک افکت ملایم روی تصویر اضافه می‌کند.
 */
function CategoryTile({
  category,
  positionClass,
}: {
  category: CategoriesResponse;
  positionClass?: string;
}) {
  return (
    <Link
      href={`/product-category/${category.slug}`}
      className={`group relative block overflow-hidden bg-gray-300 aspect-square lg:aspect-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stone-900 ${positionClass ?? ''}`}
      aria-label={category.name}
      title={category.name}
    >
      <Image
        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${category.image}`}
        fill
        alt={category.name}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        sizes="(min-width: 1024px) 16vw, 50vw"
        loading="lazy"
      />

      <div className="pointer-events-none absolute bottom-2 right-2 max-w-[80%] truncate rounded-sm bg-white/90 px-2 py-1 text-xs leading-5 font-medium text-stone-900 shadow-sm backdrop-blur-[2px] sm:text-sm">
        {category.name}
      </div>
    </Link>
  );
}

/** جایگاه ثابت هر خانه در چیدمان دسکتاپ (۲ خانه در ستون چپ، ۲ خانه در راست) */
const TILE_POSITIONS = [
  'home-category-tile--start-1',
  'home-category-tile--start-2',
  'home-category-tile--end-1',
  'home-category-tile--end-2',
];

/** یک صفحه‌ی دسته‌بندی (رسانه‌های مرکزی + ۴ خانه در دو ستون کناری) */
function CategorySlide({
  id,
  media,
  categories,
}: {
  id: string;
  media: ReactNode;
  categories: CategoriesResponse[];
}) {
  return (
    <div
      data-home-snap
      data-home-snap-id="home-categories"
      data-home-slide={id}
      className="home-category-slide"
    >
      <div className="home-category-layout">
        {media}

        {categories.map((category, index) => (
          <CategoryTile
            key={category.id ?? category.name}
            category={category}
            positionClass={TILE_POSITIONS[index]}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * بخش دسته‌بندی‌های صفحه‌ی اصلی: دو صفحه‌ی تمام‌صفحه.
 *
 * هر صفحه یک ترکیب تمام‌عرض است: رسانه‌های بزرگ در وسط (تمام ارتفاعِ فضای
 * زیر هدر) و چهار خانه‌ی دسته‌بندی در دو ستون کناری، هر ستون دو خانه‌ی
 * عمودی. بنابراین محتوا کل عرض را می‌گیرد، هیچ چیز زیر ویدیوها جا نمی‌ماند
 * و صفحه‌ی بعدی هم از پایین سرک نمی‌کشد.
 *
 * صفحه‌ی اول رسانه‌های تصویری مدیر و صفحه‌ی دوم ویدیوهای دسته‌بندی را نشان
 * می‌دهد. در موبایل همین محتوا به ترتیب «رسانه‌ها در بالا، خانه‌ها در پایین»
 * و بدون اسکرول افقی می‌نشیند.
 */
export default function CategoriesSection({
  categories,
  images,
}: CategoriesSectionProps) {
  /** صفحه‌ی اول: تصاویر بزرگ + دسته‌بندی‌های ۱ تا ۴ */
  const firstRowCategories = categories.slice(0, 4);

  /** صفحه‌ی دوم: ویدیوهای بزرگ + دسته‌بندی‌های ۵ تا ۸ */
  const secondRowCategories = categories.slice(4, 8);

  return (
    <section
      id="home-categories"
      data-home-section
      aria-label="دسته‌بندی‌ها"
      className="home-section relative w-full bg-white"
    >
      <CategorySlide
        id="images"
        categories={firstRowCategories}
        media={
          <>
            <div className="home-category-media home-category-media--first">
              {images?.first ? (
                <HomeImage image={images.first} />
              ) : (
                <span aria-hidden="true" />
              )}
            </div>

            <div className="home-category-media home-category-media--second">
              {images?.second ? (
                <HomeImage image={images.second} />
              ) : (
                <span aria-hidden="true" />
              )}
            </div>
          </>
        }
      />

      <CategorySlide
        id="videos"
        categories={secondRowCategories}
        media={
          <>
            <div className="home-category-media home-category-media--first">
              <HlsVideo
                src="/home/category_1/master.m3u8"
                poster="/home/category_1/poster.webp"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>

            <div className="home-category-media home-category-media--second">
              <HlsVideo
                src="/home/category_2/master.m3u8"
                poster="/home/category_2/poster.webp"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </>
        }
      />
    </section>
  );
}
