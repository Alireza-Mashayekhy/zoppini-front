import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

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
import { useCreateProduct } from '@/services/features/products/hooks';
import {
  ColorResponse,
  createApiProductDto,
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
    // setValue,
    // formState: { errors },
  } = methods;

  // useEffect(() => {
  //   if (selectedData) {
  //     reset({
  //       name: selectedData.name,
  //       description: selectedData.description,
  //       slug: selectedData.slug,
  //       parentId: selectedData.parentId || '',
  //       isInHeroSection: selectedData.isInHeroSection,
  //       isInHome: selectedData.isInHome,
  //     });
  //   } else {
  //     reset({
  //       name: '',
  //       image: undefined,
  //       description: '',
  //       slug: '',
  //       parentId: '',
  //       isInHeroSection: false,
  //       isInHome: false,
  //     });
  //   }
  // }, [selectedData, reset]);

  const onSubmit = async (data: createProductDto) => {
    try {
      // ۱. استخراج فیلدها
      const {
        title,
        description,
        careInstructionsHtml,
        slug,
        productCode,
        categories,
        colorId,
        sizeId,
        price,
      } = data;

      // ۲. ساخت آرایه واریانت‌ها (ضرب دکارتی)
      const variants = [];
      for (const cId of colorId) {
        for (const sId of sizeId) {
          variants.push({
            colorId: Number(cId),
            sizeId: Number(sId),
            price: price,
          });
        }
      }

      // ۳. ساختن payload نهایی
      const payload: createApiProductDto = {
        productCode,
        title,
        slug,
        description,
        careInstructionsHtml,
        categoryIds: categories.map(id => Number(id)),
        variants,
      };

      console.log('Payload:', payload);

      // ارسال به بک‌اند
      await createProductMutation.mutateAsync(payload);
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
          <Button size="lg">{isEdit ? 'ویرایش' : 'افزودن'}</Button>
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
