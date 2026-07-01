import {
  ColorResponse,
  ProductsResponse,
  SizeResponse,
} from '../products/type';

export enum ShippingMethod {
  POST = 'post',
  COURIER = 'courier',
  TIBAX = 'tibax',
}

export interface CreateOrderDto {
  addressId: number;
  note?: string;
  discount?: number;
  shippingMethod: ShippingMethod;
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
  status: OrderStatus;
  shippingAddress?: string;
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
