// components/pages/product/wishlist-button.tsx
'use client';

import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { productActionButtonClass } from '@/components/shared/product-action-button';
import { cn } from '@/lib/utils';
import {
  useAddToWishlist,
  useCheckWishlist,
  useRemoveFromWishlist,
} from '@/services/features/wishlist/hooks';
import { useAuthStore } from '@/store/auth.store';

interface WishlistButtonProps {
  productId: number;
}

export default function WishlistButton({ productId }: WishlistButtonProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const { data: isInWishlist, isLoading } = useCheckWishlist(productId);
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const handleToggle = async () => {
    if (!user) {
      toast.info('برای افزودن به علاقه‌مندی‌ها وارد شوید');
      router.push('/login');
      return;
    }

    if (isLoading || isLocalLoading) return;

    setIsLocalLoading(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist.mutateAsync(productId);
      } else {
        await addToWishlist.mutateAsync(productId);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLocalLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading || isLocalLoading}
      aria-label={
        isInWishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'
      }
      title={
        isInWishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'
      }
      aria-pressed={Boolean(isInWishlist)}
      className={cn(
        productActionButtonClass,
        isInWishlist && 'border-rose-200 text-rose-600',
      )}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-colors',
          isInWishlist
            ? 'fill-rose-500 text-rose-500'
            : 'fill-none text-gray-700',
        )}
        aria-hidden="true"
      />
    </button>
  );
}
