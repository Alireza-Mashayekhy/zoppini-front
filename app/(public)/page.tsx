import CategoriesSection from '@/components/pages/home/category-section';
import HeroSection from '@/components/pages/home/hero-section';
import NewIn from '@/components/pages/home/new-in';
import SaleSection from '@/components/pages/home/sale-section';
import SuggestedStyle from '@/components/pages/home/suggested-style';
import { ApiListResponse } from '@/services/api/types';
import { getCategories } from '@/services/features/categories/server.api';
import { CategoriesResponse } from '@/services/features/categories/types';

export default async function HomePage() {
  const categories: ApiListResponse<CategoriesResponse> = await getCategories();
  console.log(categories);
  const HeroSectionCategories = categories?.data.filter(
    cat => cat.isInHeroSection,
  );
  const HomeCategories = categories?.data.filter(cat => cat.isInHome);

  return (
    <div>
      <HeroSection categories={HeroSectionCategories} />
      <NewIn />
      <CategoriesSection categories={HomeCategories} />
      <SaleSection />
      <SuggestedStyle />
      <div className="h-screen">
        <video muted loop autoPlay className="w-full h-full object-cover">
          <source
            src="https://diorama.dam-broadcast.com/pm_11872_1348_1348692-h5jjxm7bx5-h265.mp4"
            type="video/mp4"
          />
        </video>
      </div>
      <div className="py-10 flex justify-center">
        <video
          muted
          loop
          autoPlay
          className="w-full max-w-[500px] aspect-square object-cover"
        >
          <source
            src="https://diorama.dam-broadcast.com/pm_11872_1348_1348692-h5jjxm7bx5-h265.mp4"
            type="video/mp4"
          />
        </video>
      </div>
    </div>
  );
}
