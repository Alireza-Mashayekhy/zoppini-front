'use client';

import HeroSection from '@/components/pages/home/hero-section';
import NewIn from '@/components/pages/home/new-in';
import { HomeImages } from '@/lib/home-images';
import { CategoriesResponse } from '@/services/features/categories/types';
import { FeaturedProductResponse } from '@/services/features/products/type';

interface HeroNewInTransitionProps {
  categories: CategoriesResponse[];
  products: FeaturedProductResponse[];
  /** پوستر ویدیوهای هدر (از پنل مدیریت) */
  heroPosters?: {
    first?: HomeImages['home.hero-1-poster'];
    second?: HomeImages['home.hero-2-poster'];
  };
}

/**
 * اسلایدر New In (Black Friday) و سپس بخش هیرو (دو ویدیوی کنار هم) — هر کدام
 * دقیقاً یک بخش تمام‌صفحه.
 *
 * ── چرا این‌طور شد ─────────────────────────────────────────────────────────
 * قبلاً این دو با یک تایم‌لاین GSAP `pin` روی هم سوار می‌شدند: صفحه ۱۶۰۰px
 * قفل می‌شد تا New In از پایین روی هدر بلغزد. نتیجه‌اش همان چیزی بود که کاربر
 * تجربه می‌کرد — «برای رسیدن به بخش بعدی چند بار باید چرخ ماوس را بچرخانیم»
 * و «انتقال از هدر به New In بی‌دلیل طولانی است».
 *
 * حالا هر دو بخش مستقل و تمام‌صفحه‌اند: یک حرکت چرخ ماوس = یک بخش، و
 * ScrollTrigger هیچ بخشی را pin نمی‌کند تا با اسکرول اسنپ (و با ارتفاع واقعی
 * صفحه) تضاد نداشته باشد. ظاهر هر دو بخش دست‌نخورده است.
 */
export default function HeroNewInTransition({
  categories,
  products,
  heroPosters,
}: HeroNewInTransitionProps) {
  return (
    <>
      <section
        id="home-new-in"
        data-home-section
        aria-label="جدیدترین محصولات"
        className="home-section home-section--full home-section--below-header relative bg-white"
      >
        <NewIn products={products} />
      </section>

      <section
        id="home-hero"
        data-home-section
        aria-label="کالکشن جدید"
        className="home-section home-section--full relative overflow-hidden bg-black"
      >
        <HeroSection categories={categories} posters={heroPosters} />
      </section>
    </>
  );
}
