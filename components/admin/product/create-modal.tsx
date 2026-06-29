// components/admin/product/create-modal.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { RHFImageUploader } from '@/components/form/rhf-image-uploader';
import RHFInput from '@/components/form/rhf-input';
import RHFMultiSelect from '@/components/form/rhf-multiselect';
import RHFPriceInput from '@/components/form/rhf-price-input';
import { RHFTextEditor } from '@/components/form/rhf-text-editor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CategoriesResponse } from '@/services/features/categories/types';
import {
  useCreateProduct,
  useEditProduct,
} from '@/services/features/products/hooks';
import {
  ColorResponse,
  createProductDto,
  ProductsResponse,
  SizeResponse,
} from '@/services/features/products/type';

import FormProvider from '../../form/form-provider';
import { Button } from '../../ui/button';
import CreateColorModal from './create-color-modal';
import CreateSizeModal from './create-size-modal';

// نشان دادن فیلد SKU (اختیاری)
const SHOW_SKU = true;

export default function ProductCreateModal({
  categories,
  selectedData,
  open,
  onOpenChange,
  colorsData,
  sizeData,
}: {
  categories: CategoriesResponse[];
  selectedData: ProductsResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colorsData: ColorResponse[];
  sizeData: SizeResponse[];
}) {
  const [isCreateColorOpen, setCreateColorModal] = useState(false);
  const [isCreateSizeOpen, setCreateSizeModal] = useState(false);
  const [variants, setVariants] = useState<
    {
      colorId: string;
      sizeId: string;
      price: number;
      stock: number;
      sku?: string;
    }[]
  >([]);

  const queryClient = useQueryClient();
  const createProductMutation = useCreateProduct();
  const editProductMutation = useEditProduct();

  const colorItems = colorsData.map(color => ({
    text: color?.name,
    value: String(color?.id),
  }));
  const sizeItems = sizeData.map(size => ({
    text: size?.name,
    value: String(size?.id),
  }));
  const categoryItems = categories.map(cat => ({
    text: cat.name,
    value: String(cat.id),
  }));

  const isEdit = !!selectedData;

  // شمای اعتبارسنجی (بدون price)
  const schema = z.object({
    title: z.string().nonempty('این فیلد اجباری است'),
    image: selectedData
      ? z.any().optional()
      : z
          .instanceof(File, { message: 'عکس دسته بندی اجباری است' })
          .refine(file => file.size <= 5 * 1024 * 102, 'حداکثر حجم 5MB')
          .refine(
            file => ['image/webp'].includes(file.type),
            'فقط فرمت‌ webp مجازند',
          ),
    description: z.string().nonempty('این فیلد اجباری است'),
    careInstructionsHtml: z.string().nonempty('این فیلد اجباری است'),
    slug: z.string().nonempty('این فیلد اجباری است'),
    productCode: z.string().nonempty('این فیلد اجباری است'),
    categories: z.array(z.string()).nonempty('این فیلد اجباری است'),
    colorId: z.array(z.string()).nonempty('این فیلد اجباری است'),
    sizeId: z.array(z.string()).nonempty('این فیلد اجباری است'),
  });

  const methods = useForm<createProductDto>({
    defaultValues: {
      title: '',
      image: undefined,
      description: '',
      careInstructionsHtml: '',
      slug: '',
      productCode: '',
      categories: [],
      colorId: [],
      sizeId: [],
    },
    resolver: zodResolver(schema),
  });

  const {
    reset,
    setValue,
    formState: { errors },
    watch,
  } = methods;

  // به‌روزرسانی لیست واریانت‌ها با تغییر رنگ یا سایز
  const colorId = watch('colorId');
  const sizeId = watch('sizeId');

  const variantsRef = useRef(variants);

  useEffect(() => {
    variantsRef.current = variants;
  }, [variants]);

  useEffect(() => {
    if (!colorId.length || !sizeId.length) {
      setVariants([]);
      return;
    }

    const newVariants: typeof variants = [];
    for (const cId of colorId) {
      for (const sId of sizeId) {
        const existing = variantsRef.current.find(
          v => v.colorId === cId && v.sizeId === sId,
        );
        newVariants.push({
          colorId: cId,
          sizeId: sId,
          price: existing?.price || 0,
          stock: existing?.stock || 0,
          sku: existing?.sku || '',
        });
      }
    }
    setVariants(newVariants);
  }, [colorId, sizeId]);

  // مقداردهی اولیه در حالت ویرایش
  useEffect(() => {
    if (selectedData) {
      const uniqueColorIds = [
        ...new Set(selectedData.variants?.map(v => String(v.color?.id)) || []),
      ];
      const uniqueSizeIds = [
        ...new Set(selectedData.variants?.map(v => String(v.size?.id)) || []),
      ];
      reset({
        title: selectedData.title,
        description: selectedData.description || '',
        careInstructionsHtml: selectedData.careInstructionsHtml || '',
        slug: selectedData.slug,
        productCode: selectedData.productCode,
        categories: selectedData.categories?.map(c => String(c.id)) || [],
        colorId: uniqueColorIds,
        sizeId: uniqueSizeIds,
      });
      // تنظیم واریانت‌ها
      setVariants(
        selectedData.variants?.map(v => ({
          colorId: String(v.color?.id),
          sizeId: String(v.size?.id),
          price: Number(v.price),
          stock: v.stock || 0,
          sku: v.sku || '',
        })) || [],
      );
    } else {
      reset({
        title: '',
        image: undefined,
        description: '',
        careInstructionsHtml: '',
        slug: '',
        productCode: '',
        categories: [],
        colorId: [],
        sizeId: [],
      });
      setVariants([]);
    }
  }, [selectedData, reset]);

  // تابع ارسال فرم
  const onSubmit = async (data: any) => {
    try {
      const {
        title,
        description,
        careInstructionsHtml,
        slug,
        productCode,
        categories,
      } = data;

      const variantsPayload = variants.map(v => ({
        colorId: Number(v.colorId),
        sizeId: Number(v.sizeId),
        price: Number(v.price),
        stock: Number(v.stock) || 0,
        sku: v.sku || '',
      }));

      const hasInvalid = variantsPayload.some(
        v =>
          isNaN(v.colorId) ||
          isNaN(v.sizeId) ||
          v.colorId <= 0 ||
          v.sizeId <= 0,
      );
      if (hasInvalid) {
        toast.error('مقادیر رنگ یا سایز نامعتبر است');
        return;
      }

      console.log(variantsPayload);

      const formData = new FormData();
      formData.append('productCode', productCode);
      formData.append('title', title);
      formData.append('slug', slug);
      formData.append('description', description || '');
      formData.append('careInstructionsHtml', careInstructionsHtml || '');
      formData.append('categoryIds', JSON.stringify(categories.map(Number)));
      formData.append('variants', JSON.stringify(variantsPayload));

      if (data.image instanceof File) {
        formData.append('file', data.image);
      }

      if (isEdit && selectedData) {
        await editProductMutation.mutateAsync({
          id: selectedData.id,
          data: formData,
        });
      } else {
        await createProductMutation.mutateAsync(formData);
      }

      onOpenChange(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.log(error);
    }
  };

  // به‌روزرسانی یک واریانت خاص (وقتی کاربر قیمت/موجودی را تغییر می‌دهد)
  const updateVariant = (
    index: number,
    field: 'price' | 'stock' | 'sku',
    value: any,
  ) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      [field]: field === 'price' || field === 'stock' ? Number(value) : value,
    };
    setVariants(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" variant="dark">
          {isEdit ? 'ویرایش' : 'افزودن'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-full! h-full! rounded-none flex flex-col gap-10">
        <DialogHeader className="h-fit">
          <DialogTitle>{isEdit ? 'ویرایش محصول' : 'افزودن محصول'}</DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-thin px-4">
            <RHFInput name="title" label="نام محصول" />
            <RHFInput name="productCode" label="کد محصول" />
            <RHFInput name="slug" label="اسلاگ" />

            <div className="flex gap-2 items-end">
              <RHFMultiSelect name="colorId" label="رنگ" items={colorItems} />
              <CreateColorModal
                open={isCreateColorOpen}
                onOpenChange={setCreateColorModal}
              />
            </div>
            <div className="flex gap-2 items-end">
              <RHFMultiSelect name="sizeId" label="سایز" items={sizeItems} />
              <CreateSizeModal
                open={isCreateSizeOpen}
                onOpenChange={setCreateSizeModal}
              />
            </div>
            <RHFMultiSelect
              name="categories"
              label="دسته بندی ها"
              items={categoryItems}
            />

            {/* جدول واریانت‌ها */}
            {variants.length > 0 && (
              <div className="col-span-2 mt-4 border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-right">رنگ</th>
                      <th className="p-2 text-right">سایز</th>
                      <th className="p-2 text-right">قیمت</th>
                      <th className="p-2 text-right">موجودی</th>
                      {SHOW_SKU && (
                        <th className="p-2 text-right">کد محصول (SKU)</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, index) => {
                      const colorName = colorsData.find(
                        c => String(c.id) === variant.colorId,
                      )?.name;
                      const sizeName = sizeData.find(
                        s => String(s.id) === variant.sizeId,
                      )?.name;
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-2">{colorName}</td>
                          <td className="p-2">{sizeName}</td>
                          <td className="p-2">
                            <RHFPriceInput
                              name={`variant-price-${index}`}
                              label=""
                              className="w-32"
                              value={variant.price}
                              onChange={val =>
                                updateVariant(index, 'price', val)
                              }
                            />
                          </td>
                          <td className="p-2">
                            <RHFInput
                              name={`variant-stock-${index}`}
                              type="number"
                              label=""
                              className="w-24"
                              value={variant.stock}
                              onChange={e =>
                                updateVariant(
                                  index,
                                  'stock',
                                  Number(e.target.value),
                                )
                              }
                            />
                          </td>
                          {SHOW_SKU && (
                            <td className="p-2">
                              <RHFInput
                                name={`variant-sku-${index}`}
                                label=""
                                className="w-32"
                                value={variant.sku}
                                onChange={e =>
                                  updateVariant(index, 'sku', e.target.value)
                                }
                              />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="col-span-2">
              <RHFTextEditor name="description" label="توضیحات" />
            </div>
            <div className="col-span-2">
              <RHFTextEditor name="careInstructionsHtml" label="نحوه شستشو" />
            </div>
            <RHFImageUploader
              name="image"
              label="تصویر محصول"
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
            <Button
              type="submit"
              loading={
                createProductMutation.isPending || editProductMutation.isPending
              }
              size="lg"
              className="w-full col-span-2"
            >
              {isEdit ? 'ویرایش محصول' : 'ثبت محصول'}
            </Button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
