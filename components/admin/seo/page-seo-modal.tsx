'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useCreatePageSeo,
  useUpdatePageSeo,
} from '@/services/features/seo/hooks';
import { PageSeoResponse } from '@/services/features/seo/types';

import FormProvider from '../../form/form-provider';
import RHFInput from '../../form/rhf-input';
import RHFTextArea from '../../form/rhf-textarea';
import { Button } from '../../ui/button';

const schema = z.object({
  path: z
    .string()
    .trim()
    .min(1, 'مسیر صفحه اجباری است')
    .refine(value => value.startsWith('/'), 'مسیر باید با / شروع شود'),
  label: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function PageSeoModal({
  selectedData,
  open,
  onOpenChange,
}: {
  selectedData: PageSeoResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useCreatePageSeo();
  const updateMutation = useUpdatePageSeo();

  const isEdit = !!selectedData;

  const methods = useForm<FormData>({
    defaultValues: {
      path: '',
      label: '',
      metaTitle: '',
      metaDescription: '',
    },
    resolver: zodResolver(schema),
  });

  const { reset, control } = methods;

  const metaTitle = useWatch({ control, name: 'metaTitle' }) || '';
  const metaDescription = useWatch({ control, name: 'metaDescription' }) || '';

  useEffect(() => {
    if (selectedData) {
      reset({
        path: selectedData.path,
        label: selectedData.label || '',
        metaTitle: selectedData.metaTitle || '',
        metaDescription: selectedData.metaDescription || '',
      });
    } else {
      reset({ path: '', label: '', metaTitle: '', metaDescription: '' });
    }
  }, [selectedData, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      path: data.path.trim(),
      label: data.label?.trim() || '',
      metaTitle: data.metaTitle?.trim() || '',
      metaDescription: data.metaDescription?.trim() || '',
    };

    try {
      if (isEdit && selectedData) {
        await updateMutation.mutateAsync({ id: selectedData.id, dto: payload });
        toast.success('متای صفحه ذخیره شد');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('صفحه به لیست سئو اضافه شد');
      }

      onOpenChange(false);
    } catch (error) {
      // پیام خطای بک‌اند (مثل مسیر تکراری) را به کاربر نشان می‌دهیم
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;

      toast.error(message || 'ذخیره‌ی متا ناموفق بود');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'ویرایش متای صفحه' : 'افزودن صفحه‌ی جدید'}
          </DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 py-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
              مسیر صفحه باید دقیقاً مثل آدرس آن در سایت باشد (مثل
              <span dir="ltr" className="mx-1 font-mono">
                /about-us
              </span>
              ). اگر متا خالی بماند، متادیتای پیش‌فرض خود صفحه نمایش داده
              می‌شود.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <RHFInput
                label="مسیر صفحه"
                name="path"
                isRequired
                dir="ltr"
                placeholder="/about-us"
              />
              <RHFInput label="نام صفحه" name="label" placeholder="درباره ما" />
            </div>

            <div>
              <RHFInput
                label="متا تایتل"
                name="metaTitle"
                placeholder="مثال: درباره ما - زوپینی"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {metaTitle.length} کاراکتر (پیشنهاد: حداکثر ۶۰ کاراکتر)
              </p>
            </div>

            <div>
              <RHFTextArea
                label="متا دیسکریپشن"
                name="metaDescription"
                rows={3}
                placeholder="توضیح کوتاه و جذاب درباره‌ی این صفحه"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {metaDescription.length} کاراکتر (پیشنهاد: حداکثر ۱۶۰ کاراکتر)
              </p>
            </div>

            <Button
              type="submit"
              loading={isSaving}
              size="lg"
              variant="dark"
              className="w-full"
            >
              {isEdit ? 'ذخیره تغییرات' : 'افزودن صفحه'}
            </Button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
