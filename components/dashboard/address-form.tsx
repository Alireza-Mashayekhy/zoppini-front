'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import FormProvider from '@/components/form/form-provider';
import RHFInput from '@/components/form/rhf-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateAddress,
  useUpdateAddress,
} from '@/services/features/addresses/hooks';
import { AddressResponse } from '@/services/features/addresses/types';
import { useCities, useProvinces } from '@/services/features/locations/hooks';

const addressSchema = z.object({
  provinceId: z.number(),
  cityId: z.number(),
  address: z.string(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  open: boolean;
  onClose: () => void;
  initialData?: AddressResponse | null;
}

export default function AddressForm({
  open,
  onClose,
  initialData,
}: AddressFormProps) {
  const [selectedProvinceId, setSelectedProvinceId] = useState<
    number | undefined
  >();
  const { data: provinces } = useProvinces();
  const { data: cities } = useCities(selectedProvinceId || 0);

  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const isEditing = !!initialData;

  const methods = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      provinceId: 0,
      cityId: 0,
      address: '',
      postalCode: '',
      isDefault: false,
    },
  });

  const { reset, watch, setValue } = methods;
  const watchedProvinceId = watch('provinceId');

  useEffect(() => {
    if (watchedProvinceId) {
      setSelectedProvinceId(watchedProvinceId);
      setValue('cityId', 0);
    }
  }, [watchedProvinceId, setValue]);

  useEffect(() => {
    if (initialData) {
      reset({
        provinceId: initialData.provinceId,
        cityId: initialData.cityId,
        address: initialData.address,
        postalCode: initialData.postalCode || '',
        isDefault: initialData.isDefault || false,
      });
      setSelectedProvinceId(initialData.provinceId);
    } else {
      reset({
        provinceId: 0,
        cityId: 0,
        address: '',
        postalCode: '',
        isDefault: false,
      });
      setSelectedProvinceId(undefined);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: AddressFormData) => {
    console.log(data);
    try {
      if (isEditing && initialData) {
        await updateAddress.mutateAsync({
          id: initialData.id,
          data,
        });
      } else {
        await createAddress.mutateAsync(data);
      }
      onClose();
    } catch {
      // error handled in hooks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
          </DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">استان</label>
              <Select
                value={String(watch('provinceId'))}
                onValueChange={value => setValue('provinceId', Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب استان..." />
                </SelectTrigger>
                <SelectContent>
                  {provinces?.data?.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">شهر</label>
              <Select
                value={String(watch('cityId'))}
                onValueChange={value => setValue('cityId', Number(value))}
                disabled={!watch('provinceId')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب شهر..." />
                </SelectTrigger>
                <SelectContent>
                  {cities?.data?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <RHFInput name="address" label="آدرس کامل" />
            <RHFInput name="postalCode" label="کد پستی (اختیاری)" />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                {...methods.register('isDefault')}
                className="w-4 h-4"
              />
              <label htmlFor="isDefault" className="text-sm">
                آدرس پیش‌فرض
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                انصراف
              </Button>
              <Button
                type="submit"
                variant="dark"
                loading={createAddress.isPending || updateAddress.isPending}
              >
                {isEditing ? 'ویرایش' : 'افزودن'}
              </Button>
            </div>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
