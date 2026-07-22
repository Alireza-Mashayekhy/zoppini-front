import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  addImages,
  adminColorsList,
  adminProductsList,
  adminSizeList,
  colorsList,
  createColor,
  createFeaturedProduct,
  createProduct,
  createSize,
  createStyleProduct,
  deleteColor,
  deleteFeaturedProduct,
  deleteImage,
  deleteProduct,
  deleteSize,
  deleteStyleProduct,
  editProduct,
  getFeaturedProducts,
  getStyleProducts,
  productsList,
  siezList,
  updateColor,
  updateSameColorProducts,
  updateSize,
  updateSuggestedProducts,
} from './api';
import {
  CreateColorDto,
  CreateFeaturedProductDto,
  CreateSizeDto,
} from './type';

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

export const useAdminColorsList = (query?: {
  page?: number;
  search?: string;
  all: boolean;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['colors'],
    queryFn: () => adminColorsList(query),
  });
};

export const useAdminSizeList = (query?: {
  page?: number;
  search?: string;
  all: boolean;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['sizes'],
    queryFn: () => adminSizeList(query),
  });
};

export const useAdminProducsList = (query: {
  page?: number;
  search?: string;
  all: boolean;
  limit?: number;
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

export const useFeaturedProducts = (query: { all?: boolean }) => {
  return useQuery({
    queryKey: ['featured-products', { ...query }],
    queryFn: () => getFeaturedProducts(query),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateFeaturedProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFeaturedProductDto) => createFeaturedProduct(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      toast.success('محصول با موفقیت به لیست ویژه اضافه شد');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در افزودن محصول ویژه');
    },
  });
};

export const useDeleteFeaturedProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFeaturedProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      toast.success('محصول از لیست ویژه حذف شد');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در حذف محصول ویژه');
    },
  });
};

export const useStyleProducts = () => {
  return useQuery({
    queryKey: ['style-products'],
    queryFn: getStyleProducts,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateStyleProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFeaturedProductDto) => createStyleProduct(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-products'] });
      toast.success('محصول با موفقیت به لیست استایل اضافه شد');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'خطا در افزودن محصول استایل',
      );
    },
  });
};

export const useDeleteStyleProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteStyleProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-products'] });
      toast.success('محصول از لیست استایل حذف شد');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در حذف محصول ویژه');
    },
  });
};

export const useUpdateSameColorProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      productIds,
    }: {
      productId: number;
      productIds: number[];
    }) => updateSameColorProducts(productId, productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('محصولات هم‌رنگ با موفقیت به‌روزرسانی شدند');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'خطا در به‌روزرسانی محصولات هم‌رنگ',
      );
    },
  });
};

export function useUpdateColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; hexCode?: string };
    }) => updateColor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] });
      toast.success('رنگ با موفقیت ویرایش شد');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در ویرایش رنگ');
    },
  });
}

export function useDeleteColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteColor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] });
      toast.success('رنگ با موفقیت حذف شد');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در حذف رنگ');
    },
  });
}

export function useUpdateSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string } }) =>
      updateSize(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
      toast.success('سایز با موفقیت ویرایش شد');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در ویرایش سایز');
    },
  });
}

export function useDeleteSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSize(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
      toast.success('سایز با موفقیت حذف شد');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در حذف سایز');
    },
  });
}
