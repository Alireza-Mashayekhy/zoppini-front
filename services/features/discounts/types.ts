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

  /**
   * تخفیف متوالی: این فروش ویژه به‌عنوان یک مرحله روی مبلغ باقی‌ماندهٔ
   * تخفیف‌های قبلی اعمال می‌شود (نه روی قیمت اولیه).
   */
  stackable: boolean;

  /** ترتیب مرحله؛ عدد کوچک‌تر زودتر اعمال می‌شود (۰ تا ۱۰۰۰) */
  stackPriority: number;

  /** اعمال روی همهٔ محصولات بدون انتخاب دستی */
  appliesToAllProducts: boolean;

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

export interface ProductDiscountStage {
  discountId: number;
  title: string | null;
  type: DiscountType;
  value: number;
  maxDiscountAmount: number | null;
  discountAmount: number;
  priceBefore: number;
  priceAfter: number;
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
  /** مراحل تخفیف متوالی؛ برای تک‌مرحله‌ای آرایهٔ یک‌عضوی است */
  stages?: ProductDiscountStage[];
  /** true اگر بیش از یک مرحله اعمال شده باشد */
  stacked?: boolean;
  /** درصد تخفیف مؤثر پس از همهٔ مراحل (مرجع: سرور) */
  effectivePercent?: number;
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

  /** تخفیف متوالی (فقط فروش ویژه) */
  stackable?: boolean;

  /** ترتیب مرحله؛ عدد کوچک‌تر زودتر اعمال می‌شود */
  stackPriority?: number;

  /** اعمال روی همهٔ محصولات */
  appliesToAllProducts?: boolean;
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
