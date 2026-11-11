import { ProductsResponse, VariantResponse } from '../products/type';
import {
  CartLinePromotion,
  CartPromotionsState,
} from '../promotions/types';

export interface CartItem {
  id: number;
  quantity: number;
  variant: VariantResponse & {
    product: ProductsResponse;
    /** قیمت قابل پرداخت هر واحد پس از فروش ویژه و پروموشن */
    payablePrice?: number;
  };
  /** وضعیت تخفیف پروموشن این ردیف (از سرور) */
  promotion?: CartLinePromotion;
  payablePrice?: number;
  payableTotal?: number;
  /** اگر ردیف هدیهٔ رایگان باشد */
  freeReason?: string;
  freePromotionId?: number | null;
}

export interface CartResponse {
  id: number;
  items: CartItem[];
  pricing: {
    /** جمع قیمت فهرست */
    originalPrice: number;
    /** تخفیف فروش ویژه + کد */
    discountPrice: number;
    /** تخفیف پروموشن‌ها (جدا از فروش ویژه) */
    promotionDiscountPrice?: number;
    /** ارزش کالاهای رایگان */
    freeItemValue?: number;
    finalPrice: number;
    savingsTotal?: number;
    freeShipping?: boolean;
  };
  /** پروموشن‌های اعمال‌شده و پیشنهادهای فعال */
  promotions?: CartPromotionsState;
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
