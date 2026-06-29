import { ProductsResponse } from '../products/type';

export interface WishlistItem {
  id: number;
  product: ProductsResponse;
  createdAt: string;
}

export interface WishlistCheckResponse {
  isInWishlist: boolean;
}

export interface WishlistCountResponse {
  count: number;
}

export interface AddToWishlistDto {
  productId: number;
}
