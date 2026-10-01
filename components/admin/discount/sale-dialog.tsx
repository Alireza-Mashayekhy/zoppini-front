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
import { persianDateToISO, toPersianDate } from '@/lib/utils';
import { useAdminDiscount } from '@/services/features/discounts/admin.hooks';
import {
  CreateDiscountDto,
  DiscountKind,
  DiscountType,
} from '@/services/features/discounts/types';

import DiscountSelectDialog from './select-dialog';

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

    if (values.productIds.length === 0 && values.categoryIds.length === 0) {
      toast.error('حداقل یک محصول یا دسته‌بندی انتخاب کنید.');
      return;
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

              {/* محصولات و دسته‌ها */}

              <section className="space-y-4">
                <div>
                  <h3 className="font-semibold">محصولات مشمول</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    محصولات یا دسته‌بندی‌های مشمول فروش ویژه را انتخاب کنید
                    (حداقل یکی). با انتخاب یک دسته، زیرمجموعه‌های آن هم شامل
                    می‌شوند.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
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
