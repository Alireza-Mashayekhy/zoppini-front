import { ProductsResponse } from '@/services/features/products/type';
import { UserResponse } from '@/services/features/users/types';

import { CategoriesResponse } from '../categories/types';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum DiscountKind {
  SALE = 'sale',
  CODE = 'code',
}

export interface Discount {
  id: number;
  kind: DiscountKind;

  title: string | null;

  code: string | null;
  type: DiscountType;
  value: number;

  maxDiscountAmount: number | null;
  minOrderAmount: number | null;

  maxUsesPerUser: number | null;
  maxTotalUses: number | null;
  excludeSaleItems: boolean;

  isActive: boolean;

  startsAt: string;
  expiresAt: string;

  usersCount?: number;
  productsCount?: number;
  categoriesCount?: number;
  excludedProductsCount?: number;
  excludedCategoriesCount?: number;
  usedCount?: number;

  users?: UserResponse[];

  products?: ProductsResponse[];
  categories?: CategoriesResponse[];
  excludedProducts?: ProductsResponse[];
  excludedCategories?: CategoriesResponse[];

  createdAt: string;
  updatedAt: string;
}

export interface ProductDiscount {
  code: string | null;
  title?: string | null;
  discountAmount: number;
  finalPrice: number;
  id: number;
  maxDiscountAmount: number | null;
  originalPrice: number;
  type: DiscountType;
  value: number;
  expiresAt?: string;
}

export interface CreateDiscountDto {
  kind?: DiscountKind;

  title?: string;
  code?: string;

  type: DiscountType;

  value: number;

  maxDiscountAmount?: number;
  minOrderAmount?: number;

  startsAt: string;
  expiresAt: string;

  isActive?: boolean;

  maxUsesPerUser?: number | null;
  maxTotalUses?: number | null;
  excludeSaleItems?: boolean;

  userIds?: number[];
  excludedProductIds?: number[];
  excludedCategoryIds?: number[];

  productIds?: number[];
  categoryIds?: number[];
}

export type UpdateDiscountDto = Partial<Omit<CreateDiscountDto, 'kind'>>;

export interface ApplyDiscountDto {
  code: string;
}

export interface ApplyDiscountResponse {
  discount: { code: string; id: number; type: string; value: number };
  summary: {
    /** مجموع تخفیف‌ها (فروش ویژه + کد) */
    discountPrice: number;
    saleDiscountPrice?: number;
    codeDiscountPrice?: number;
    finalPrice: number;
    originalPrice: number;
  };
}
