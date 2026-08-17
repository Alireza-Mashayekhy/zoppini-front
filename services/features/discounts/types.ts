import { CategoriesResponse } from '@/services/features/categories/types';
import { ProductsResponse } from '@/services/features/products/type';
import { UserResponse } from '@/services/features/users/types';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface Discount {
  id: number;
  code: string;

  type: DiscountType;
  value: number;

  maxDiscountAmount: number | null;
  minOrderAmount: number | null;

  isActive: boolean;

  startsAt: string;
  expiresAt: string;

  users?: CategoriesResponse[];
  products?: ProductsResponse[];
  categories?: UserResponse[];

  createdAt: string;
  updatedAt: string;
}

export interface ProductDiscount {
  code: string;
  discountAmount: number;
  finalPrice: number;
  id: number;
  maxDiscountAmount: number | null;
  originalPrice: number;
  type: DiscountType;
  value: number;
}

export interface CreateDiscountDto {
  code: string;

  type: DiscountType;

  value: number;

  maxDiscountAmount?: number;
  minOrderAmount?: number;

  startsAt: string;
  expiresAt: string;

  isActive?: boolean;

  userIds?: number[];
  productIds?: number[];
  categoryIds?: number[];
}

export type UpdateDiscountDto = Partial<CreateDiscountDto>;

export interface ApplyDiscountDto {
  code: string;
}

export interface ApplyDiscountResponse {
  discount: { code: string; id: number; type: string; value: number };
  summary: { discountPrice: number; finalPrice: number; originalPrice: number };
}
