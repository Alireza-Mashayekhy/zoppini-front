'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import {
  hasEditorBlocks,
  legacyBlocksToEditorHtml,
} from '@/components/editor/lib/block-html';
import ZoppiniEditor from '@/components/editor/zoppini-editor';
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
import RHFTextArea from '../form/rhf-textarea';
import { Button } from '../ui/button';

const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * فرم ساخت/ویرایش مقاله.
 *
 * از این نسخه به بعد، همه‌ی مقاله — متن، عکس، ویدیو، اسلایدر محصولات،
 * سوالات متداول، فهرست مطالب و گالری — در یک ادیتور واحد نوشته می‌شود و
 * نتیجه‌ی نهایی یک رشته HTML در فیلد content است. بلوک‌های ویژه به‌شکل
 * `<div data-zp-block="…" data-zp-config="…">` داخل همان HTML می‌نشینند و
 * بک‌اند برای نمایش سایت از آن‌ها بلوک می‌سازد.
 */
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

  const [tab, setTab] = useState('content');

  const schema = z.object({
    title: z.string().nonempty('این فیلد اجباری است'),
    slug: z.string().nonempty('این فیلد اجباری است'),
    excerpt: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
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
      metaTitle: '',
      metaDescription: '',
      content: '',
      isPublished: false,
      isFeatured: false,
    },
    resolver: zodResolver(schema),
  });

  const {
    reset,
    setValue,
    control,
    formState: { errors },
  } = methods;

  const metaTitle = useWatch({ control, name: 'metaTitle' }) || '';
  const metaDescription = useWatch({ control, name: 'metaDescription' }) || '';
  const content = useWatch({ control, name: 'content' }) || '';

  /**
   * مقاله‌های قدیمی بلوک‌هایشان در جدول جداگانه‌ی blog_blocks است.
   * فقط وقتی این داده خواسته می‌شود که متن مقاله نشانه‌ی بلوک جدید
   * نداشته باشد؛ بعد از اولین ذخیره، خود متن منبع اصلی است.
   */
  const needsLegacyBlocks =
    !!selectedData?.id && !hasEditorBlocks(selectedData.content);

  const { data: blocksResponse, isLoading: isBlocksLoading } =
    useAdminBlogBlocks(selectedData?.id, open && needsLegacyBlocks);

  useEffect(() => {
    if (selectedData) {
      reset({
        title: selectedData.title,
        slug: selectedData.slug,
        excerpt: selectedData.excerpt || '',
        metaTitle: selectedData.metaTitle || '',
        metaDescription: selectedData.metaDescription || '',
        content: selectedData.content,
        isPublished: selectedData.isPublished,
        isFeatured: selectedData.isFeatured,
      });
    } else {
      reset({
        title: '',
        slug: '',
        excerpt: '',
        metaTitle: '',
        metaDescription: '',
        content: '',
        isPublished: false,
        isFeatured: false,
      });
    }
  }, [selectedData, reset]);

  /**
   * مهاجرت خودکار مقاله‌های قدیمی به ادیتور یکپارچه.
   *
   * ترتیب بلوک‌های قبلی (متن، اسلایدر، FAQ، گالری و فهرست) دقیقاً به
   * همان شکل داخل متن چیده می‌شود؛ از ذخیره‌ی بعدی به شکل جدید نگه‌داری
   * می‌گردد و دیگر نیازی به جدول بلوک‌ها نیست.
   */
  const migratedPostRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !selectedData || !needsLegacyBlocks) return;
    if (!blocksResponse?.data) return;

    const postKey = String(selectedData.id);
    if (migratedPostRef.current === postKey) return;

    migratedPostRef.current = postKey;

    setValue(
      'content',
      legacyBlocksToEditorHtml(blocksResponse.data, selectedData.content ?? ''),
      { shouldValidate: true },
    );
  }, [open, selectedData, needsLegacyBlocks, blocksResponse, setValue]);

  const onSubmit = async (data: createBlogPostDto) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('slug', data.slug);
    formData.append('excerpt', data.excerpt || '');
    formData.append('metaTitle', data.metaTitle || '');
    formData.append('metaDescription', data.metaDescription || '');
    formData.append('content', data.content);
    formData.append('isPublished', data.isPublished.toString());
    formData.append('isFeatured', data.isFeatured.toString());
    if (data.image instanceof File) {
      formData.append('file', data.image);
    }

    try {
      if (isEdit && selectedData?.id) {
        await updateMutation.mutateAsync({
          id: selectedData.id,
          data: formData,
        });
        toast.success('مقاله ویرایش شد');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('مقاله ساخته شد');
      }
    } catch {
      toast.error('ذخیره‌ی مقاله ناموفق بود');
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['blog'] });
    queryClient.invalidateQueries({ queryKey: ['blog-blocks'] });

    onOpenChange(false);
    reset();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  /** تعداد بلوک‌های ویژه‌ی درج‌شده در متن (برای نمایش در تب) */
  const blockCount = (content.match(/data-zp-block=/g) ?? []).length;

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) setTab('content');
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
                <TabsTrigger value="content">مشخصات مقاله</TabsTrigger>
                <TabsTrigger value="editor">ویرایشگر محتوا</TabsTrigger>
                <TabsTrigger value="seo">سئو</TabsTrigger>
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

                    <div className="col-span-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                      متن مقاله و همه‌ی اجزای آن (عکس، ویدیو، گالری، اسلایدر
                      محصولات، سوالات متداول و فهرست مطالب) در تب «ویرایشگر
                      محتوا» و به هر ترتیبی که بخواهید نوشته می‌شود.
                    </div>

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

                <TabsContent value="editor">
                  {isEdit && isBlocksLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                      <Loader2 className="size-4 animate-spin" />
                      در حال آماده‌سازی محتوای مقاله...
                    </div>
                  ) : (
                    <>
                      <ZoppiniEditor
                        value={content}
                        onChange={html =>
                          setValue('content', html, { shouldValidate: true })
                        }
                        variant="blog"
                        minHeight={440}
                        maxHeight="calc(100vh - 260px)"
                        placeholder="متن مقاله را بنویسید… برای درج عکس، جدول، اسلایدر محصولات یا سوالات متداول «/» بزنید"
                      />

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="rounded bg-gray-100 px-2 py-1">
                          {blockCount > 0
                            ? `${blockCount} بلوک ویژه در مقاله`
                            : 'هنوز بلوک ویژه‌ای (اسلایدر/گالری/FAQ/فهرست) اضافه نشده'}
                        </span>
                        <span>
                          راهنما: تایپ «/» یا دکمه‌ی «افزودن» در نوار ابزار،
                          دکمه‌ی تمام‌صفحه برای فضای بیشتر، و «{}» برای دیدن
                          کد HTML.
                        </span>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="seo">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                      این دو مقدار در عنوان و توضیحات متای صفحه‌ی همین مقاله در
                      نتایج گوگل استفاده می‌شوند. اگر خالی بمانند، عنوان و
                      خلاصه‌ی مقاله به‌صورت خودکار استفاده می‌شود.
                    </div>

                    <div className="col-span-2">
                      <RHFInput
                        label="متا تایتل"
                        name="metaTitle"
                        placeholder="مثال: کت شلوار مردانه | راهنمای ست کردن - زوپینی"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {metaTitle.length} کاراکتر (پیشنهاد: حداکثر ۶۰ کاراکتر)
                      </p>
                    </div>

                    <div className="col-span-2">
                      <RHFTextArea
                        label="متا دیسکریپشن"
                        name="metaDescription"
                        rows={3}
                        placeholder="توضیح کوتاه و جذاب درباره‌ی محتوای این مقاله"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {metaDescription.length} کاراکتر (پیشنهاد: حداکثر ۱۶۰
                        کاراکتر)
                      </p>
                    </div>
                  </div>
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
