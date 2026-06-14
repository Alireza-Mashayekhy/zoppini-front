import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import { useCreateCategory } from '@/services/features/categories/hooks';
import {
  CategoriesResponse,
  createCategoryDto,
} from '@/services/features/categories/types';

import FormProvider from '../form/form-provider';
import { RHFImageUploader } from '../form/rhf-image-uploader';
import RHFInput from '../form/rhf-input';
import RHFSelect from '../form/rhf-select';
import RHFSwitch from '../form/rhf-switch';
import { RHFTextEditor } from '../form/rhf-text-editor';
import { Button } from '../ui/button';

export default function CategoriesModal({
  categories,
}: {
  categories: CategoriesResponse[];
}) {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const createCategoryMutaion = useCreateCategory();

  const schema = z.object({
    name: z.string().nonempty('این فیلد اجباری است'),
    image: z
      .instanceof(File, { message: 'عکس دسته بندی اجباری است' })
      .refine(file => file.size <= 5 * 1024 * 102, `حداکثر حجم 5MB`)
      .refine(
        file => ['image/webp'].includes(file.type),
        'فقط فرمت‌ webp مجازند',
      ),
    description: z.string().nonempty('این فیلد اجباری است'),
    slug: z.string().nonempty('این فیلد اجباری است'),
    parentId: z.string().nullable(),
    isInHeroSection: z.boolean(),
    isInHome: z.boolean(),
  });

  const methods = useForm<createCategoryDto>({
    defaultValues: {
      name: '',
      image: undefined,
      description: '',
      slug: '',
      parentId: '',
      isInHeroSection: false,
      isInHome: false,
    },
    resolver: zodResolver(schema),
  });

  const {
    setValue,
    formState: { errors },
  } = methods;

  const onSubmit = async (data: createCategoryDto) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('file', data.image);
      formData.append('description', data.description);
      formData.append('slug', data.slug);
      formData.append('isInHeroSection', data.isInHeroSection.toString());
      formData.append('isInHome', data.isInHome.toString());
      if (data.parentId) formData.append('parentId', data.parentId);
      createCategoryMutaion.mutateAsync(formData);
      toast.success('دسته بندی با موفقیت ساخته شد');
      setOpen(false);
      methods.reset();
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error) {
      console.log(error);
    }
  };
  const items: { text: string; value: string }[] = [
    {
      text: 'بدون دسته بندی',
      value: 'null',
    },
  ];
  categories.map(cat => {
    items.push({
      text: cat.name,
      value: cat.id.toString(),
    });
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button size="lg">افزودن</Button>
        </DialogTrigger>
        <DialogContent className="max-w-full! h-full! rounded-none flex flex-col gap-10">
          <DialogHeader className="h-fit">
            <DialogTitle>افزودن دسته بندی</DialogTitle>
          </DialogHeader>

          <FormProvider methods={methods} onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-thin px-4">
              <RHFInput label="نام دسته بندی" name="name" isRequired />
              <RHFInput label="نامک" name="slug" isRequired />
              <RHFSelect
                label="دسته بندی مادر"
                name="parent_id"
                items={items}
              />

              <span />

              <RHFSwitch name="isInHeroSection" label="نمایش در هیرو سکشن" />
              <RHFSwitch name="isInHome" label="نمایش در صفحه اصلی" />

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
              />
              <Button
                type="submit"
                loading={createCategoryMutaion.isPending}
                size="lg"
                className="w-full col-span-2"
              >
                ثبت دسته بندی{' '}
              </Button>
            </div>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}
