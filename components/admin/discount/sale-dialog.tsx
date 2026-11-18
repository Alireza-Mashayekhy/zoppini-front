'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { PersianDatePicker } from '@/components/form/persian-date-picker';
import RHFPriceInput from '@/components/form/rhf-price-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAdminDiscount } from '@/services/features/discounts/admin.hooks';
import {
  CreateDiscountDto,
  DiscountKind,
  DiscountType,
} from '@/services/features/discounts/types';

import DiscountSelectDialog from './select-dialog';
import {
  formatPrice,
  persianDateToISO,
  toPersianDate,
} from './utils';

type SaleFormValues = {
  title: string;

  type: DiscountType;

  value: number | '';

  maxDiscountAmount: number | '';

  startsAt: string;

  expiresAt: string;

  isActive: boolean;

  productIds: number[];

  categoryIds: number[];

  /** اعمال روی همهٔ محصولات */
  appliesToAllProducts: boolean;

  /** مرحلهٔ تخفیف متوالی */
  stackable: boolean;

  /** ترتیب مرحله (۰ = زودترین) */
  stackPriority: number | '';

  /** نمونهٔ قیمت برای پیش‌نمایش محاسبه */
  previewPrice: number | '';
};

const EMPTY_VALUES: SaleFormValues = {
  title: '',
  type: DiscountType.PERCENTAGE,
  value: '',
  maxDiscountAmount: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
  productIds: [],
  categoryIds: [],
  appliesToAllProducts: false,
  stackable: false,
  stackPriority: 0,
  previewPrice: 10_000_000,
};

interface Props {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  discountId?: number;

  onSubmit: (data: CreateDiscountDto) => void;

  isPending?: boolean;
}

export default function SaleDialog({
  open,
  onOpenChange,
  discountId,
  onSubmit,
  isPending = false,
}: Props) {
  const isEdit = !!discountId;

  const { data: discount } = useAdminDiscount(discountId);

  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const methods = useForm<SaleFormValues>({
    defaultValues: EMPTY_VALUES,
  });

  const { register, handleSubmit, setValue, reset, control } = methods;

  const type = useWatch({ control, name: 'type' });

  const productIds = useWatch({ control, name: 'productIds' });

  const categoryIds = useWatch({ control, name: 'categoryIds' });

  const isActive = useWatch({ control, name: 'isActive' });

  const appliesToAllProducts = useWatch({
    control,
    name: 'appliesToAllProducts',
  });

  const stackable = useWatch({ control, name: 'stackable' });

  const stackPriority = useWatch({ control, name: 'stackPriority' });

  const previewPrice = useWatch({ control, name: 'previewPrice' });

  const value = useWatch({ control, name: 'value' });

  // =========================================================
  // Edit / Create reset
  // =========================================================

  useEffect(() => {
    if (!open) return;

    const data = discount?.data;

    if (data && isEdit) {
      reset({
        title: data.title ?? data.code ?? '',

        type: data.type,

        value: data.value != null ? Number(data.value) : '',

        maxDiscountAmount:
          data.maxDiscountAmount != null ? Number(data.maxDiscountAmount) : '',

        startsAt: toPersianDate(data.startsAt),

        expiresAt: toPersianDate(data.expiresAt),

        isActive: data.isActive,

        productIds: data.products?.map(product => product.id) ?? [],

        categoryIds: data.categories?.map(category => category.id) ?? [],

        appliesToAllProducts: data.appliesToAllProducts ?? false,

        stackable: data.stackable ?? false,

        stackPriority: data.stackPriority ?? 0,

        previewPrice: 10_000_000,
      });

      return;
    }

    reset(EMPTY_VALUES);
  }, [discount, isEdit, open, reset]);

  // =========================================================
  // Submit
  // =========================================================

  const submit = (values: SaleFormValues) => {
    if (!values.title.trim()) {
      toast.error('عنوان فروش ویژه الزامی است.');
      return;
    }

    if (values.value === '' || values.value === undefined) {
      toast.error('مقدار تخفیف را وارد کنید.');
      return;
    }

    if (Number(values.value) <= 0) {
      toast.error('مقدار تخفیف باید بیشتر از صفر باشد.');
      return;
    }

    if (values.type === DiscountType.PERCENTAGE && Number(values.value) > 100) {
      toast.error('درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.');
      return;
    }

    if (
      !values.appliesToAllProducts &&
      values.productIds.length === 0 &&
      values.categoryIds.length === 0
    ) {
      toast.error(
        'حداقل یک محصول یا دسته‌بندی انتخاب کنید یا «همهٔ محصولات» را فعال کنید.',
      );
      return;
    }

    if (values.stackable) {
      const priority = Number(values.stackPriority || 0);

      if (
        !Number.isInteger(priority) ||
        priority < 0 ||
        priority > 1000
      ) {
        toast.error('ترتیب مرحله باید عددی صحیح بین ۰ تا ۱۰۰۰ باشد.');
        return;
      }
    }

    if (!values.startsAt || !values.expiresAt) {
      toast.error('بازهٔ فروش را مشخص کنید.');
      return;
    }

    const startsAt = persianDateToISO(values.startsAt, false);

    const expiresAt = persianDateToISO(values.expiresAt, true);

    if (!startsAt || !expiresAt) {
      toast.error('تاریخ وارد شده معتبر نیست.');
      return;
    }

    if (new Date(expiresAt) <= new Date(startsAt)) {
      toast.error('تاریخ پایان باید بعد از تاریخ شروع باشد.');
      return;
    }

    const dto: CreateDiscountDto = {
      kind: DiscountKind.SALE,

      title: values.title.trim(),

      type: values.type,

      value: Number(values.value),

      maxDiscountAmount:
        values.type === DiscountType.PERCENTAGE &&
        values.maxDiscountAmount !== ''
          ? Number(values.maxDiscountAmount)
          : undefined,

      startsAt,

      expiresAt,

      isActive: values.isActive,

      productIds: values.productIds,

      categoryIds: values.categoryIds,

      // تخفیف متوالی: سرور هم مستقل همین قواعد را اعتبارسنجی می‌کند.
      appliesToAllProducts: values.appliesToAllProducts,

      stackable: values.stackable,

      stackPriority: values.stackable
        ? Number(values.stackPriority || 0)
        : 0,
    };

    onSubmit(dto);
  };

  // =========================================================
  // پیش‌نمایش مرحله (فقط برای نمایش؛ محاسبهٔ واقعی سمت سرور است)
  // =========================================================

  const previewBase = Number(previewPrice) || 0;

  const previewValue = Number(value) || 0;

  const previewDiscount =
    type === DiscountType.PERCENTAGE
      ? (previewBase * Math.min(100, Math.max(0, previewValue))) / 100
      : previewValue;

  const previewFinal = Math.max(
    0,
    previewBase - Math.min(previewBase, previewDiscount),
  );

  // =========================================================
  // Render
  // =========================================================

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          dir="rtl"
          className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'ویرایش فروش ویژه' : 'ایجاد فروش ویژه'}
            </DialogTitle>
          </DialogHeader>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(submit)} className="space-y-6">
              {/* اطلاعات اصلی */}

              <section className="space-y-4">
                <h3 className="font-semibold">اطلاعات اصلی</h3>

                <div className="space-y-2">
                  <Label htmlFor="title">عنوان فروش ویژه</Label>

                  <Input
                    id="title"
                    placeholder="مثلاً حراج پاییزه"
                    {...register('title')}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>نوع تخفیف</Label>

                    <Select
                      value={type}
                      onValueChange={value => {
                        setValue('type', value as DiscountType, {
                          shouldDirty: true,
                        });

                        // سقف تخفیف فقط برای درصدی معنی دارد
                        if (value === DiscountType.FIXED) {
                          setValue('maxDiscountAmount', '');
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value={DiscountType.PERCENTAGE}>
                          درصدی
                        </SelectItem>

                        <SelectItem value={DiscountType.FIXED}>
                          مبلغ ثابت (از قیمت هر محصول)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <RHFPriceInput
                    name="value"
                    label={
                      type === DiscountType.PERCENTAGE
                        ? 'مقدار تخفیف (درصد)'
                        : 'مقدار تخفیف (تومان)'
                    }
                    placeholder={
                      type === DiscountType.PERCENTAGE ? '20' : '100,000'
                    }
                  />
                </div>

                {type === DiscountType.PERCENTAGE && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <RHFPriceInput
                      name="maxDiscountAmount"
                      label="سقف مبلغ تخفیف برای هر محصول (اختیاری)"
                      placeholder="200,000"
                    />
                  </div>
                )}
              </section>

              {/* نحوهٔ اعمال: دامنه و تخفیف متوالی */}

              <section className="space-y-4 rounded-lg border p-4">
                <div>
                  <h3 className="font-semibold">نحوهٔ اعمال تخفیف</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    می‌توانید این فروش ویژه را روی همهٔ محصولات اعمال کنید یا
                    فقط روی محصولات/دسته‌های انتخاب‌شده. با فعال‌کردن «تخفیف
                    متوالی»، این فروش ویژه به‌عنوان یک مرحلهٔ جدید روی مبلغ
                    باقی‌ماندهٔ مرحلهٔ قبلی اعمال می‌شود.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">اعمال روی همهٔ محصولات</div>

                    <div className="text-sm text-muted-foreground">
                      بدون نیاز به انتخاب محصول یا دسته‌بندی
                    </div>
                  </div>

                  <Switch
                    checked={appliesToAllProducts}
                    onCheckedChange={checked =>
                      setValue('appliesToAllProducts', checked, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      تخفیف متوالی (مرحله‌ای)
                    </div>

                    <div className="text-sm text-muted-foreground">
                      هر مرحله روی مبلغ باقی‌ماندهٔ مرحلهٔ قبل اعمال می‌شود، نه
                      روی قیمت اولیه
                    </div>
                  </div>

                  <Switch
                    checked={stackable}
                    onCheckedChange={checked =>
                      setValue('stackable', checked, { shouldDirty: true })
                    }
                  />
                </div>

                {stackable && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="stackPriority">ترتیب مرحله</Label>

                        <Input
                          id="stackPriority"
                          type="number"
                          min={0}
                          max={1000}
                          value={stackPriority}
                          onChange={event =>
                            setValue(
                              'stackPriority',
                              event.target.value === ''
                                ? ''
                                : Number(event.target.value),
                              { shouldDirty: true },
                            )
                          }
                        />

                        <p className="text-xs text-muted-foreground">
                          عدد کوچک‌تر زودتر اعمال می‌شود؛ ۰ = مرحلهٔ اول،
                          ۱ = مرحلهٔ دوم و به همین ترتیب (۰ تا ۱۰۰۰).
                        </p>
                      </div>

                      <RHFPriceInput
                        name="previewPrice"
                        label="پیش‌نمایش روی مبلغ (تومان)"
                        placeholder="10,000,000"
                      />
                    </div>

                    <div className="space-y-1 rounded-md bg-muted p-3 text-sm">
                      <div>
                        اگر این مرحله روی مبلغ{' '}
                        <span className="font-semibold">
                          {formatPrice(previewBase)}
                        </span>{' '}
                        اعمال شود، مبلغ باقی‌مانده{' '}
                        <span className="font-semibold">
                          {formatPrice(previewFinal)}
                        </span>{' '}
                        می‌شود.
                      </div>

                      <div className="text-xs text-muted-foreground">
                        مثال: ۱۰٬۰۰۰٬۰۰۰ تومان با ۵۰٪ ← ۵٬۰۰۰٬۰۰۰؛ مرحلهٔ بعد
                        با ۲۰٪ ← ۴٬۰۰۰٬۰۰۰ (تخفیف مؤثر ۶۰٪، نه ۷۰٪).
                      </div>
                    </div>
                  </>
                )}
              </section>

              {/* محصولات و دسته‌ها */}

              <section className="space-y-4">
                <div>
                  <h3 className="font-semibold">محصولات مشمول</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {appliesToAllProducts
                      ? 'این فروش ویژه روی همهٔ محصولات اعمال می‌شود؛ انتخاب محصول یا دسته لازم نیست.'
                      : 'محصولات یا دسته‌بندی‌های مشمول فروش ویژه را انتخاب کنید (حداقل یکی). با انتخاب یک دسته، زیرمجموعه‌های آن هم شامل می‌شوند.'}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={appliesToAllProducts}
                    onClick={() => setProductDialogOpen(true)}
                  >
                    {productIds.length > 0
                      ? `${productIds.length} محصول انتخاب شده`
                      : 'انتخاب محصولات'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={appliesToAllProducts}
                    onClick={() => setCategoryDialogOpen(true)}
                  >
                    {categoryIds.length > 0
                      ? `${categoryIds.length} دسته‌بندی انتخاب شده`
                      : 'انتخاب دسته‌بندی‌ها'}
                  </Button>
                </div>
              </section>

              {/* بازه */}

              <section className="space-y-4">
                <div>
                  <h3 className="font-semibold">بازه فروش ویژه</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    در این بازه قیمت محصولات انتخاب‌شده به‌صورت خودکار کاهش
                    می‌یابد، نشان تخفیف می‌گیرند و در صفحهٔ فروش ویژه نمایش داده
                    می‌شوند.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <PersianDatePicker
                    name="startsAt"
                    label="شروع فروش"
                    required
                  />

                  <PersianDatePicker
                    name="expiresAt"
                    label="پایان فروش"
                    required
                  />
                </div>
              </section>

              {/* وضعیت */}

              <section className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">فعال بودن فروش ویژه</div>

                  <div className="text-sm text-muted-foreground">
                    فروش‌های غیرفعال اعمال نمی‌شوند
                  </div>
                </div>

                <Switch
                  checked={isActive}
                  onCheckedChange={value =>
                    setValue('isActive', value, {
                      shouldDirty: true,
                    })
                  }
                />
              </section>

              {/* Actions */}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  انصراف
                </Button>

                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}

                  {isEdit ? 'ذخیره تغییرات' : 'ایجاد فروش ویژه'}
                </Button>
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <DiscountSelectDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        type="products"
        title="انتخاب محصولات"
        selectedIds={productIds}
        onConfirm={ids => setValue('productIds', ids, { shouldDirty: true })}
      />

      <DiscountSelectDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        type="categories"
        title="انتخاب دسته‌بندی‌ها"
        selectedIds={categoryIds}
        onConfirm={ids => setValue('categoryIds', ids, { shouldDirty: true })}
      />
    </>
  );
}
