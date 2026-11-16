import { Metadata } from 'next';

import CategoriesSection from '@/components/pages/home/category-section';
import EndVideo from '@/components/pages/home/end-video';
import HeroNewInTransition from '@/components/pages/home/hero-new-in-transition';
import HomeScrollExperience from '@/components/pages/home/home-scroll-experience';
import SaleBanner from '@/components/pages/home/sale-banner';
import SuggestedStyle from '@/components/pages/home/suggested-style';
import { resolveHomeImages } from '@/lib/home-images';
import {
  buildPageMetadata,
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_TITLE,
} from '@/lib/seo';
import {
  getHeroSectionCategories,
  getHomeCategories,
} from '@/services/features/categories/server.api';
import {
  getFeaturedProducts,
  getStyleProducts,
} from '@/services/features/products/server.api';
import { getSiteImages } from '@/services/features/site-images/server.api';

/** پیش‌فرضِ صفحه‌ی اصلی همان مقدارِ پیش‌فرضِ سایت است (ثابت‌های `lib/seo.ts`). */
const pageMetadata: Metadata = {
  title: SITE_DEFAULT_TITLE,
  description: SITE_DEFAULT_DESCRIPTION,
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
      {/*
        تجربه‌ی اسکرول صفحه‌ی اصلی: اسکرول اسنپ بخش‌به‌بخش، نوار پیشرفت بالای
        صفحه و ناوبری دایره‌ای سمت راست در دسکتاپ. فقط در همین صفحه فعال است و
        با ترک صفحه همه‌چیز پاک می‌شود.
      */}
      <HomeScrollExperience />

      {/* Hero → New In Transition */}
      <HeroNewInTransition
        categories={HeroSectionCategories?.data ?? []}
        products={FeaturedProducts?.data ?? []}
        heroPosters={{
          first: homeImages['home.hero-1-poster'],
          second: homeImages['home.hero-2-poster'],
        }}
      />

      <SaleBanner image={homeImages['home.sale-banner']} />

      {/* دسته‌بندی‌ها، پیشنهاد استایل و ویدیوی پایانی — هر کدام یک بخش */}
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
