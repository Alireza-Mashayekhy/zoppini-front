import type { Metadata } from 'next';

import CompareView from '@/components/pages/products/compare-view';

export const metadata: Metadata = {
  title: 'مقایسه محصولات - زوپینی',
  description:
    'مقایسه مشخصات محصولات زوپینی؛ قیمت، رنگ، سایز و موجودی چند محصول را کنار هم ببینید.',
  // صفحه مقایسه محتوای تکراری تولید می‌کند؛ ایندکس نشود
  robots: { index: false },
};

export default function ComparePage() {
  return <CompareView />;
}
