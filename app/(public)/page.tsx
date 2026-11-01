import { Metadata } from 'next';

import CategoriesSection from '@/components/pages/home/category-section';
import EndVideo from '@/components/pages/home/end-video';
import HeroNewInTransition from '@/components/pages/home/hero-new-in-transition';
import SaleBanner from '@/components/pages/home/sale-banner';
import SuggestedStyle from '@/components/pages/home/suggested-style';
import { resolveHomeImages } from '@/lib/home-images';
import { buildPageMetadata } from '@/lib/seo';
import {
  getHeroSectionCategories,
  getHomeCategories,
} from '@/services/features/categories/server.api';
import {
  getFeaturedProducts,
  getStyleProducts,
} from '@/services/features/products/server.api';
import { getSiteImages } from '@/services/features/site-images/server.api';

const pageMetadata: Metadata = {
  title: 'فروشگاه پوشاک مردانه - زوپینی',
  description:
    'فروشگاه آنلاین پوشاک مردانه زوپینی | خرید انواع کت شلوار مردانه، کت تک، پالتو، پیراهن و شلوار- خرید حضوری و اینترنتی | پرداخت در محل✓ امکان بازگشت کالا✓',
  alternates: {
    canonical: 'https://zoppinico.com',
  },
};

/**
 * متای این صفحه: اگر مدیر سئو در پنل مقداری ثبت کرده باشد، همان مقدار
 * جایگزین متادیتای پیش‌فرض بالا می‌شود.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/', pageMetadata);
}

export const revalidate = 300;

export default async function HomePage() {
  const [
    HeroSectionCategories,
    HomeCategories,
    FeaturedProducts,
    StyleProducts,
    SiteImages,
  ] = await Promise.all([
    getHeroSectionCategories(),
    getHomeCategories(),
    getFeaturedProducts(),
    getStyleProducts(),
    getSiteImages(),
  ]);

  /*
   * تصاویر قابل‌مدیریت صفحه اصلی (پنل ادمین → تصاویر صفحه اصلی).
   *
   * هر جایگاهی که مدیر برایش تصویر آپلود نکرده باشد، تصویر پیش‌فرض
   * خودش را نگه می‌دارد؛ پس نبودِ این داده‌ها چیزی را خراب نمی‌کند.
   */
  const homeImages = resolveHomeImages(SiteImages);

  return (
    <div>
      {/* Hero → New In Transition */}
      <HeroNewInTransition
        categories={HeroSectionCategories?.data ?? []}
        products={FeaturedProducts?.data ?? []}
        heroPosters={{
          first: homeImages['home.hero-1-poster'],
          second: homeImages['home.hero-2-poster'],
        }}
      />

      <div className="mb-4">
        <SaleBanner image={homeImages['home.sale-banner']} />
      </div>

      {/* اسکرول عادی بعد از New In */}
      <CategoriesSection
        categories={HomeCategories?.data ?? []}
        images={{
          first: homeImages['home.category-1'],
          second: homeImages['home.category-2'],
        }}
      />

      <SuggestedStyle products={StyleProducts?.data ?? []} />

      <EndVideo poster={homeImages['home.end-video-poster']} />

      {/* <div className="flex justify-center my-10">
        <div className="w-[300px]">
          <StoreExperienceCard />
        </div>
      </div> */}
    </div>
  );
}
