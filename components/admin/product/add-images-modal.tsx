'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { RHFMultiImageUploader } from '@/components/form/rhf-multi-images-uploader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAddImages,
  useDeleteImage,
  useProductById,
} from '@/services/features/products/hooks';
import {
  ColorResponse,
  ProductsResponse,
} from '@/services/features/products/type';

import FormProvider from '../../form/form-provider';
import { Button } from '../../ui/button';

export default function AddImagesModal({
  selectedData,
  open,
  onOpenChange,
  colorsData,
}: {
  selectedData: ProductsResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colorsData: ColorResponse[];
}) {
  const addImagesMutation = useAddImages();
  const deleteImageMutation = useDeleteImage();

  // ======== دریافت داده‌های به‌روز محصول ========
  const { data: freshProduct } = useProductById(selectedData?.slug || '');

  // استفاده از داده‌های تازه‌شده یا داده‌های قبلی
  const productData = freshProduct?.data?.product || selectedData;

  // ======== استخراج رنگ‌های موجود در محصول ========
  const productColorIds =
    productData?.variants
      ?.map(v => v.color?.id)
      .filter((id, index, self) => id && self.indexOf(id) === index) || [];

  const productColors = colorsData.filter(c => productColorIds.includes(c.id));

  // ======== فرم ========
  const schema = z.object({
    images: z.array(
      z.object({
        colorId: z.number(),
        file: z.instanceof(File),
        preview: z.string().optional(),
      }),
    ),
  });

  const methods = useForm<{ images: { colorId: number; file: File }[] }>({
    defaultValues: { images: [] },
    resolver: zodResolver(schema),
  });

  // ======== انتخاب رنگ پیش‌فرض ========
  const [selectedColorId, setSelectedColorId] = useState<number>(
    productColors[0]?.id || 0,
  );

  // وقتی محصول تغییر می‌کند، رنگ پیش‌فرض را به‌روز کن
  useEffect(() => {
    if (productColors.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedColorId(productColors[0].id);
    }
  }, [productData, productColors]);

  // ======== حذف تصویر ========
  const handleDeleteImage = async (imageId: number) => {
    if (confirm('آیا از حذف این تصویر مطمئن هستید؟')) {
      try {
        await deleteImageMutation.mutateAsync(imageId);
        toast.success('تصویر با موفقیت حذف شد');
      } catch (error) {
        console.error(error);
        toast.error('خطا در حذف تصویر');
      }
    }
  };

  // ======== ارسال فرم ========
  const onSubmit = methods.handleSubmit(
    async data => {
      if (data.images.length === 0) {
        onOpenChange(false);
        return;
      }

      try {
        const formData = new FormData();
        data.images.forEach(item => {
          formData.append('files', item.file);
        });
        const colorIds = data.images.map(item => item.colorId);
        formData.append('colorIds', JSON.stringify(colorIds));

        await addImagesMutation.mutateAsync({
          id: productData?.id || 0,
          data: formData,
        });

        methods.reset({ images: [] });
        toast.success('تصاویر با موفقیت اضافه شدند');
        // مودال باز می‌ماند و داده‌ها با `useProductById` به‌روز می‌شوند
      } catch (error) {
        console.error(error);
        toast.error('خطا در افزودن تصاویر');
      }
    },
    errors => {
      console.log('Validation errors:', errors);
    },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full! h-full! rounded-none flex flex-col gap-10">
        <DialogHeader className="h-fit">
          <DialogTitle>مدیریت عکس‌ها</DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto px-2">
            {/* لیست عکس‌های موجود */}
            {productData?.colorImages && productData.colorImages.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">
                  عکس‌های موجود ({productData.colorImages.length})
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {productData.colorImages.map(image => (
                    <div
                      key={image.id}
                      className="relative border rounded-lg p-1 group"
                    >
                      <div className="relative h-24 w-full">
                        <Image
                          src={process.env.NEXT_PUBLIC_IMAGE_URL + image.url}
                          alt={'Product image'}
                          fill
                          className="rounded-md object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1 px-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: image.color?.hexCode }}
                          />
                          <span className="text-xs text-gray-500 truncate">
                            {image.color?.name || 'بدون رنگ'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(image.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          disabled={deleteImageMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* آپلود عکس‌های جدید */}
            <div>
              <h3 className="text-sm font-medium mb-2">افزودن عکس‌های جدید</h3>
              <RHFMultiImageUploader
                name="images"
                label="برای آپلود کلیک کنید یا عکس‌ها را بکشید و رها کنید"
                setValue={methods.setValue}
                error={methods.formState.errors.images}
                colorOptions={productColors.map(c => ({
                  text: c.name,
                  value: String(c.id),
                }))}
                defaultColorId={selectedColorId}
                onColorChange={setSelectedColorId}
              />
              {methods.formState.errors.images && (
                <p className="text-sm text-red-600 mt-1">
                  {methods.formState.errors.images.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              loading={addImagesMutation.isPending}
              size="lg"
              className="w-full"
            >
              {addImagesMutation.isPending
                ? 'در حال آپلود...'
                : 'ذخیره تغییرات'}
            </Button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
