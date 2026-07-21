import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import {
  AddImagesDto,
  ColorResponse,
  CreateColorDto,
  CreateFeaturedProductDto,
  CreateSizeDto,
  FeaturedProductResponse,
  ProductsResponse,
  SizeResponse,
} from './type';

export async function colorsList() {
  const { data } = await api.get<ApiListResponse<ColorResponse>>(
    endpoints.products.colorList,
  );

  return data;
}

export async function siezList() {
  const { data } = await api.get<ApiListResponse<SizeResponse>>(
    endpoints.products.sizeList,
  );

  return data;
}

export async function productsList(query: {
  page?: number;
  search?: string;
  all?: boolean;
}) {
  const { data } = await api.get<ApiListResponse<ProductsResponse>>(
    endpoints.products.list,
    {
      params: query,
    },
  );

  return data;
}

// admin
export async function adminColorsList() {
  const { data } = await api.get<ApiListResponse<ColorResponse>>(
    endpoints.products.adminColorList,
  );

  return data;
}

export async function createColor(formData: CreateColorDto) {
  const { data } = await api.post<ApiSingleResponse<ColorResponse>>(
    endpoints.products.createColor,
    formData,
  );

  return data;
}

export async function adminSizeList() {
  const { data } = await api.get<ApiListResponse<SizeResponse>>(
    endpoints.products.adminSizeList,
  );

  return data;
}

export async function createSize(formData: CreateSizeDto) {
  const { data } = await api.post<ApiSingleResponse<SizeResponse>>(
    endpoints.products.createSize,
    formData,
  );

  return data;
}

export async function adminProductsList(query: {
  page?: number;
  search?: string;
  all?: boolean;
}) {
  const { data } = await api.get<ApiListResponse<ProductsResponse>>(
    endpoints.products.adminList,
    {
      params: query,
    },
  );

  return data;
}

export async function createProduct(formData: FormData) {
  const { data } = await api.post<ApiSingleResponse<ProductsResponse>>(
    endpoints.products.create,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return data;
}

export async function editProduct(id: number, formData: FormData) {
  const url = endpoints.products.edit(id);

  const { data } = await api.patch<ApiSingleResponse<ProductsResponse>>(
    url,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return data;
}

export async function deleteProduct(id: number) {
  const url = endpoints.products.delete(id);
  const { data } = await api.delete(url);
  return data;
}

export async function addImages(id: number, formData: FormData) {
  const url = endpoints.products.addColorImage(id);
  const { data } = await api.post<ApiSingleResponse<AddImagesDto>>(
    url,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function deleteImage(id: number) {
  const url = endpoints.products.deleteColorImage(id);
  const { data } = await api.delete(url);
  return data;
}

export async function updateSuggestedProducts(
  id: number,
  suggestedIds: number[],
) {
  const url = endpoints.products.suggestedProducts(id);
  const { data } = await api.patch(url, { suggestedProductIds: suggestedIds });
  return data;
}

export const getFeaturedProducts = async (query: {
  all?: boolean;
}): Promise<ApiListResponse<FeaturedProductResponse>> => {
  const { data } = await api.get(endpoints.products.featured, {
    params: query,
  });
  return data;
};

export const createFeaturedProduct = async (
  dto: CreateFeaturedProductDto,
): Promise<ApiSingleResponse<FeaturedProductResponse>> => {
  const { data } = await api.post(endpoints.products.adminFeatured, dto);
  return data;
};

export const deleteFeaturedProduct = async (id: number): Promise<void> => {
  const url = endpoints.products.removeFeatured(id);
  await api.delete(url);
};

export const getStyleProducts = async (): Promise<
  ApiListResponse<FeaturedProductResponse>
> => {
  const { data } = await api.get(endpoints.products.style);
  return data;
};

export const createStyleProduct = async (
  dto: CreateFeaturedProductDto,
): Promise<ApiSingleResponse<FeaturedProductResponse>> => {
  const { data } = await api.post(endpoints.products.adminStyle, dto);
  return data;
};

export const deleteStyleProduct = async (id: number): Promise<void> => {
  const url = endpoints.products.removeStyle(id);
  await api.delete(url);
};

export async function updateSameColorProducts(
  id: number,
  productIds: number[],
) {
  const url = endpoints.products.sameColorProducts(id);
  const { data } = await api.patch(url, { productIds });
  return data;
}
