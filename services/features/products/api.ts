import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import {
  AddImagesDto,
  ColorResponse,
  createApiProductDto,
  CreateColorDto,
  CreateSizeDto,
  ProductsResponse,
  SizeResponse,
} from './type';

export async function colorsList() {
  const { data } = await api.get<ApiListResponse<ColorResponse>>(
    endpoints.products.colorList,
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

export async function siezList() {
  const { data } = await api.get<ApiListResponse<SizeResponse>>(
    endpoints.products.sizeList,
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

export async function createProduct(formData: createApiProductDto) {
  const { data } = await api.post<ApiSingleResponse<ProductsResponse>>(
    endpoints.products.create,
    formData,
  );

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
