'use client';

import Image from 'next/image';
import Link from 'next/link';

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

const tileClass = 'group relative mx-0.5 my-1 aspect-square bg-gray-300';

const labelClass =
  'text-xs sm:text-base absolute bottom-4 right-4 sm:opacity-0 transition-all group-hover:opacity-100';

/** یک خانه‌ی دسته‌بندی (لینک + تصویر + برچسب) */
function CategoryTile({ category }: { category: CategoriesResponse }) {
  return (
    <Link
      href={`/product-category/${category.slug}`}
      className={tileClass}
      aria-label={category.name}
    >
      <Image
        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${category.image}`}
        fill
        alt={category.name}
        className="object-cover"
        sizes="(min-width: 640px) 25vw, 50vw"
        loading="lazy"
      />

      <div className={labelClass}>{category.name}</div>
    </Link>
  );
}

/**
 * بخش دسته‌بندی‌های صفحه‌ی اصلی: دو شبکه‌ی ۴ خانه‌ای (۲ رسانه‌ی بزرگ + ۴
 * دسته‌بندی) که پشت سر هم می‌آیند.
 *
 * ── چه چیزی عوض شد و چرا ───────────────────────────────────────────────────
 * محتوا و ظاهر هر دو شبکه دقیقاً همان قبلی است؛ فقط رفتار اسکرولشان.
 * قبلاً شبکه‌ی دوم با یک ScrollTrigger روی شبکه‌ی اول `pin` می‌شد و با
 * `yPercent` از پایین روی آن می‌لغزید. آن pin دو مشکل می‌ساخت:
 *
 *   1. صفحه را ۱۶۰۰px قفل می‌کرد؛ کاربر باید چند بار چرخ ماوس را می‌چرخاند
 *      تا از این بخش رد شود.
 *   2. شبکه‌ی دوم «تدریجی» وارد صفحه می‌شد، نه کامل — همان حس نیمه‌کاره بودن
 *      بنرها.
 *
 * اکنون هر دو شبکه در جریان عادی سند هستند و ارتفاعشان با عرض واقعی صفحه
 * محدود می‌شود (`.home-square-grid`)؛ هر شبکه تقریباً یک صفحه‌ی کامل است و
 * اسکرول اسنپ روی مرز دو شبکه می‌ایستد، پس هیچ بخشی نیمه‌کاره نمی‌ماند.
 */
export default function CategoriesSection({
  categories,
  images,
}: CategoriesSectionProps) {
  /** ردیف اول: تصاویر بزرگ + دسته‌بندی‌های ۱ تا ۴ */
  const firstRowCategories = categories.slice(0, 4);

  /** ردیف دوم: ویدیوهای بزرگ + دسته‌بندی‌های ۵ تا ۸ */
  const secondRowCategories = categories.slice(4, 8);

  return (
    <section
      id="home-categories"
      data-home-section
      aria-label="دسته‌بندی‌ها"
      className="home-section home-section--below-header w-full overflow-hidden bg-white"
    >
      {/* ============================================== */}
      {/* شبکه اول — تصاویر                              */}
      {/* ============================================== */}

      <div
        data-home-snap
        className="home-snap home-square-grid mx-auto grid w-full grid-cols-2 bg-white sm:grid-cols-4"
      >
        {images?.first && (
          <div className="relative col-span-2 hidden aspect-square bg-gray-200 sm:block">
            <HomeImage image={images.first} />
          </div>
        )}

        {images?.second && (
          <div className="relative col-span-2 aspect-square bg-gray-200">
            <HomeImage image={images.second} />
          </div>
        )}

        {firstRowCategories.map(category => (
          <CategoryTile
            key={category.id ?? category.name}
            category={category}
          />
        ))}
      </div>

      {/* ============================================== */}
      {/* شبکه دوم — ویدیوها                             */}
      {/* ============================================== */}

      <div
        data-home-snap
        className="home-snap home-square-grid mx-auto grid w-full grid-cols-2 bg-white sm:grid-cols-4"
      >
        <div className="relative col-span-2 hidden aspect-square sm:block">
          <HlsVideo
            src="/home/category_1/master.m3u8"
            poster="/home/category_1/poster.webp"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="relative col-span-2 aspect-square">
          <HlsVideo
            src="/home/category_2/master.m3u8"
            poster="/home/category_2/poster.webp"
            className="h-full w-full object-cover"
          />
        </div>

        {secondRowCategories.map(category => (
          <CategoryTile
            key={category.id ?? category.name}
            category={category}
          />
        ))}
      </div>
    </section>
  );
}
