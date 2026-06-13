import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCreateCategory } from '@/services/features/categories/hooks';
import { createCategoryDto } from '@/services/features/categories/types';

import FormProvider from '../form/form-provider';
import { RHFImageUploader } from '../form/rhf-image-uploader';
import RHFInput from '../form/rhf-input';
import { RHFTextEditor } from '../form/rhf-text-editor';
import { Button } from '../ui/button';

export default function CategoriesModal() {
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
  });

  const methods = useForm<createCategoryDto>({
    defaultValues: {
      name: '',
      image: undefined,
      description: '',
      slug: '',
      parentId: '',
    },
    resolver: zodResolver(schema),
  });

  const {
    setValue,
    formState: { errors },
  } = methods;

  const onSubmit = async (data: createCategoryDto) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('image', data.image);
    formData.append('description', data.description);
    formData.append('slug', data.slug);
    if (data.parentId) formData.append('parentId', data.parentId);

    createCategoryMutaion.mutateAsync(formData);
  };

  return (
    <>
      <Dialog>
        <DialogTrigger>
          <Button size="lg">افزودن</Button>
        </DialogTrigger>
        <DialogContent className="max-w-full! h-full! rounded-none flex flex-col gap-10">
          <DialogHeader className="h-fit">
            <DialogTitle>افزودن دسته بندی</DialogTitle>
          </DialogHeader>

          <FormProvider
            methods={methods}
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-100px)] overflow-y-auto px-4">
              <RHFInput label="نام دسته بندی" name="name" required />
              <RHFInput label="نامک" name="slug" required />

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
                ارسال کد
              </Button>
            </div>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}
