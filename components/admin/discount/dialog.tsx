'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

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
  DiscountType,
} from '@/services/features/discounts/types';

import DiscountSelectDialog from './select-dialog';

type DiscountFormValues = {
  code: string;

  type: DiscountType;

  value: number | '';

  maxDiscountAmount: number | '';

  minOrderAmount: number | '';

  startsAt: string;

  expiresAt: string;

  isActive: boolean;

  userIds: number[];

  productIds: number[];

  categoryIds: number[];
};

interface Props {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  discountId?: number;

  onSubmit: (data: CreateDiscountDto) => void;

  isPending?: boolean;
}

export default function DiscountDialog({
  open,
  onOpenChange,
  discountId,
  onSubmit,
  isPending = false,
}: Props) {
  const isEdit = !!discountId;

  const { data: discount } = useAdminDiscount(discountId);

  // =========================================================
  // Selection dialogs
  // =========================================================

  const [userDialogOpen, setUserDialogOpen] = useState(false);

  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // =========================================================
  // RHF
  // =========================================================

  const methods = useForm<DiscountFormValues>({
    defaultValues: {
      code: '',

      type: DiscountType.PERCENTAGE,

      value: '',

      maxDiscountAmount: '',

      minOrderAmount: '',

      startsAt: '',

      expiresAt: '',

      isActive: true,

      userIds: [],

      productIds: [],

      categoryIds: [],
    },
  });

  const {
    register,

    handleSubmit,

    setValue,

    reset,

    control,

    formState: { errors },
  } = methods;

  // =========================================================
  // Watch
  // =========================================================

  const type = useWatch({
    control,

    name: 'type',
  });

  const userIds = useWatch({
    control,

    name: 'userIds',
  });

  const productIds = useWatch({
    control,

    name: 'productIds',
  });

  const categoryIds = useWatch({
    control,

    name: 'categoryIds',
  });

  const isActive = useWatch({
    control,

    name: 'isActive',
  });

  // =========================================================
  // Selection state
  // =========================================================

  const hasUsers = userIds?.length > 0;

  const hasProductsOrCategories =
    productIds?.length > 0 || categoryIds?.length > 0;

  // =========================================================
  // Edit / Create reset
  // =========================================================

  useEffect(() => {
    if (!open) return;

    if (discount) {
      reset({
        code: discount?.data?.code ?? '',

        type: discount?.data?.type,

        value:
          discount?.data?.value != null ? Number(discount?.data?.value) : '',

        maxDiscountAmount:
          discount?.data?.maxDiscountAmount != null
            ? Number(discount?.data?.maxDiscountAmount)
            : '',

        minOrderAmount:
          discount?.data?.minOrderAmount != null
            ? Number(discount?.data?.minOrderAmount)
            : '',

        startsAt: toPersianDate(discount?.data?.startsAt),

        expiresAt: toPersianDate(discount?.data?.expiresAt),

        isActive: discount?.data?.isActive,

        userIds: discount?.data?.users?.map(user => user.id) ?? [],

        productIds: discount?.data?.products?.map(product => product.id) ?? [],

        categoryIds:
          discount?.data?.categories?.map(category => category.id) ?? [],
      });

      return;
    }

    reset({
      code: '',

      type: DiscountType.PERCENTAGE,

      value: '',

      maxDiscountAmount: '',

      minOrderAmount: '',

      startsAt: '',

      expiresAt: '',

      isActive: true,

      userIds: [],

      productIds: [],

      categoryIds: [],
    });
  }, [discount, open, reset]);

  // =========================================================
  // Submit
  // =========================================================

  const submit = (values: DiscountFormValues) => {
    if (!values.code.trim()) {
      return;
    }

    if (values.value === '' || values.value === undefined) {
      return;
    }

    if (!values.startsAt || !values.expiresAt) {
      return;
    }

    // -------------------------------------------------------
    // Validate percentage
    // -------------------------------------------------------

    if (values.type === DiscountType.PERCENTAGE && Number(values.value) > 100) {
      return;
    }

    // -------------------------------------------------------
    // Validate dates
    // -------------------------------------------------------

    const startsAt = persianDateToISO(values.startsAt, false);

    const expiresAt = persianDateToISO(values.expiresAt, true);

    if (!startsAt || !expiresAt) {
      return;
    }

    // -------------------------------------------------------
    // DTO
    // -------------------------------------------------------

    const dto: CreateDiscountDto = {
      code: values.code.trim().toUpperCase(),

      type: values.type,

      value: Number(values.value),

      maxDiscountAmount:
        values.maxDiscountAmount !== ''
          ? Number(values.maxDiscountAmount)
          : undefined,

      minOrderAmount:
        values.minOrderAmount !== ''
          ? Number(values.minOrderAmount)
          : undefined,

      startsAt,

      expiresAt,

      isActive: values.isActive,

      // خالی = همه کاربران
      userIds: values.userIds.length > 0 ? values.userIds : undefined,

      // خالی = همه محصولات
      productIds: values.productIds.length > 0 ? values.productIds : undefined,

      // خالی = همه دسته‌ها
      categoryIds:
        values.categoryIds.length > 0 ? values.categoryIds : undefined,
    };

    onSubmit(dto);
  };

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
              {isEdit ? 'ویرایش کد تخفیف' : 'ایجاد کد تخفیف'}
            </DialogTitle>
          </DialogHeader>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(submit)} className="space-y-6">
              {/* ================================================= */}
              {/* اطلاعات اصلی */}
              {/* ================================================= */}

              <section className="space-y-4">
                <h3 className="font-semibold">اطلاعات اصلی</h3>

                {/* Code */}

                <div className="space-y-2">
                  <Label htmlFor="code">کد تخفیف</Label>

                  <Input
                    id="code"
                    dir="ltr"
                    placeholder="مثلاً SUMMER20"
                    {...register('code', {
                      required: 'کد تخفیف الزامی است',
                    })}
                    onChange={event => {
                      setValue('code', event.target.value.toUpperCase(), {
                        shouldDirty: true,

                        shouldTouch: true,

                        shouldValidate: true,
                      });
                    }}
                  />

                  {errors.code && (
                    <p className="text-sm text-destructive">
                      {errors.code.message}
                    </p>
                  )}
                </div>

                {/* Type + Value */}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>نوع تخفیف</Label>

                    <Select
                      value={type}
                      onValueChange={value => {
                        setValue('type', value as DiscountType, {
                          shouldDirty: true,

                          shouldValidate: true,
                        });

                        // اگر نوع fixed شد سقف درصدی را پاک کن
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
                          مبلغ ثابت
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
              </section>

              {/* ================================================= */}
              {/* محدودیت مبلغ */}
              {/* ================================================= */}

              <section className="space-y-4">
                <h3 className="font-semibold">محدودیت مبلغ</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <RHFPriceInput
                    name="minOrderAmount"
                    label="حداقل مبلغ سفارش"
                    placeholder="500,000"
                  />

                  {type === DiscountType.PERCENTAGE && (
                    <RHFPriceInput
                      name="maxDiscountAmount"
                      label="سقف مبلغ تخفیف"
                      placeholder="200,000"
                    />
                  )}
                </div>
              </section>

              {/* ================================================= */}
              {/* زمان */}
              {/* ================================================= */}

              <section className="space-y-4">
                <h3 className="font-semibold">بازه اعتبار</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <PersianDatePicker
                    name="startsAt"
                    label="شروع اعتبار"
                    required
                  />

                  <PersianDatePicker
                    name="expiresAt"
                    label="پایان اعتبار"
                    required
                  />
                </div>
              </section>

              {/* ================================================= */}
              {/* وضعیت */}
              {/* ================================================= */}

              <section className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">فعال بودن کد تخفیف</div>

                  <div className="text-sm text-muted-foreground">
                    کدهای غیرفعال قابل استفاده نیستند
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

              {/* ================================================= */}
              {/* محدوده اعمال */}
              {/* ================================================= */}

              <section className="space-y-4">
                <div>
                  <h3 className="font-semibold">محدوده اعمال تخفیف</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    کد تخفیف یا برای کاربران خاص است، یا روی محصولات و
                    دسته‌بندی‌های انتخابی اعمال می‌شود.
                  </p>
                </div>

                {/* ================================================= */}
                {/* Users */}
                {/* ================================================= */}

                <div
                  className={[
                    'rounded-lg border p-4 transition',
                    hasProductsOrCategories ? 'bg-muted/40 opacity-60' : '',
                  ].join(' ')}
                >
                  <div className="mb-3">
                    <div className="font-medium">کاربران مجاز</div>

                    <div className="text-sm text-muted-foreground">
                      اگر کاربر انتخاب شود، کد فقط برای همان کاربران قابل
                      استفاده است.
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={hasProductsOrCategories}
                    onClick={() => setUserDialogOpen(true)}
                  >
                    {userIds.length > 0
                      ? `${userIds.length} کاربر انتخاب شده`
                      : 'انتخاب کاربران'}
                  </Button>

                  {hasProductsOrCategories && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      ابتدا محصولات و دسته‌بندی‌ها را حذف کنید تا بتوانید
                      کاربران را انتخاب کنید.
                    </p>
                  )}
                </div>

                {/* ================================================= */}
                {/* Products + Categories */}
                {/* ================================================= */}

                <div
                  className={[
                    'rounded-lg border p-4 transition',
                    hasUsers ? 'bg-muted/40 opacity-60' : '',
                  ].join(' ')}
                >
                  <div className="mb-4">
                    <div className="font-medium">محصولات و دسته‌بندی‌ها</div>

                    <div className="text-sm text-muted-foreground">
                      می‌توانید محصول و دسته‌بندی را همزمان انتخاب کنید.
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Product */}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={hasUsers}
                      onClick={() => setProductDialogOpen(true)}
                    >
                      {productIds.length > 0
                        ? `${productIds.length} محصول انتخاب شده`
                        : 'انتخاب محصولات'}
                    </Button>

                    {/* Category */}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={hasUsers}
                      onClick={() => setCategoryDialogOpen(true)}
                    >
                      {categoryIds.length > 0
                        ? `${categoryIds.length} دسته‌بندی انتخاب شده`
                        : 'انتخاب دسته‌بندی‌ها'}
                    </Button>
                  </div>

                  {hasUsers && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      ابتدا کاربران را حذف کنید تا بتوانید محصول یا دسته‌بندی
                      انتخاب کنید.
                    </p>
                  )}
                </div>

                {/* ================================================= */}
                {/* Empty */}
                {/* ================================================= */}

                {!hasUsers && !hasProductsOrCategories && (
                  <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    در صورت عدم انتخاب کاربر، محصول یا دسته‌بندی، کد برای همه
                    کاربران و همه محصولات قابل استفاده خواهد بود.
                  </div>
                )}
              </section>

              {/* ================================================= */}
              {/* Actions */}
              {/* ================================================= */}

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

                  {isEdit ? 'ذخیره تغییرات' : 'ایجاد کد تخفیف'}
                </Button>
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <DiscountSelectDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        type="users"
        title="انتخاب کاربران"
        selectedIds={userIds}
        onConfirm={ids => {
          setValue('userIds', ids);

          // User OR Product/Category
          if (ids.length > 0) {
            setValue('productIds', []);
            setValue('categoryIds', []);
          }
        }}
      />

      <DiscountSelectDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        type="products"
        title="انتخاب محصولات"
        selectedIds={productIds}
        onConfirm={ids => {
          setValue('productIds', ids);

          // اگر محصول انتخاب شد، User پاک شود
          if (ids.length > 0) {
            setValue('userIds', []);
          }
        }}
      />

      <DiscountSelectDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        type="categories"
        title="انتخاب دسته‌بندی‌ها"
        selectedIds={categoryIds}
        onConfirm={ids => {
          setValue('categoryIds', ids);

          // اگر دسته‌بندی انتخاب شد، User پاک شود
          if (ids.length > 0) {
            setValue('userIds', []);
          }
        }}
      />
    </>
  );
}

/* ============================================================= */
/* Helpers                                                        */
/* ============================================================= */

/**
 * تبدیل تاریخ میلادی به تاریخ شمسی
 * برای مقدار اولیه PersianDatePicker
 */
function toPersianDate(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find(part => part.type === 'year')?.value;

  const month = parts.find(part => part.type === 'month')?.value;

  const day = parts.find(part => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return '';
  }

  return `${year}/${month}/${day}`;
}

/**
 * تبدیل تاریخ شمسی ذخیره‌شده در فرم
 * به ISO برای ارسال به NestJS
 */
function persianDateToISO(value: string, isEndOfDay = false) {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('/').map(Number);

  if (!year || !month || !day) {
    return '';
  }

  const date = new DateObject({
    calendar: persian,
    year,
    month,
    day,
  }).toDate();

  if (isEndOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date.toISOString();
}
