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
import { useUpdateSize } from '@/services/features/products/hooks';
import { SizeResponse } from '@/services/features/products/type';

import FormProvider from '../form/form-provider';
import RHFInput from '../form/rhf-input';
import { Button } from '../ui/button';

interface SizeModalProps {
  selectedData: SizeResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const schema = z.object({
  name: z.string().nonempty('نام سایز اجباری است'),
});

type FormData = z.infer<typeof schema>;

export default function SizeModal({
  selectedData,
  open,
  onOpenChange,
}: SizeModalProps) {
  const queryClient = useQueryClient();
  const updateSizeMutation = useUpdateSize();

  const methods = useForm<FormData>({
    defaultValues: {
      name: '',
    },
    resolver: zodResolver(schema),
  });

  const { reset } = methods;

  useEffect(() => {
    if (selectedData) {
      reset({
        name: selectedData.name,
      });
    } else {
      reset({
        name: '',
      });
    }
  }, [selectedData, reset]);

  const onSubmit = async (data: FormData) => {
    if (!selectedData) return;
    try {
      await updateSizeMutation.mutateAsync({
        id: selectedData.id,
        data: { name: data.name },
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ویرایش سایز</DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <RHFInput
              name="name"
              label="نام سایز"
              isRequired
              placeholder="مثال: XL"
            />
            <Button
              type="submit"
              loading={updateSizeMutation.isPending}
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
