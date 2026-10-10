'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { useCreatePageSeo, useUpdatePageSeo } from '@/services/features/seo/hooks';
import { PageSeoResponse } from '@/services/features/seo/types';

import FormProvider from '../../form/form-provider';
import RHFInput from '../../form/rhf-input';
import RHFSwitch from '../../form/rhf-switch';
import RHFTextArea from '../../form/rhf-textarea';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

/** دامنه‌ی اصلی سایت؛ برای پیش‌نمایش آدرس و پیش‌نمایش گوگل */
const SITE_HOST = 'zoppinico.com';

/**
 * ورودی آدرس را یکدست می‌کند:
 * اگر کاربر آدرس کامل با دامنه پیست کرد، دامنه حذف می‌شود؛
 * اسلش ابتدایی اضافه و اسلش‌های انتهایی حذف می‌گردند.
 */
function normalizePathInput(raw: string): string {
  let value = raw.trim();

  if (!value) return value;

  const lower = value.toLowerCase();
  for (const origin of [
    `https://${SITE_HOST}`,
    `http://${SITE_HOST}`,
    `https://www.${SITE_HOST}`,
    `http://www.${SITE_HOST}`,
  ]) {
    if (lower.startsWith(origin)) {
      value = value.slice(origin.length);
      break;
    }
  }

  if (!value.startsWith('/')) value = `/${value}`;

  return value.length > 1 ? value.replace(/\/+$/, '') : value;
}

/** مقصد ریدایرکت باید مسیر داخلی یا آدرس کامل با http/https باشد */
function isValidRedirectTarget(value: string): boolean {
  if (value.startsWith('/')) {
    return !value.startsWith('//') && !value.includes('\\');
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** نمایش آدرس به شکل مسیر گوگل: zoppinico.com › about-us */
function breadcrumbFor(path: string): string {
  const segments = normalizePathInput(path || '')
    .split('/')
    .filter(Boolean);

  return [SITE_HOST, ...segments].join(' › ');
}

const schema = z
  .object({
    path: z
      .string()
      .trim()
      .min(1, 'آدرس صفحه اجباری است')
      .transform(value => normalizePathInput(value))
      .pipe(
        z
          .string()
          .regex(
            /^\/(?!\/)/,
            'آدرس باید مسیر داخلی سایت باشد (با یک / شروع شود)',
          ),
      ),
    label: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    indexable: z.boolean(),
    followable: z.boolean(),
    hasRedirect: z.boolean(),
    redirectTo: z.string().optional(),
    includeInPageSitemap: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.hasRedirect) return;

    const target = data.redirectTo?.trim() ?? '';

    if (!target) {
      ctx.addIssue({
        code: 'custom',
        path: ['redirectTo'],
        message: 'مقصد ریدایرکت را وارد کنید',
      });
    } else if (!isValidRedirectTarget(target)) {
      ctx.addIssue({
        code: 'custom',
        path: ['redirectTo'],
        message:
          'مقصد باید مسیر داخلی (مثل /products) یا آدرس کامل با http/https باشد',
      });
    }
  });

type FormData = z.infer<typeof schema>;

/** سربرگ شماره‌دار هر بخش فرم */
function SectionHeader({
  step,
  title,
  hint,
}: {
  step: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {step}
      </span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && (
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/** انتخاب «بله/خیر» برای ایندکس و فالو */
function RobotsToggle({
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  yesLabel: string;
  noLabel: string;
}) {
  const options = [
    { active: true, label: yesLabel },
    { active: false, label: noLabel },
  ];

  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1">
      {options.map(option => {
        const selected = value === option.active;

        return (
          <button
            key={String(option.active)}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.active)}
            className={cn(
              'rounded-md px-2 py-1.5 text-center text-sm font-medium transition-colors',
              selected
                ? option.active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-red-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-white/80',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
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

  const methods = useForm<FormData>({
    defaultValues: {
      path: '',
      label: '',
      metaTitle: '',
      metaDescription: '',
      indexable: true,
      followable: true,
      hasRedirect: false,
      redirectTo: '',
      includeInPageSitemap: false,
    },
    resolver: zodResolver(schema),
  });

  const { reset, control, setValue } = methods;
  const values = useWatch({ control });

  const metaTitle = values.metaTitle || '';
  const metaDescription = values.metaDescription || '';

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
        hasRedirect: !!selectedData.redirectTo,
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
        hasRedirect: false,
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
      redirectTo: data.hasRedirect ? (data.redirectTo?.trim() || null) : null,
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

  const robotsDirective = [
    (values.indexable ?? true) ? 'index' : 'noindex',
    (values.followable ?? true) ? 'follow' : 'nofollow',
  ].join(', ');

  // اگر ریدایرکت فعال یا صفحه نوایندکس باشد، آدرس در نقشه‌ی سایت منتشر نمی‌شود.
  const sitemapBlocked =
    values.includeInPageSitemap &&
    (!(values.indexable ?? true) || !!values.hasRedirect);

  const previewTitle = metaTitle || values.label || values.path;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'ویرایش تنظیمات سئو' : 'افزودن صفحه به سئو'}
          </DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="flex flex-col gap-6 py-2">
            {/* ── ۱. آدرس صفحه ─────────────────────────────── */}
            <section className="space-y-4">
              <SectionHeader
                step="۱"
                title="آدرس صفحه"
                hint="آدرس را وارد کنید؛ سئوی محصولات و مقالات در صفحه‌ی ویرایش خودشان تنظیم می‌شود."
              />

              <Controller
                name="path"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="path">
                      آدرس صفحه (URL)
                      <span className="text-red-500">*</span>
                    </FieldLabel>
                    <InputGroup dir="ltr" className="h-9">
                      <InputGroupAddon align="inline-start" className="text-xs">
                        {SITE_HOST}
                      </InputGroupAddon>
                      <InputGroupInput
                        id="path"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={() => {
                          field.onBlur();
                          setValue('path', normalizePathInput(field.value), {
                            shouldValidate: true,
                          });
                        }}
                        placeholder="/about-us"
                        aria-invalid={fieldState.invalid}
                        className="text-left"
                      />
                    </InputGroup>
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      values.path && (
                        <p
                          dir="ltr"
                          className="truncate text-left text-xs text-muted-foreground"
                        >
                          https://{SITE_HOST}
                          {normalizePathInput(values.path)}
                        </p>
                      )
                    )}
                  </Field>
                )}
              />

              <RHFInput
                label="نام صفحه (فقط برای نمایش در همین لیست)"
                name="label"
                placeholder="مثال: درباره ما"
              />
            </section>

            {/* ── ۲. تایتل و توضیحات ───────────────────────── */}
            <section className="space-y-4 rounded-xl border p-4">
              <SectionHeader
                step="۲"
                title="تایتل و توضیحات"
                hint="این متن‌ها در نتایج گوگل و سربرگ صفحه نمایش داده می‌شوند. اگر خالی بمانند، مقدار پیش‌فرض خود صفحه استفاده می‌شود."
              />

              <div>
                <RHFInput
                  label="متا تایتل"
                  name="metaTitle"
                  placeholder="مثال: درباره ما - زوپینی"
                />
                <p
                  className={cn(
                    'mt-1 text-xs',
                    metaTitle.length > 60
                      ? 'font-medium text-amber-600'
                      : 'text-muted-foreground',
                  )}
                >
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
                <p
                  className={cn(
                    'mt-1 text-xs',
                    metaDescription.length > 160
                      ? 'font-medium text-amber-600'
                      : 'text-muted-foreground',
                  )}
                >
                  {metaDescription.length} کاراکتر (پیشنهاد: حداکثر ۱۶۰ کاراکتر)
                </p>
              </div>

              {/* پیش‌نمایش گوگل */}
              <div className="space-y-2 rounded-lg border border-dashed bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  پیش‌نمایش در گوگل
                </p>
                <div dir="ltr" className="space-y-0.5 px-1 text-left">
                  <p className="truncate text-xs text-emerald-800">
                    {breadcrumbFor(values.path || '')}
                  </p>
                  <p className="truncate text-base font-medium text-[#1a0dab]">
                    {previewTitle || 'عنوان صفحه اینجا نمایش داده می‌شود'}
                  </p>
                  <p className="line-clamp-2 text-xs leading-5 text-gray-600">
                    {metaDescription ||
                      'اگر توضیحی وارد نکنید، توضیح پیش‌فرض خود صفحه نمایش داده می‌شود.'}
                  </p>
                </div>
              </div>
            </section>

            {/* ── ۳. ربات‌های گوگل ─────────────────────────── */}
            <section className="space-y-4 rounded-xl border p-4">
              <SectionHeader
                step="۳"
                title="ربات‌های گوگل"
                hint="مشخص کنید این آدرس ایندکس شود و لینک‌هایش دنبال شوند یا نه."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">ایندکس</span>
                  <RobotsToggle
                    value={values.indexable ?? true}
                    onChange={value =>
                      setValue('indexable', value, { shouldDirty: true })
                    }
                    yesLabel="ایندکس شود"
                    noLabel="ایندکس نشود"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">فالو</span>
                  <RobotsToggle
                    value={values.followable ?? true}
                    onChange={value =>
                      setValue('followable', value, { shouldDirty: true })
                    }
                    yesLabel="فالو شود"
                    noLabel="فالو نشود"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                خروجی سربرگ صفحه:
                <Badge variant="secondary" dir="ltr">
                  {robotsDirective}
                </Badge>
              </div>
            </section>

            {/* ── ۴. ریدایرکت ──────────────────────────────── */}
            <section className="space-y-3 rounded-xl border p-4">
              <SectionHeader
                step="۴"
                title="ریدایرکت ۳۰۱ دائمی"
                hint="اگر فعال شود، بازدیدکننده و ربات‌ها پیش از دیدن این صفحه مستقیماً به مقصد منتقل می‌شوند."
              />

              <RHFSwitch
                name="hasRedirect"
                label="این آدرس ریدایرکت دارد"
              />

              {values.hasRedirect && (
                <RHFInput
                  label="مقصد ریدایرکت"
                  name="redirectTo"
                  isRequired
                  dir="ltr"
                  className="text-left"
                  placeholder="/new-page یا https://example.com/new-page"
                />
              )}
            </section>

            {/* ── ۵. نقشه‌ی سایت ─────────────────────────── */}
            <section className="space-y-3 rounded-xl border p-4">
              <SectionHeader
                step="۵"
                title="نقشه‌ی سایت"
                hint="با فعال کردن این گزینه، آدرس در فایل page-sitemap.xml با دامنه‌ی اصلی سایت منتشر می‌شود."
              />

              <RHFSwitch
                name="includeInPageSitemap"
                label="این آدرس در نقشه‌ی سایت (page-sitemap.xml) منتشر شود"
              />

              {sitemapBlocked && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    این آدرس به دلیل{' '}
                    {values.hasRedirect
                      ? 'فعال بودن ریدایرکت'
                      : 'غیرفعال بودن ایندکس'}{' '}
                    در نقشه‌ی سایت منتشر نمی‌شود.
                  </span>
                </div>
              )}
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
