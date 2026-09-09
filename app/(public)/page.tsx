import CategoriesSection from '@/components/pages/home/category-section';
import EndVideo from '@/components/pages/home/end-video';
import HeroNewInTransition from '@/components/pages/home/hero-new-in-transition';
import SaleBanner from '@/components/pages/home/sale-banner';
import StoreExperienceCard from '@/components/pages/home/StoreExperienceCard';
import SuggestedStyle from '@/components/pages/home/suggested-style';
import {
  getHeroSectionCategories,
  getHomeCategories,
} from '@/services/features/categories/server.api';
import {
  getFeaturedProducts,
  getStyleProducts,
} from '@/services/features/products/server.api';

export const revalidate = 300;

export default async function HomePage() {
  const [
    HeroSectionCategories,
    HomeCategories,
    FeaturedProducts,
    StyleProducts,
  ] = await Promise.all([
    getHeroSectionCategories(),
    getHomeCategories(),
    getFeaturedProducts(),
    getStyleProducts(),
  ]);

  return (
    <div>
      {/* Hero → New In Transition */}
      <HeroNewInTransition
        categories={HeroSectionCategories?.data ?? []}
        products={FeaturedProducts?.data ?? []}
      />

      <div className="mb-4">
        <SaleBanner />
      </div>

      {/* اسکرول عادی بعد از New In */}
      <CategoriesSection categories={HomeCategories?.data ?? []} />

      <SuggestedStyle products={StyleProducts?.data ?? []} />

      <EndVideo />

      <div className="flex justify-center my-10">
        {/* <HlsVideo
          src="/home/shoab/master.m3u8"
          className="aspect-square w-full max-w-[200px] sm:max-w-[500px] object-cover"
        /> */}
        <div className="w-[300px]">
          <StoreExperienceCard />
        </div>
      </div>
    </div>
  );
}
