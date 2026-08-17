import { CategoriesResponse } from '../categories/types';
import { ProductDiscount } from '../discounts/types';
import { UserResponse } from '../users/types';

export interface ColorResponse {
  id: number;
  name: string;
  hexCode: string;
}

export interface CreateColorDto {
  name: string;
  hexCode: string;
}

export interface SizeResponse {
  id: number;
  name: string;
}

export interface CreateSizeDto {
  name: string;
}

export interface VariantResponse {
  id: number;
  price: number;
  stock: number;
  sku?: string;
  discountedPrice?: number;
  color: ColorResponse;
  size: SizeResponse;
  product?: ProductsResponse;
}

export interface CommentResponse {
  id: number;
  text: string;
  rating: number;
  createdAt: string;
  user: UserResponse;
}

export interface ColorImageResponse {
  id: number;
  url: string;
  order: number;
  color: {
    hexCode: string;
    id: number;
    name: string;
  };
}

export interface ProductsResponse {
  id: number;
  productCode: string;
  title: string;
  slug: string;
  image: string;
  description: string;
  discount?: ProductDiscount;
  careInstructionsHtml: string;
  createdAt: string;
  updatedAt: string;
  suggestedProducts: ProductsResponse[];
  categories: CategoriesResponse[];
  variants: VariantResponse[];
  comments: CommentResponse[];
  colorImages: ColorImageResponse[];
  sameColorProducts: ProductsResponse[];
}

export interface ProductResponse {
  product: ProductsResponse;
  relatedProducts: ProductsResponse[];
}

export interface createProductDto {
  id?: string;
  image: File;
  productCode: string;
  title: string;
  description: string;
  slug: string;
  careInstructionsHtml: string;
  categories: string[];
  colorId: string[];
  sizeId: string[];
}

export interface createApiProductDto {
  id?: string;
  careInstructionsHtml: string;
  categoryIds: number[];
  productCode: string;
  description: string;
  title: string;
  slug: string;
  variants: {
    colorId: number;
    sizeId: number;
    price: number;
  }[];
}

export interface AddImagesDto {
  colorIds: number[];
  files: File[];
}

export interface FeaturedProductResponse {
  id: number;
  productId: number;
  colorId: number;
  order: number;
  faTitle: string;
  enTitle: string;
  product: {
    id: number;
    title: string;
    slug: string;
    productCode: string;
    description: string;
    variants: any[];
    colorImages: ProductColorImage[];
  };
  color: {
    id: number;
    name: string;
    hexCode: string;
  };
}

export interface CreateFeaturedProductDto {
  productId: number;
  colorId: number;
  order?: number;
}

export interface CreateStyleProductDto {
  productId: number;
  colorId: number;
  faTitle: string;
  enTitle: string;
}

export interface ProductColorImage {
  id: number;
  url: string;
  order: number;
  color: {
    id: number;
    name: string;
    hexCode: string;
  };
}
