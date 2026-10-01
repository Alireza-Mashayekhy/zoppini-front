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
import { persianDateToISO, toPersianDate } from './utils';

type CodeFormValues = {
  code: string;

  type: DiscountType;

  value: number | '';

  maxDiscountAmount: number | '';

  minOrderAmount: number | '';

  startsAt: string;

  expiresAt: string;

  isActive: boolean;

  maxUsesPerUser: number | '';

  unlimitedPerUser: boolean;

  maxTotalUses: number | '';

  excludeSaleItems: boolean;

  userIds: number[];

  excludedProductIds: number[];

  excludedCategoryIds: number[];
};

const EMPTY_VALUES: CodeFormValues = {
  code: '',
  type: DiscountType.PERCENTAGE,
  value: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
  maxUsesPerUser: 1,
  unlimitedPerUser: false,
  maxTotalUses: '',
  excludeSaleItems: false,
  userIds: [],
  excludedProductIds: [],
  excludedCategoryIds: [],
};

interface Props {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  discountId?: number;

  onSubmit: (data: CreateDiscountDto) => void;

  isPending?: boolean;
}

export default function DiscountCodeDialog({
  open,
  onOpenChange,
  discountId,
  onSubmit,
  isPending = false,
}: Props) {
  const isEdit = !!discountId;

  const { data: discount } = useAdminDiscount(discountId);

  const [userDialogOpen, setUserDialogOpen] = useState(false);

  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const methods = useForm<CodeFormValues>({
    defaultValues: EMPTY_VALUES,
  });

  const {
    register,

    handleSubmit,

    setValue,

    reset,

    control,

    formState: { errors },
  } = methods;

  const type = useWatch({ control, name: 'type' });

  const userIds = useWatch({ control, name: 'userIds' });

  const excludedProductIds = useWatch({
    control,

    name: 'excludedProductIds',
  });

  const excludedCategoryIds = useWatch({
    control,

    name: 'excludedCategoryIds',
  });

  // =========================================================
  // Selection state
  // =========================================================
  const isActive = useWatch({ control, name: 'isActive' });

  const unlimitedPerUser = useWatch({ control, name: 'unlimitedPerUser' });

  const excludeSaleItems = useWatch({ control, name: 'excludeSaleItems' });

  // =========================================================
  // Edit / Create reset
  // =========================================================

  useEffect(() => {
    if (!open) return;

    const data = discount?.data;

    if (data && isEdit) {
      reset({
        code: data.code ?? '',

        type: data.type,

        value: data.value != null ? Number(data.value) : '',

        maxDiscountAmount:
          data.maxDiscountAmount != null ? Number(data.maxDiscountAmount) : '',

        minOrderAmount:
          data.minOrderAmount != null ? Number(data.minOrderAmount) : '',

        startsAt: toPersianDate(data.startsAt),

        expiresAt: toPersianDate(data.expiresAt),

        isActive: data.isActive,

        unlimitedPerUser: data.maxUsesPerUser == null,

        maxUsesPerUser:
          data.maxUsesPerUser != null ? Number(data.maxUsesPerUser) : 1,

        maxTotalUses:
          data.maxTotalUses != null ? Number(data.maxTotalUses) : '',

        excludeSaleItems: !!data.excludeSaleItems,

        userIds: data.users?.map(user => user.id) ?? [],

        excludedProductIds: data.excludedProducts?.map(item => item.id) ?? [],

        excludedCategoryIds:
          data.excludedCategories?.map(item => item.id) ?? [],
      });

      return;
    }
    reset(EMPTY_VALUES);
  }, [discount, isEdit, open, reset]);

  // =========================================================
  // Submit
  // =========================================================

  const submit = (values: CodeFormValues) => {
    if (!values.code.trim()) {
      toast.error('کد تخفیف الزامی است.');
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

    // -------------------------------------------------------
    // Validate percentage
    // -------------------------------------------------------

    if (values.type === DiscountType.PERCENTAGE && Number(values.value) > 100) {
      toast.error('درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.');
      return;
    }

    if (!values.startsAt || !values.expiresAt) {
      toast.error('بازهٔ اعتبار را مشخص کنید.');
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

    if (
      !values.unlimitedPerUser &&
      (values.maxUsesPerUser === '' || Number(values.maxUsesPerUser) < 1)
    ) {
      toast.error('تعداد دفعات مجاز برای هر کاربر باید حداقل ۱ باشد.');
      return;
    }

    if (values.maxTotalUses !== '' && Number(values.maxTotalUses) < 1) {
      toast.error('سقف کل استفاده باید حداقل ۱ باشد.');
      return;
    }

    const dto: CreateDiscountDto = {
      kind: DiscountKind.CODE,

      code: values.code.trim().toUpperCase(),

      type: values.type,

      value: Number(values.value),

      maxDiscountAmount:
        values.type === DiscountType.PERCENTAGE &&
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

      maxUsesPerUser: values.unlimitedPerUser
        ? null
        : Number(values.maxUsesPerUser),

      maxTotalUses:
        values.maxTotalUses !== '' ? Number(values.maxTotalUses) : null,

      excludeSaleItems: values.excludeSaleItems,

      // خالی = همه کاربران
      userIds: values.userIds,

      // خالی = همه محصولات
      excludedProductIds: values.excludedProductIds,

      excludedCategoryIds: values.excludedCategoryIds,
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

              {/* دفعات استفاده */}

              <section className="space-y-4">
                <div>
                  <h3 className="font-semibold">دفعات استفاده</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    مشخص کنید هر کاربر چند بار می‌تواند از این کد استفاده کند.
                  </p>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        استفادهٔ نامحدود برای هر کاربر
                      </div>

                      <div className="text-sm text-muted-foreground">
                        در غیر این صورت سقف دفعات هر کاربر را وارد کنید.
                      </div>
                    </div>

                    <Switch
                      checked={unlimitedPerUser}
                      onCheckedChange={value =>
                        setValue('unlimitedPerUser', value, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>

                  {!unlimitedPerUser && (
                    <div className="space-y-2">
                      <Label htmlFor="maxUsesPerUser">
                        حداکثر دفعات استفادهٔ هر کاربر
                      </Label>

                      <Input
                        id="maxUsesPerUser"
                        type="number"
                        min={1}
                        step={1}
                        dir="ltr"
                        placeholder="1"
                        {...register('maxUsesPerUser')}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTotalUses">
                    سقف کل دفعات استفاده (اختیاری)
                  </Label>

                  <Input
                    id="maxTotalUses"
                    type="number"
                    min={1}
                    step={1}
                    dir="ltr"
                    placeholder="خالی = نامحدود"
                    {...register('maxTotalUses')}
                  />

                  <p className="text-xs text-muted-foreground">
                    مجموع دفعات استفادهٔ همهٔ کاربران؛ بعد از رسیدن به این عدد
                    کد غیرقابل استفاده می‌شود.
                  </p>
                </div>
              </section>

              {/* بازه اعتبار */}

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
                  <h3 className="font-semibold">محدوده اعمال کد</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    به‌صورت پیش‌فرض کد روی همهٔ محصولات و برای همهٔ کاربران قابل
                    استفاده است. می‌توانید محصولات یا دسته‌بندی‌هایی را مستثنا
                    کنید یا کد را به کاربران خاصی محدود کنید.
                  </p>
                </div>

                {/* محصولات و دسته‌های مستثنا */}
                <div className="rounded-lg border p-4">
                  <div className="mb-4">
                    <div className="font-medium">
                      محصولات و دسته‌بندی‌های مستثنا
                    </div>
                    <div className="text-sm text-muted-foreground">
                      کد روی این موارد اعمال نمی‌شود (زیرمجموعهٔ دسته‌ها هم
                      مستثنا می‌شوند).{' '}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Product */}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setProductDialogOpen(true)}
                    >
                      {excludedProductIds.length > 0
                        ? `${excludedProductIds.length} محصول مستثنا`
                        : 'انتخاب محصولات مستثنا'}
                    </Button>

                    {/* Category */}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setCategoryDialogOpen(true)}
                    >
                      {excludedCategoryIds.length > 0
                        ? `${excludedCategoryIds.length} دسته‌بندی مستثنا`
                        : 'انتخاب دسته‌بندی‌های مستثنا'}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">
                      عدم اعمال روی محصولات فروش ویژه
                    </div>

                    <div className="text-sm text-muted-foreground">
                      محصولاتی که در لحظهٔ خرید در فروش ویژه هستند مشمول این کد
                      نمی‌شوند.
                    </div>
                  </div>

                  <Switch
                    checked={excludeSaleItems}
                    onCheckedChange={value =>
                      setValue('excludeSaleItems', value, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>

                {/* کاربران */}

                <div className="rounded-lg border p-4">
                  <div className="mb-3">
                    <div className="font-medium">کاربران مجاز</div>

                    <div className="text-sm text-muted-foreground">
                      اگر کاربر انتخاب شود، کد فقط برای همان کاربران قابل
                      استفاده است. در غیر این صورت برای همه آزاد است.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setUserDialogOpen(true)}
                  >
                    {userIds.length > 0
                      ? `${userIds.length} کاربر انتخاب شده`
                      : 'انتخاب کاربران'}
                  </Button>
                </div>
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
        onConfirm={ids => setValue('userIds', ids, { shouldDirty: true })}
      />

      <DiscountSelectDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        type="products"
        title="انتخاب محصولات مستثنا"
        selectedIds={excludedProductIds}
        onConfirm={ids =>
          setValue('excludedProductIds', ids, { shouldDirty: true })
        }
      />

      <DiscountSelectDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        type="categories"
        title="انتخاب دسته‌بندی‌های مستثنا"
        selectedIds={excludedCategoryIds}
        onConfirm={ids =>
          setValue('excludedCategoryIds', ids, { shouldDirty: true })
        }
      />
    </>
  );
}
