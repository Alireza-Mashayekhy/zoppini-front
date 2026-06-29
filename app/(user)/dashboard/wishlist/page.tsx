// app/dashboard/wishlist/page.tsx
'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

import ProductCard from '@/components/shared/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWishlist } from '@/services/features/wishlist/hooks';

export default function WishlistPage() {
  const { data: wishlistItems, isLoading } = useWishlist();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="w-full aspect-9/16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!wishlistItems?.data || wishlistItems?.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Heart className="w-16 h-16 stroke-1 mb-4" />
        <h2 className="text-xl font-light">لیست علاقه‌مندی‌ها خالی است</h2>
        <p className="text-sm mt-2">محصولات مورد علاقه خود را ذخیره کنید</p>
        <Link href="/products">
          <Button variant="dark" className="mt-4">
            مشاهده محصولات
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-light tracking-wide">علاقه‌مندی‌ها</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {wishlistItems?.data.map(item => (
          <ProductCard
            key={item.id}
            image={item.product.image}
            price={item.product.variants?.[0]?.price}
            slug={item.product.slug}
            title={item.product.title}
          />
        ))}
      </div>
    </div>
  );
}
