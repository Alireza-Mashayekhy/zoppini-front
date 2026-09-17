'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useCreateCategory,
  useUpdateCategory,
} from '@/services/features/categories/hooks';
import {
  CategoriesResponse,
  createCategoryDto,
} from '@/services/features/categories/types';

import FormProvider from '../form/form-provider';
import { RHFImageUploader } from '../form/rhf-image-uploader';
import RHFInput from '../form/rhf-input';
import {
  RHFSecondImagesUploader,
  SECOND_IMAGES_ACCEPTED_TYPES,
  SECOND_IMAGES_MAX_SIZE,
} from '../form/rhf-second-images-uploade';
import RHFSelect from '../form/rhf-select';
import RHFSwitch from '../form/rhf-switch';
import { RHFTextEditor } from '../form/rhf-text-editor';
import { Button } from '../ui/button';

export default function CategoriesModal({
  categories,
  selectedData,
  open,
  onOpenChange,
}: {
  categories: CategoriesResponse[];
  selectedData: CategoriesResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const isEdit = !!selectedData;

  // شمای اعتبارسنجی با فیلدهای order
  const schema = z
    .object({
      name: z.string().nonempty('این فیلد اجباری است'),
      image: selectedData
        ? z.any().optional()
        : z
            .instanceof(File, { message: 'عکس دسته بندی اجباری است' })
            .refine(file => file.size <= 5 * 1024 * 102, `حداکثر حجم 5MB`)
            .refine(
              file => ['image/webp'].includes(file.type),
              'فقط فرمت‌ webp مجازند',
            ),
      secondImages: z
        .array(
          z.union([
            z.string(),
            z
              .instanceof(File)
              .refine(
                file => file.size <= SECOND_IMAGES_MAX_SIZE,
                'حداکثر حجم هر عکس دوم ۲ مگابایت است',
              )
              .refine(
                file => SECOND_IMAGES_ACCEPTED_TYPES.includes(file.type),
                'فقط فرمت‌های jpeg / png / webp مجازند',
              ),
          ]),
        )
        .max(2, 'حداکثر ۲ تصویر دوم برای هر دسته‌بندی مجاز است.')
        .optional(),
      description: z.string().nonempty('این فیلد اجباری است'),
      slug: z.string().nonempty('این فیلد اجباری است'),
      parentId: z.string().nullable(),
      isInHeroSection: z.boolean(),
      isInHome: z.boolean(),
      isActive: z.boolean(),
      orderInHome: z.preprocess(
        val => (val === '' ? null : val),
        z.coerce.number().nullable().optional(),
      ),
      orderInHero: z.preprocess(
        val => (val === '' ? null : val),
        z.coerce.number().nullable().optional(),
      ),
    })
    .superRefine((data, ctx) => {
      // اگر isInHome فعال باشد، orderInHome اجباری است
      if (
        data.isInHome &&
        (data.orderInHome === null ||
          data.orderInHome === undefined ||
          data.orderInHome < 1)
      ) {
        ctx.addIssue({
          path: ['orderInHome'],
          message: 'وارد کردن ترتیب در صفحه اصلی اجباری است',
          code: 'custom',
        });
      }
      // اگر isInHeroSection فعال باشد، orderInHero اجباری است
      if (
        data.isInHeroSection &&
        (data.orderInHero === null ||
          data.orderInHero === undefined ||
          data.orderInHero < 1)
      ) {
        ctx.addIssue({
          path: ['orderInHero'],
          message: 'وارد کردن ترتیب در هیرو سکشن اجباری است',
          code: 'custom',
        });
      }
    });

  const methods = useForm({
    defaultValues: {
      name: '',
      image: undefined,
      secondImages: [] as (File | string)[],
      description: '',
      slug: '',
      parentId: '',
      isInHeroSection: false,
      isInHome: false,
      orderInHome: null,
      orderInHero: null,
      isActive: true,
    },
    resolver: zodResolver(schema),
  });

  const {
    reset,
    setValue,
    formState: { errors },
    watch,
  } = methods;

  // مشاهده مقادیر سوییچ‌ها برای نمایش شرطی فیلدهای order
  const isInHome = watch('isInHome');
  const isInHeroSection = watch('isInHeroSection');

  // نام فایل‌های تصویر دوم فعلی (از سرور) برای تشخیص تغییرات هنگام ویرایش
  const initialSecondImages = useMemo<string[]>(
    () => (selectedData ? (selectedData.secondImages ?? []) : []),
    [selectedData],
  );

  // آدرس کامل عکس‌های فعلی برای نمایش در آپلودر (حالت ویرایش)
  const secondImageDefaults = useMemo<string[]>(
    () =>
      initialSecondImages.map(
        filename => `${process.env.NEXT_PUBLIC_IMAGE_URL ?? ''}${filename}`,
      ),
    [initialSecondImages],
  );

  useEffect(() => {
    if (selectedData) {
      reset({
        name: selectedData.name,
        description: selectedData.description,
        slug: selectedData.slug,
        parentId: selectedData.parentId ? String(selectedData.parentId) : null,
        isInHeroSection: selectedData.isInHeroSection,
        isInHome: selectedData.isInHome,
        orderInHome: selectedData.orderInHome ?? null,
        orderInHero: selectedData.orderInHero ?? null,
        isActive: selectedData.isActive,
        secondImages: secondImageDefaults,
      });
    } else {
      reset({
        name: '',
        image: undefined,
        description: '',
        slug: '',
        parentId: '',
        isInHeroSection: false,
        isInHome: false,
        orderInHome: null,
        orderInHero: null,
        isActive: true,
        secondImages: [],
      });
    }
  }, [selectedData, reset, secondImageDefaults]);

  const onSubmit = async (data: createCategoryDto) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.image instanceof File) {
        formData.append('file', data.image);
      }
      formData.append('description', data.description);
      formData.append('slug', data.slug);
      formData.append('isInHeroSection', data.isInHeroSection.toString());
      formData.append('isInHome', data.isInHome.toString());
      formData.append('isActive', data.isActive?.toString() ?? 'true');
      if (data.parentId) formData.append('parentId', data.parentId);

      // اضافه کردن orderها (اگر مقدار دارند)
      if (data.orderInHome && data.orderInHome > 0) {
        formData.append('orderInHome', data.orderInHome.toString());
      }
      if (data.orderInHero && data.orderInHero > 0) {
        formData.append('orderInHero', data.orderInHero.toString());
      }

      const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_URL ?? '';
      const currentSecondImages = data.secondImages ?? [];

      const newSecondImageFiles = currentSecondImages.filter(
        (item): item is File => item instanceof File,
      );
      const keptSecondImageUrls = currentSecondImages.filter(
        (item): item is string => typeof item === 'string',
      );

      const keptFilenames = keptSecondImageUrls.map(url =>
        url.startsWith(imageBaseUrl) ? url.slice(imageBaseUrl.length) : url,
      );
      const isSecondImagesUnchanged =
        isEdit &&
        newSecondImageFiles.length === 0 &&
        keptFilenames.length === initialSecondImages.length &&
        initialSecondImages.every(filename => keptFilenames.includes(filename));

      if (!isSecondImagesUnchanged) {
        if (currentSecondImages.length === 0) {
          if (initialSecondImages.length > 0) {
            formData.append('removeSecondImages', 'true');
          }
        } else {
          for (const item of currentSecondImages) {
            if (item instanceof File) {
              formData.append('secondImages', item);
              continue;
            }

            try {
              const response = await fetch(item);
              if (!response.ok) throw new Error('fetch failed');
              const blob = await response.blob();
              const filename = item.split('/').pop() || 'second-image.jpg';
              formData.append(
                'secondImages',
                new File([blob], filename, { type: blob.type }),
              );
            } catch {
              toast.error(
                'خطا در بازخوانی عکس‌های فعلی برای ارسال مجدد. لطفاً همهٔ عکس‌های دوم را دوباره آپلود کنید.',
              );
              return;
            }
          }
        }
      }

      if (isEdit && selectedData.id) {
        await updateCategoryMutation.mutateAsync({
          id: selectedData.id,
          data: formData,
        });
        toast.success('دسته بندی ویرایش شد');
      } else {
        await createCategoryMutation.mutateAsync(formData);
        toast.success('دسته بندی ساخته شد');
      }
      onOpenChange(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error) {
      console.log(error);
      toast.error('خطا در ثبت دسته‌بندی');
    }
  };

  const items = [
    { text: 'بدون دسته بندی', value: 'null' },
    ...categories.map(cat => ({ text: cat.name, value: String(cat.id) })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>
        <Button size="lg" variant="dark">
          افزودن
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-full! h-full! rounded-none flex flex-col gap-10">
        <DialogHeader className="h-fit">
          <DialogTitle>
            {isEdit ? 'ویرایش دسته بندی' : 'افزودن دسته بندی'}
          </DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-thin px-4">
            <RHFInput label="نام دسته بندی" name="name" isRequired />
            <RHFInput label="نامک" name="slug" isRequired />
            <RHFSelect label="دسته بندی مادر" name="parentId" items={items} />
            <div className="flex flex-col justify-end gap-2">
              <RHFSwitch name="isActive" label="فعال بودن دسته‌بندی" />
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <RHFSwitch name="isInHeroSection" label="نمایش در هیرو سکشن" />
                {isInHeroSection && (
                  <RHFInput
                    name="orderInHero"
                    label="ترتیب در هیرو سکشن"
                    type="number"
                    isRequired
                    placeholder="عدد وارد کنید..."
                  />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <RHFSwitch name="isInHome" label="نمایش در صفحه اصلی" />
                {isInHome && (
                  <RHFInput
                    name="orderInHome"
                    label="ترتیب در صفحه اصلی"
                    type="number"
                    isRequired
                    placeholder="عدد وارد کنید..."
                  />
                )}
              </div>
            </div>

            <RHFTextEditor
              name="description"
              label="توضیحات"
              setValue={methods.setValue}
              error={methods.formState.errors.description}
              placeholder="توضیحات محصول را اینجا بنویسید..."
              className="col-span-2"
            />

            <RHFImageUploader
              name="image"
              label="تصویر دسته‌بندی"
              setValue={setValue}
              error={errors.image}
              maxSize={5 * 1024 * 1024}
              accept="image/webp"
              aspectRatio={1}
              className="col-span-2"
              defaultValue={
                selectedData?.image
                  ? process.env.NEXT_PUBLIC_IMAGE_URL + selectedData.image
                  : null
              }
            />

            <div className="col-span-2 flex flex-col gap-2">
              <RHFSecondImagesUploader
                key={selectedData ? `edit-${selectedData.id}` : 'create'}
                name="secondImages"
                label="تصاویر دوم (نمایش در منو محصولات - حداکثر ۲ عکس)"
                setValue={setValue}
                error={errors.secondImages as { message?: string } | undefined}
                defaultValues={secondImageDefaults}
                maxSize={SECOND_IMAGES_MAX_SIZE}
                accept="image/jpeg,image/png,image/webp"
                maxFiles={2}
              />
              <p className="text-xs text-gray-400">
                این تصاویر هنگام نگه‌داشتن روی دسته‌بندی در منو محصولات نمایش
                داده می‌شوند. در حالت ویرایش، عکس‌های نهایی (عکس‌های
                نگه‌داشته‌شده به‌همراه عکس‌های جدید) جایگزین لیست قبلی می‌شوند؛
                برای حذف کامل، همهٔ عکس‌ها را پاک کنید.
              </p>
            </div>

            <Button
              type="submit"
              loading={
                createCategoryMutation.isPending ||
                updateCategoryMutation.isPending
              }
              size="lg"
              className="w-full col-span-2"
            >
              ثبت دسته بندی
            </Button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
