import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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
  useCreateBlogPost,
  useUpdateBlogPost,
} from '@/services/features/blog/hooks';
import {
  BlogPostResponse,
  createBlogPostDto,
} from '@/services/features/blog/types';

import FormProvider from '../form/form-provider';
import { RHFImageUploader } from '../form/rhf-image-uploader';
import RHFInput from '../form/rhf-input';
import RHFSwitch from '../form/rhf-switch';
import { RHFTextEditor } from '../form/rhf-text-editor';
import { Button } from '../ui/button';

export default function BlogModal({
  selectedData,
  open,
  onOpenChange,
}: {
  selectedData: BlogPostResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();

  const isEdit = !!selectedData;

  const schema = z.object({
    title: z.string().nonempty('این فیلد اجباری است'),
    slug: z.string().nonempty('این فیلد اجباری است'),
    excerpt: z.string().optional(),
    content: z.string().nonempty('این فیلد اجباری است'),
    image: selectedData
      ? z.any().optional()
      : z
          .instanceof(File, { message: 'تصویر کاور اجباری است' })
          .refine(file => file.size <= 5 * 1024 * 1024, `حداکثر حجم 5MB`)
          .refine(
            file => ['image/webp'].includes(file.type),
            'فقط فرمت webp مجاز است',
          ),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
  });

  const methods = useForm({
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      isPublished: false,
      isFeatured: false,
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
      reset({
        title: selectedData.title,
        slug: selectedData.slug,
        excerpt: selectedData.excerpt || '',
        content: selectedData.content,
        isPublished: selectedData.isPublished,
        isFeatured: selectedData.isFeatured,
      });
    } else {
      reset({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        isPublished: false,
        isFeatured: false,
      });
    }
  }, [selectedData, reset]);

  const onSubmit = async (data: createBlogPostDto) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('slug', data.slug);
      formData.append('excerpt', data.excerpt || '');
      formData.append('content', data.content);
      formData.append('isPublished', data.isPublished.toString());
      formData.append('isFeatured', data.isFeatured.toString());
      if (data.image instanceof File) {
        formData.append('file', data.image);
      }

      if (isEdit && selectedData.id) {
        await updateMutation.mutateAsync({
          id: selectedData.id,
          data: formData,
        });
        toast.success('مقاله ویرایش شد');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('مقاله ساخته شد');
      }

      onOpenChange(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['blog'] });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>
        <Button variant="dark" size="lg">
          {isEdit ? 'ویرایش' : 'افزودن مقاله'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-full! h-full! rounded-none flex flex-col gap-10">
        <DialogHeader className="h-fit">
          <DialogTitle>{isEdit ? 'ویرایش مقاله' : 'افزودن مقاله'}</DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-thin px-4">
            <RHFInput label="عنوان" name="title" isRequired />
            <RHFInput label="نامک" name="slug" isRequired />

            <RHFSwitch name="isPublished" label="منتشر شده" />
            <RHFSwitch name="isFeatured" label="نمایش ویژه" />

            <RHFInput label="خلاصه" name="excerpt" className="col-span-2" />

            <RHFTextEditor
              name="content"
              label="محتوا"
              setValue={methods.setValue}
              error={methods.formState.errors.content}
              placeholder="محتوای مقاله را اینجا بنویسید..."
              className="col-span-2"
            />

            <RHFImageUploader
              name="image"
              label="تصویر کاور"
              setValue={setValue}
              error={errors.image}
              maxSize={5 * 1024 * 1024}
              accept="image/webp"
              aspectRatio={16 / 9}
              className="col-span-2"
              defaultValue={
                selectedData?.coverImage
                  ? process.env.NEXT_PUBLIC_IMAGE_URL + selectedData.coverImage
                  : null
              }
            />

            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              size="lg"
              className="w-full col-span-2"
              variant="dark"
            >
              ثبت مقاله
            </Button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
