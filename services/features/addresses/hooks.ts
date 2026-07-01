import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from './api';
import { CreateAddressDto, UpdateAddressDto } from './types';

export const useAddresses = () => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAddressDto) => createAddress(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('آدرس با موفقیت اضافه شد');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'خطا در افزودن آدرس');
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAddressDto }) =>
      updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('آدرس با موفقیت ویرایش شد');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'خطا در ویرایش آدرس');
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('آدرس با موفقیت حذف شد');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'خطا در حذف آدرس');
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('آدرس پیش‌فرض با موفقیت تغییر کرد');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'خطا در تغییر آدرس پیش‌فرض');
    },
  });
};
