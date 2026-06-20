import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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

  const queryClient = useQueryClient();

  const createProductMutation = useCreateProduct();
  const editProductMutation = useEditProduct();

  const colorItems = colorsData.map(color => ({
    text: color.name,
    value: String(color.id),
  }));
  const sizeItems = sizeData.map(size => ({
    text: size.name,
    value: String(size.id),
  }));
  const categoryItems = categories.map(cat => ({
    text: cat.name,
    value: String(cat.id),
  }));

  const isEdit = !!selectedData;

  const schema = z.object({
    title: z.string().nonempty('این فیلد اجباری است'),
    image: selectedData
      ? z.any().optional()
      : z
          .instanceof(File, { message: 'عکس دسته بندی اجباری است' })
          .refine(file => file.size <= 5 * 1024 * 102, `حداکثر حجم 5MB`)
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
    price: z.number(),
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
      price: 0,
    },
    resolver: zodResolver(schema),
  });

  const {
    reset,
    setValue,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (selectedData) {
      const categoryIds =
        selectedData.categories?.map(cat => String(cat.id)) || [];
      const colorIds = [
        ...new Set(selectedData.variants?.map(v => String(v.color?.id)) || []),
      ];
      const sizeIds = [
        ...new Set(selectedData.variants?.map(v => String(v.size?.id)) || []),
      ];
      const price = selectedData.variants?.[0]?.price || 0;

      reset({
        title: selectedData.title,
        description: selectedData.description || '',
        careInstructionsHtml: selectedData.careInstructionsHtml || '',
        slug: selectedData.slug,
        productCode: selectedData.productCode,
        categories: categoryIds,
        colorId: colorIds,
        sizeId: sizeIds,
        price: price,
      });
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
        price: 0,
      });
    }
  }, [selectedData, reset]);

  const onSubmit = async (data: createProductDto) => {
    try {
      const variants = [];
      for (const cId of data.colorId) {
        for (const sId of data.sizeId) {
          variants.push({
            colorId: Number(cId),
            sizeId: Number(sId),
            price: data.price,
          });
        }
      }

      const categoryIds = data.categories.map(id => Number(id));

      const formData = new FormData();

      formData.append('title', data.title);
      formData.append('slug', data.slug);
      formData.append('productCode', data.productCode);
      formData.append('description', data.description || '');
      formData.append('careInstructionsHtml', data.careInstructionsHtml || '');

      formData.append('categoryIds', JSON.stringify(categoryIds));
      formData.append('variants', JSON.stringify(variants));

      if (data.image instanceof File) {
        formData.append('file', data.image);
      }

      if (isEdit && selectedData.id) {
        await editProductMutation.mutateAsync({
          id: selectedData.id,
          data: formData,
        });
        toast.success('محصول ویرایش شد');
      } else {
        await createProductMutation.mutateAsync(formData);
        toast.success('محصول ساخته شد');
      }

      onOpenChange(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger>
          <Button size="lg">افزودن</Button>
        </DialogTrigger>
        <DialogContent className="max-w-full! h-full! rounded-none flex flex-col gap-10">
          <DialogHeader className="h-fit">
            <DialogTitle>
              {isEdit ? 'ویرایش دسته بندی' : 'افزودن دسته بندی'}
            </DialogTitle>
          </DialogHeader>

          <FormProvider methods={methods} onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-thin px-4">
              <RHFInput name="title" label="نام محصول" />
              <RHFInput name="productCode" label="کد محصول" />
              <RHFInput name="slug" label="اسلاگ" />
              <RHFPriceInput name="price" label="قیمت" />
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
                loading={createProductMutation.isPending}
                size="lg"
                className="w-full col-span-2"
              >
                ثبت محصول{' '}
              </Button>
            </div>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}
