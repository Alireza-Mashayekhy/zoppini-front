import { ProductsResponse, VariantResponse } from '../products/type';

export interface CartItem {
  id: number;
  quantity: number;
  variant: VariantResponse & { product: ProductsResponse };
}

export interface CartResponse {
  id: number;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartDto {
  variantId: number;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}
