import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addImages,
  adminColorsList,
  adminProductsList,
  adminSizeList,
  colorsList,
  createColor,
  createProduct,
  createSize,
  deleteImage,
  deleteProduct,
  editProduct,
  productsList,
  siezList,
  updateSuggestedProducts,
} from './api';
import { CreateColorDto, CreateSizeDto } from './type';

export const useColorsList = () => {
  return useQuery({
    queryKey: ['colors'],
    queryFn: () => colorsList(),
  });
};

export const useSizeList = () => {
  return useQuery({
    queryKey: ['sizes'],
    queryFn: () => siezList(),
  });
};

export const useProducsList = (query: {
  page?: number;
  search?: string;
  limit?: number;
  all: boolean;
}) => {
  return useQuery({
    queryKey: ['products', { ...query }],
    queryFn: () => productsList(query),
  });
};

//admin

export const useAdminColorsList = () => {
  return useQuery({
    queryKey: ['colors'],
    queryFn: () => adminColorsList(),
  });
};

export const useAdminSizeList = () => {
  return useQuery({
    queryKey: ['sizes'],
    queryFn: () => adminSizeList(),
  });
};

export const useAdminProducsList = (query: {
  page?: number;
  search?: string;
  all: boolean;
}) => {
  return useQuery({
    queryKey: ['products', { ...query }],
    queryFn: () => adminProductsList(query),
  });
};

export function useCreateColor() {
  return useMutation({
    mutationFn: (formData: CreateColorDto) => createColor(formData),
  });
}

export function useCreateSize() {
  return useMutation({
    mutationFn: (formData: CreateSizeDto) => createSize(formData),
  });
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: (formData: FormData) => createProduct(formData),
  });
}

export function useEditProduct() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      editProduct(id, data),
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteProduct(id),
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

export const useUpdateSuggestedProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      suggestedProductsIds,
    }: {
      productId: number;
      suggestedProductsIds: number[];
    }) => updateSuggestedProducts(productId, suggestedProductsIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
