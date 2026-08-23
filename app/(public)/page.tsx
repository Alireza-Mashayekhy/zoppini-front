import Image from 'next/image';
import Link from 'next/link';

import CategoriesSection from '@/components/pages/home/category-section';
import EndVideo from '@/components/pages/home/end-video';
import HeroNewInTransition from '@/components/pages/home/hero-new-in-transition';
import StoreExperienceCard from '@/components/pages/home/StoreExperienceCard';
import SuggestedStyle from '@/components/pages/home/suggested-style';
import { ApiListResponse } from '@/services/api/types';
import {
  getHeroSectionCategories,
  getHomeCategories,
} from '@/services/features/categories/server.api';
import { CategoriesResponse } from '@/services/features/categories/types';
import {
  getFeaturedProducts,
  getStyleProducts,
} from '@/services/features/products/server.api';
import { FeaturedProductResponse } from '@/services/features/products/type';

export default async function HomePage() {
  const HeroSectionCategories: ApiListResponse<CategoriesResponse> =
    await getHeroSectionCategories();

  const HomeCategories: ApiListResponse<CategoriesResponse> =
    await getHomeCategories();

  const FeaturedProducts: ApiListResponse<FeaturedProductResponse> =
    await getFeaturedProducts();

  const StyleProducts: ApiListResponse<FeaturedProductResponse> =
    await getStyleProducts();

  return (
    <div>
      {/* Hero → New In Transition */}
      <HeroNewInTransition
        categories={HeroSectionCategories?.data ?? []}
        products={FeaturedProducts?.data ?? []}
      />

      <div>
        <Link href="/discounted-products">
          <div className="relative hidden sm:block w-full h-auto overflow-hidden">
            <Image
              src="/home/sale.png"
              alt="محصولات تخفیف‌دار زوپینی"
              width={4269}
              height={2400}
              priority
              sizes="100vw"
              quality={100}
              className="object-cover"
            />
          </div>
          <div className="relative sm:hidden w-full h-auto overflow-hidden">
            <Image
              src="/home/mobile_sale.png"
              alt="محصولات تخفیف‌دار زوپینی"
              width={1080}
              height={1920}
              priority
              quality={100}
              className="object-cover"
            />
          </div>
        </Link>
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
