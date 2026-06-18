import { useMutation, useQuery } from '@tanstack/react-query';

import {
  addImages,
  colorsList,
  createColor,
  createProduct,
  createSize,
  deleteImage,
  productsList,
  siezList,
} from './api';
import { createApiProductDto, CreateColorDto, CreateSizeDto } from './type';

export const useColorsList = () => {
  return useQuery({
    queryKey: ['colors'],
    queryFn: () => colorsList(),
  });
};

export function useCreateColor() {
  return useMutation({
    mutationFn: (formData: CreateColorDto) => createColor(formData),
  });
}

export const useSizeList = () => {
  return useQuery({
    queryKey: ['sizes'],
    queryFn: () => siezList(),
  });
};

export function useCreateSize() {
  return useMutation({
    mutationFn: (formData: CreateSizeDto) => createSize(formData),
  });
}

export const useProducsList = (query: {
  page?: number;
  search?: string;
  all: boolean;
}) => {
  return useQuery({
    queryKey: ['products', { ...query }],
    queryFn: () => productsList(query),
  });
};

export function useCreateProduct() {
  return useMutation({
    mutationFn: (formData: createApiProductDto) => createProduct(formData),
  });
}

export function useAddImages() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      addImages(id, data),
  });
}

export function useDeleteImage() {
  return useMutation({
    mutationFn: (id: number) => deleteImage(id),
  });
}
