'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminBlogList } from '@/services/features/blog/hooks';
import { useAdminCategoriesList } from '@/services/features/categories/hooks';
import { useAdminProducsList } from '@/services/features/products/hooks';
import {
  useAdminPageSeoList,
  useCreatePageSeo,
  useUpdatePageSeo,
} from '@/services/features/seo/hooks';
import { PageSeoResponse } from '@/services/features/seo/types';

import FormProvider from '../../form/form-provider';
import RHFInput from '../../form/rhf-input';
import RHFSwitch from '../../form/rhf-switch';
import RHFTextArea from '../../form/rhf-textarea';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

const schema = z.object({
  path: z
    .string()
    .trim()
    .min(1, 'مسیر صفحه اجباری است')
    .refine(value => value.startsWith('/'), 'مسیر باید با / شروع شود'),
  label: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  indexable: z.boolean(),
  followable: z.boolean(),
  redirectTo: z.string().optional(),
  includeInPageSitemap: z.boolean(),
});

type FormData = z.infer<typeof schema>;
type ResourceType = 'pages' | 'articles' | 'products' | 'categories';

const resourceLabels: Record<ResourceType, string> = {
  pages: 'صفحات سایت',
  articles: 'مقالات',
  products: 'محصولات',
  categories: 'دسته‌بندی‌ها',
};

function getResourceType(path?: string): ResourceType {
  if (path?.startsWith('/blog/')) return 'articles';
  if (path?.startsWith('/product-category/')) return 'categories';
  if (path?.startsWith('/product/')) return 'products';
  return 'pages';
}

export default function PageSeoModal({
  selectedData,
  open,
  onOpenChange,
}: {
  selectedData: PageSeoResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useCreatePageSeo();
  const updateMutation = useUpdatePageSeo();
  const isEdit = !!selectedData;
  const [resourceType, setResourceType] = useState<ResourceType>(() =>
    getResourceType(selectedData?.path),
  );
  const [resourceSearch, setResourceSearch] = useState('');

  const { data: pageData } = useAdminPageSeoList({ all: true });
  const { data: blogData, isLoading: isLoadingBlogs } = useAdminBlogList(
    { all: true, search: resourceType === 'articles' ? resourceSearch : '' },
    { enabled: resourceType === 'articles' && open },
  );
  const { data: categoryData, isLoading: isLoadingCategories } =
    useAdminCategoriesList(
      { all: true, search: resourceType === 'categories' ? resourceSearch : '' },
      { enabled: resourceType === 'categories' && open },
    );
  const { data: productData, isLoading: isLoadingProducts } =
    useAdminProducsList(
      {
        all: true,
        search: resourceType === 'products' ? resourceSearch : '',
      },
      { enabled: resourceType === 'products' && open },
    );

  const methods = useForm<FormData>({
    defaultValues: {
      path: '',
      label: '',
      metaTitle: '',
      metaDescription: '',
      indexable: true,
      followable: true,
      redirectTo: '',
      includeInPageSitemap: false,
    },
    resolver: zodResolver(schema),
  });

  const { reset, control, setValue } = methods;
  const metaTitle = useWatch({ control, name: 'metaTitle' }) || '';
  const metaDescription = useWatch({ control, name: 'metaDescription' }) || '';
  const selectedPath = useWatch({ control, name: 'path' }) || '';

  const resources = useMemo(() => {
    if (resourceType === 'articles') {
      return (blogData?.data ?? []).map(item => ({
        path: `/blog/${item.slug}`,
        label: item.title,
      }));
    }
    if (resourceType === 'products') {
      return (productData?.data ?? []).map(item => ({
        path: `/product/${item.slug}`,
        label: item.title,
      }));
    }
    if (resourceType === 'categories') {
      return (categoryData?.data ?? []).map(item => ({
        path: `/product-category/${item.slug}`,
        label: item.name,
      }));
    }
    return (pageData?.data ?? [])
      .filter(
        item =>
          !item.path.startsWith('/blog/') &&
          !item.path.startsWith('/product/') &&
          !item.path.startsWith('/product-category/'),
      )
      .map(item => ({ path: item.path, label: item.label || item.path }));
  }, [
    blogData?.data,
    categoryData?.data,
    pageData?.data,
    productData?.data,
    resourceType,
  ]);

  const filteredResources = useMemo(() => {
    const needle = resourceSearch.trim().toLocaleLowerCase();
    if (!needle) return resources;
    return resources.filter(
      item =>
        item.label.toLocaleLowerCase().includes(needle) ||
        item.path.toLocaleLowerCase().includes(needle),
    );
  }, [resources, resourceSearch]);

  const isLoadingResources =
    (resourceType === 'articles' && isLoadingBlogs) ||
    (resourceType === 'products' && isLoadingProducts) ||
    (resourceType === 'categories' && isLoadingCategories);

  useEffect(() => {
    if (!open) return;

    if (selectedData) {
      reset({
        path: selectedData.path,
        label: selectedData.label || '',
        metaTitle: selectedData.metaTitle || '',
        metaDescription: selectedData.metaDescription || '',
        indexable: selectedData.indexable ?? true,
        followable: selectedData.followable ?? true,
        redirectTo: selectedData.redirectTo || '',
        includeInPageSitemap: selectedData.includeInPageSitemap ?? false,
      });
    } else {
      reset({
        path: '',
        label: '',
        metaTitle: '',
        metaDescription: '',
        indexable: true,
        followable: true,
        redirectTo: '',
        includeInPageSitemap: false,
      });
    }
  }, [open, selectedData, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      path: data.path.trim(),
      label: data.label?.trim() || '',
      metaTitle: data.metaTitle?.trim() || '',
      metaDescription: data.metaDescription?.trim() || '',
      indexable: data.indexable,
      followable: data.followable,
      redirectTo: data.redirectTo?.trim() || null,
      includeInPageSitemap: data.includeInPageSitemap,
    };

    try {
      if (isEdit && selectedData) {
        await updateMutation.mutateAsync({ id: selectedData.id, dto: payload });
        toast.success('تنظیمات سئوی صفحه ذخیره شد');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('صفحه به لیست سئو اضافه شد');
      }
      onOpenChange(false);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || 'ذخیره تنظیمات سئو ناموفق بود');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'ویرایش تنظیمات سئو' : 'افزودن صفحه به سئو'}
          </DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 py-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-6 text-blue-700">
              آدرس صفحه، مقاله یا محصول را انتخاب کنید؛ یا برای صفحه‌ای که در
              فهرست نیست، مسیر را دستی وارد کنید.
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع محتوا</label>
                <Select
                  value={resourceType}
                  onValueChange={value => {
                    setResourceType(value as ResourceType);
                    setResourceSearch('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(resourceLabels) as ResourceType[]).map(type => (
                      <SelectItem key={type} value={type}>
                        {resourceLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">انتخاب آدرس</label>
                <Input
                  value={resourceSearch}
                  onChange={event => setResourceSearch(event.target.value)}
                  placeholder="جستجوی عنوان یا آدرس"
                  className="mb-2"
                />
                <Select
                  value={resources.some(item => item.path === selectedPath) ? selectedPath : undefined}
                  onValueChange={value => {
                    const resource = resources.find(item => item.path === value);
                    if (!resource) return;
                    setValue('path', resource.path, { shouldValidate: true });
                    setValue('label', resource.label, { shouldDirty: true });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="صفحه، مقاله یا محصول را انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingResources ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        در حال بارگذاری...
                      </div>
                    ) : filteredResources.length ? (
                      filteredResources.slice(0, 250).map(item => (
                        <SelectItem key={item.path} value={item.path}>
                          <span className="max-w-[26rem] truncate">{item.label}</span>
                          <span dir="ltr" className="text-xs text-muted-foreground">
                            {item.path}
                          </span>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        موردی پیدا نشد؛ آدرس را پایین‌تر دستی وارد کنید.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RHFInput
                label="مسیر صفحه"
                name="path"
                isRequired
                dir="ltr"
                placeholder="/about-us یا /product/product-slug"
              />
              <RHFInput label="نام صفحه" name="label" placeholder="عنوان نمایشی" />
            </div>

            <div>
              <RHFInput
                label="متا تایتل"
                name="metaTitle"
                placeholder="مثال: درباره ما - زوپینی"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {metaTitle.length} کاراکتر (پیشنهاد: حداکثر ۶۰ کاراکتر)
              </p>
            </div>

            <div>
              <RHFTextArea
                label="متا دیسکریپشن"
                name="metaDescription"
                rows={3}
                placeholder="توضیح کوتاه و جذاب درباره‌ی این صفحه"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {metaDescription.length} کاراکتر (پیشنهاد: حداکثر ۱۶۰ کاراکتر)
              </p>
            </div>

            <section className="space-y-3 rounded-lg border p-4">
              <div>
                <h3 className="text-sm font-semibold">دسترسی موتورهای جستجو</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  کنترل کنید صفحه ایندکس شود و خزنده‌ها لینک‌های آن را دنبال کنند.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <RHFSwitch name="indexable" label="ایندکس شود (Index)" />
                <RHFSwitch name="followable" label="لینک‌ها دنبال شوند (Follow)" />
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
              <div>
                <h3 className="text-sm font-semibold">نقشه‌ی سایت صفحات</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  برای افزودن آدرس دستی یا لندینگ به فایل page-sitemap.xml این
                  گزینه را فعال کنید. آدرس ثبت‌شده با دامنه‌ی اصلی سایت منتشر
                  می‌شود؛ صفحات noindex یا دارای ریدایرکت منتشر نمی‌شوند.
                </p>
              </div>
              <RHFSwitch
                name="includeInPageSitemap"
                label="افزودن این آدرس به page-sitemap.xml"
              />
            </section>

            <section className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <div>
                <h3 className="text-sm font-semibold">ریدایرکت 301 دائمی</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  اگر مقصد وارد شود، بازدیدکننده و موتور جستجو پیش از نمایش صفحه
                  مستقیماً به مقصد منتقل می‌شوند. مقصد می‌تواند مسیر داخلی یا
                  آدرس کامل با http/https باشد.
                </p>
              </div>
              <RHFInput
                label="مقصد ریدایرکت (اختیاری)"
                name="redirectTo"
                dir="ltr"
                placeholder="/new-page یا https://example.com/new-page"
              />
            </section>

            <Button
              type="submit"
              loading={isSaving}
              size="lg"
              variant="dark"
              className="w-full"
            >
              {isEdit ? 'ذخیره تغییرات' : 'افزودن صفحه'}
            </Button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
