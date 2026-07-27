'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { zodResolver } from '@hookform/resolvers/zod';
import { GripVertical, Trash2 } from 'lucide-react';
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
  useUpdateColorImagesOrder,
} from '@/services/features/products/hooks';
import {
  ColorResponse,
  ProductColorImage,
  ProductsResponse,
} from '@/services/features/products/type';

import FormProvider from '../../form/form-provider';
import { Button } from '../../ui/button';

// ========== کامپوننت آیتم قابل درگ ==========
interface SortableImageItemProps {
  image: ProductColorImage;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

function SortableImageItem({
  image,
  onDelete,
  isDeleting,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative border rounded-lg p-1 group bg-white"
      {...attributes}
    >
      <div className="relative h-24 w-full">
        <Image
          src={process.env.NEXT_PUBLIC_IMAGE_URL + image.url}
          alt="Product image"
          fill
          className="rounded-md object-contain"
        />
      </div>
      <div className="flex items-center justify-between mt-1 px-1">
        <div className="flex items-center gap-2">
          <div {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </div>
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
          onClick={() => onDelete(image.id)}
          className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ========== کامپوننت اصلی ==========
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
  const updateOrderMutation = useUpdateColorImagesOrder();

  const { data: freshProduct } = useProductById(selectedData?.slug || '');
  const productData = freshProduct?.data?.product || selectedData;

  // ======== لیست تصاویر با ترتیب ========
  const [images, setImages] = useState<ProductColorImage[]>(
    productData?.colorImages?.sort((a, b) => (a.order || 0) - (b.order || 0)) ||
      [],
  );

  // به‌روزرسانی لیست وقتی داده‌ها تغییر می‌کنند
  useEffect(() => {
    if (productData?.colorImages) {
      const sorted = [...productData.colorImages].sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      );
      setImages(sorted);
    }
  }, [productData]);

  // ======== استخراج رنگ‌های موجود در محصول ========
  const productColorIds =
    productData?.variants
      ?.map(v => v.color?.id)
      .filter((id, index, self) => id && self.indexOf(id) === index) || [];

  const productColors = colorsData.filter(c => productColorIds.includes(c.id));

  // ======== فرم برای آپلود تصاویر جدید ========
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

  const [selectedColorId, setSelectedColorId] = useState<number>(
    productColors[0]?.id || 0,
  );

  useEffect(() => {
    if (productColors.length > 0) {
      setSelectedColorId(productColors[0].id);
    }
  }, [productData, productColors]);

  // ======== حذف تصویر ========
  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('آیا از حذف این تصویر مطمئن هستید؟')) return;
    try {
      await deleteImageMutation.mutateAsync(imageId);
      toast.success('تصویر با موفقیت حذف شد');
    } catch (error) {
      console.error(error);
      toast.error('خطا در حذف تصویر');
    }
  };

  // ======== ارسال تصاویر جدید ========
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
      } catch (error) {
        console.error(error);
        toast.error('خطا در افزودن تصاویر');
      }
    },
    errors => {
      console.log('Validation errors:', errors);
    },
  );

  // ======== مدیریت درگ‌اند دراپ ========
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = images.findIndex(img => img.id === active.id);
      const newIndex = images.findIndex(img => img.id === over.id);
      const newImages = arrayMove(images, oldIndex, newIndex);
      setImages(newImages);
    }
  };

  // ======== ذخیره ترتیب جدید ========
  const handleSaveOrder = async () => {
    if (!productData?.id) return;
    const orders = images.map((img, index) => ({
      id: img.id,
      order: index,
    }));
    await updateOrderMutation.mutateAsync({
      productId: productData.id,
      orders,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full! h-full! rounded-none flex flex-col gap-10">
        <DialogHeader className="h-fit">
          <DialogTitle>مدیریت عکس‌ها</DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto px-2">
            {/* لیست عکس‌های موجود با قابلیت درگ */}
            {images.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">
                    عکس‌های موجود ({images.length})
                    <span className="text-xs text-gray-400 mr-2">
                      (برای تغییر ترتیب، بکشید)
                    </span>
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveOrder}
                    loading={updateOrderMutation.isPending}
                    disabled={!productData?.id}
                  >
                    ذخیره ترتیب
                  </Button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={images.map(img => img.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid grid-cols-4 gap-2">
                      {images.map(image => (
                        <SortableImageItem
                          key={image.id}
                          image={image}
                          onDelete={handleDeleteImage}
                          isDeleting={deleteImageMutation.isPending}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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
