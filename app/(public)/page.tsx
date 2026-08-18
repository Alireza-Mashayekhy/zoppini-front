import Image from 'next/image';
import Link from 'next/link';

import CategoriesSection from '@/components/pages/home/category-section';
import EndVideo from '@/components/pages/home/end-video';
import HeroNewInTransition from '@/components/pages/home/hero-new-in-transition';
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

      <div className="py-4">
        <Link href="/discounted-products">
          <div className="relative w-full aspect-[2.4] overflow-hidden">
            <Image
              src="/home/sale.webp"
              alt="محصولات تخفیف‌دار زوپینی"
              fill
              priority
              sizes="100vw"
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

      <div className="flex justify-center py-10">
        <video
          muted
          loop
          autoPlay
          playsInline
          className="aspect-square w-full max-w-[200px] sm:max-w-[500px] object-cover"
        >
          <source src="/home/shoab.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
