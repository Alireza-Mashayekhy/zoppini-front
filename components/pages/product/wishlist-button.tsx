// components/pages/product/wishlist-button.tsx
'use client';

import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
    console.log(isInWishlist);
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
    <Button
      onClick={handleToggle}
      disabled={isLoading || isLocalLoading}
      variant="darkOutline"
      className="flex h-[48px] aspect-square"
    >
      <Heart
        className={cn(
          'w-5! h-5! transition-colors',
          isInWishlist
            ? 'fill-red-500 text-red-500'
            : 'fill-none text-gray-800 ',
        )}
      />
    </Button>
  );
}
