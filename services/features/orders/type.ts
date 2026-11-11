import {
  ColorResponse,
  ProductsResponse,
  SizeResponse,
} from '../products/type';
import {
  PromotionEvaluationView,
  PromotionSuggestionView,
} from '../promotions/types';

export enum ShippingMethod {
  POST = 'post',
  COURIER = 'courier',
  TIBAX = 'tibax',
  PICKUP = 'pickup',
}

export interface CreateOrderDto {
  addressId?: number;
  note?: string;
  discountCode?: string;
  shippingMethod: ShippingMethod;
  useWallet?: boolean;
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  totalPrice: number;
  variant: {
    id: number;
    price: number;
    sku?: string;
    color: ColorResponse;
    size: SizeResponse;
    product: ProductsResponse;
  };
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  totalPrice: number;
  shippingCost: number;
  discount: number;
  finalPrice: number;
  walletPayment?: string;
  status: OrderStatus;
  shippingAddress?: string;
  shippingMethod?: ShippingMethod | null;
  phone?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: {
    id: number;
    fullName: string;
    phone: string;
  };
}

/** یک ردیف سبد در پیش‌نمایش چک‌اوت (مبالغ پس از فروش ویژه و پروموشن) */
export interface CheckoutPreviewLine {
  lineId: number;
  variantId: number;
  productId: number;
  title: string;
  slug: string;
  image: string | null;
  colorName: string | null;
  sizeName: string | null;
  quantity: number;
  originalPrice: number;
  salePrice: number;
  promotionDiscount: number;
  isFreeReward: boolean;
  promotionRewardId: number | null;
  promotionLabel: string | null;
  promotionIds: number[];
}

/**
 * پاسخ پیش‌نمایش چک‌اوت.
 * مجموع‌ها با همان موتور و همان قواعدی محاسبه می‌شوند که هنگام ثبت سفارش،
 * بنابراین عددی که مشتری می‌بیند همان عددی است که پرداخت می‌کند.
 */
export interface CheckoutPreviewResponse {
  data: {
    lines: CheckoutPreviewLine[];
    promotions: {
      applied: PromotionEvaluationView[];
      rejected: PromotionEvaluationView[];
      notices: string[];
      suggestions: PromotionSuggestionView[];
    };
    totals: {
      originalPrice: number;
      saleDiscount: number;
      promotionDiscount: number;
      freeItemValue: number;
      shippingCost: number;
      freeShipping: boolean;
      finalPrice: number;
    };
  };
}
