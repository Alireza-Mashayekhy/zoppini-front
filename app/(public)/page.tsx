'use client';

import CategoriesSection from '@/components/pages/home/category-section';
import HeroSection from '@/components/pages/home/hero-section';
import NewIn from '@/components/pages/home/new-in';
import SuggestedStyle from '@/components/pages/home/suggested-style';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <NewIn />
      <CategoriesSection />
      <SuggestedStyle />
    </div>
  );
}
