'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateColor } from '@/services/features/products/hooks';
import { ColorResponse } from '@/services/features/products/type';

import FormProvider from '../form/form-provider';
import RHFInput from '../form/rhf-input';
import { Button } from '../ui/button';

interface ColorModalProps {
  selectedData: ColorResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const schema = z.object({
  name: z.string().nonempty('نام رنگ اجباری است'),
  hexCode: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6})$/,
      'کد هگز باید شامل ۶ کاراکتر باشد (مثال: #FF5733)',
    )
    .nonempty('کد هگز اجباری است'),
});

type FormData = z.infer<typeof schema>;

export default function ColorModal({
  selectedData,
  open,
  onOpenChange,
}: ColorModalProps) {
  const queryClient = useQueryClient();
  const updateColorMutation = useUpdateColor();

  const methods = useForm<FormData>({
    defaultValues: {
      name: '',
      hexCode: '#000000',
    },
    resolver: zodResolver(schema),
  });

  const { reset, setValue, watch } = methods;

  const hexCode = watch('hexCode');

  useEffect(() => {
    if (selectedData) {
      reset({
        name: selectedData.name,
        hexCode: selectedData.hexCode,
      });
    } else {
      reset({
        name: '',
        hexCode: '#000000',
      });
    }
  }, [selectedData, reset]);

  const onSubmit = async (data: FormData) => {
    if (!selectedData) return;
    try {
      await updateColorMutation.mutateAsync({
        id: selectedData.id,
        data: {
          name: data.name,
          hexCode: data.hexCode,
        },
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['colors'] });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ویرایش رنگ</DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <RHFInput
              name="name"
              label="نام رنگ"
              isRequired
              placeholder="مثال: قرمز"
            />

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <RHFInput
                  name="hexCode"
                  label="کد هگز"
                  isRequired
                  placeholder="#FF5733"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">انتخاب رنگ</label>
                <input
                  type="color"
                  value={hexCode || '#000000'}
                  onChange={e => setValue('hexCode', e.target.value)}
                  className="w-12 h-12 border rounded-md cursor-pointer"
                />
              </div>
            </div>

            <Button
              type="submit"
              loading={updateColorMutation.isPending}
              className="w-full"
            >
              ذخیره تغییرات
            </Button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
