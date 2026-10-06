import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAdminBlogBlocks,
  useCreateBlogPost,
  useSaveBlogBlocks,
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
import BlogBlocksEditor from './blog/blocks-editor';
import { BlockForm } from './blog/types';
import { defaultFormBlocks, toFormBlocks, toPayloadBlocks } from './blog/utils';

const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
  const saveBlocksMutation = useSaveBlogBlocks();

  const isEdit = !!selectedData;

  const [tab, setTab] = useState('content');

  /**
   * بخش‌های مقاله به همراه کلید مقاله‌ای که به آن تعلق دارند.
   *
   * `postKey` جلوی قاطی‌شدن ادیت‌های یک مقاله با مقاله‌ی دیگر را می‌گیرد:
   * تا وقتی همین مقاله باز است، تغییرات ادمین حفظ می‌شود و با رسیدن داده‌ی
   * سرور (یا باز شدن مقاله‌ی دیگر) یک‌بار از نو مقدار می‌گیرد.
   */
  const [blocksState, setBlocksState] = useState<{
    postKey: string;
    blocks: BlockForm[];
  }>({ postKey: 'new', blocks: defaultFormBlocks() });

  const { data: blocksResponse, isLoading: isBlocksLoading } =
    useAdminBlogBlocks(selectedData?.id, open);

  const postKey = selectedData ? String(selectedData.id) : 'new';
  const serverBlocks = blocksResponse?.data;

  const setBlocks = (nextBlocks: BlockForm[]) => {
    setBlocksState({ postKey, blocks: nextBlocks });
  };

  /**
   * همگام‌سازی با داده‌ی سرور (الگوی رسمی «تنظیم state هنگام تغییر ورودی»):
   * فقط وقتی مقاله‌ی باز‌شده با state فعلی فرق دارد.
   */
  if (
    open &&
    postKey !== 'new' &&
    serverBlocks &&
    blocksState.postKey !== postKey
  ) {
    setBlocksState({ postKey, blocks: toFormBlocks(serverBlocks) });
  }

  /** فقط برای رندرهای گذرا (پیش از رسیدن داده‌ی سرور) استفاده می‌شود */
  const fallbackBlocks = useMemo(() => defaultFormBlocks(), []);

  const blocks =
    blocksState.postKey === postKey ? blocksState.blocks : fallbackBlocks;

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
            file => ALLOWED_COVER_TYPES.includes(file.type),
            'فقط فرمت jpg، png و webp مجاز است',
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

    let postId: number | undefined;

    try {
      if (isEdit && selectedData.id) {
        const response = await updateMutation.mutateAsync({
          id: selectedData.id,
          data: formData,
        });
        postId = response.data?.id ?? selectedData.id;
        toast.success('مقاله ویرایش شد');
      } else {
        const response = await createMutation.mutateAsync(formData);
        postId = response.data?.id;
        toast.success('مقاله ساخته شد');
      }
    } catch {
      toast.error('ذخیره‌ی مقاله ناموفق بود');
      return;
    }

    /** بخش‌ها (سوالات متداول، اسلایدر محصولات، مدیا و فهرست مطالب) */
    if (postId) {
      try {
        const saved = await saveBlocksMutation.mutateAsync({
          id: postId,
          blocks: toPayloadBlocks(blocks),
        });

        setBlocks(toFormBlocks(saved.data ?? []));
      } catch {
        toast.error(
          'مقاله ذخیره شد، ولی بخش‌ها (سوالات متداول/اسلایدر) ذخیره نشدند. دوباره تلاش کنید.',
        );
        // مودال باز می‌ماند تا ادمین بخش‌ها را دوباره ذخیره کند
        queryClient.invalidateQueries({ queryKey: ['blog'] });
        return;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['blog'] });
    queryClient.invalidateQueries({ queryKey: ['blog-blocks'] });

    onOpenChange(false);
    reset();
    setBlocksState({ postKey: 'new', blocks: defaultFormBlocks() });
  };

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    saveBlocksMutation.isPending;

  const blocksCount = blocks.filter(block => block.type !== 'content').length;

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) {
          setTab('content');
          setBlocksState({ postKey: 'new', blocks: defaultFormBlocks() });
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogTrigger>
        <Button variant="dark" size="lg">
          <Plus className="size-4" />
          افزودن مقاله
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-full! h-full! rounded-none flex flex-col gap-6">
        <DialogHeader className="h-fit shrink-0">
          <DialogTitle>{isEdit ? 'ویرایش مقاله' : 'افزودن مقاله'}</DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <Tabs
              value={tab}
              onValueChange={setTab}
              className="min-h-0 flex-1 flex-col"
            >
              <TabsList className="w-fit shrink-0">
                <TabsTrigger value="content">محتوای مقاله</TabsTrigger>
                <TabsTrigger value="blocks">
                  بخش‌ها و اسلایدرها
                  {blocksCount > 0 && (
                    <span className="rounded bg-primary-100 px-1.5 text-xs text-primary-700">
                      {blocksCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="min-h-0 flex-1 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin px-1 py-4">
                <TabsContent value="content">
                  <div className="grid grid-cols-2 gap-4">
                    <RHFInput label="عنوان" name="title" isRequired />
                    <RHFInput label="نامک" name="slug" isRequired />

                    <RHFSwitch name="isPublished" label="منتشر شده" />
                    <RHFSwitch name="isFeatured" label="نمایش ویژه" />

                    <RHFInput
                      label="خلاصه"
                      name="excerpt"
                      className="col-span-2"
                    />

                    <RHFTextEditor
                      name="content"
                      label="محتوا"
                      setValue={methods.setValue}
                      error={methods.formState.errors.content}
                      placeholder="محتوای مقاله را اینجا بنویسید... با دکمه‌ی تصویر/ویدیو می‌توانید فایل را از سیستم خودتان آپلود کنید"
                      className="col-span-2"
                    />

                    <RHFImageUploader
                      name="image"
                      label="تصویر کاور"
                      setValue={setValue}
                      error={errors.image}
                      maxSize={5 * 1024 * 1024}
                      accept="image/jpeg,image/png,image/webp"
                      aspectRatio={16 / 9}
                      className="col-span-2"
                      defaultValue={
                        selectedData?.coverImage
                          ? process.env.NEXT_PUBLIC_IMAGE_URL +
                            selectedData.coverImage
                          : null
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="blocks">
                  {isEdit && isBlocksLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                      <Loader2 className="size-4 animate-spin" />
                      در حال بارگذاری بخش‌های مقاله...
                    </div>
                  ) : (
                    <>
                      <BlogBlocksEditor blocks={blocks} onChange={setBlocks} />
                      <p className="mt-4 rounded-md bg-amber-50 p-3 text-xs text-amber-700">
                        بخش‌ها همراه همین دکمه‌ی «ثبت مقاله» ذخیره می‌شوند؛ برای
                        مقالات جدید ابتدا مقاله ذخیره و سپس بخش‌ها ثبت می‌گردد.
                      </p>
                    </>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            <div className="shrink-0 border-t pt-4">
              <Button
                type="submit"
                loading={isSaving}
                size="lg"
                className="w-full"
                variant="dark"
              >
                ثبت مقاله
              </Button>
            </div>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
