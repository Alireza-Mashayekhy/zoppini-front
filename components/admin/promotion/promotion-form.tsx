'use client';

import { Loader2, Save, Wand2 } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { PersianDatePicker } from '@/components/form/persian-date-picker';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  FreeItemSelection,
  Promotion,
  PromotionRewardType,
  PromotionScope,
  PromotionType,
} from '@/services/features/promotions/types';

import { persianDateToISO, toPersianDate } from '../discount/utils';
import {
  EMPTY_PROMOTION_FORM,
  normalizeRewardType,
  PromotionFormValues,
  toPromotionDto,
} from './form-types';
import ScopePicker from './scope-picker';
import { PROMOTION_TYPE_HINTS, PROMOTION_TYPE_LABELS } from './utils';

interface PromotionFormProps {
  promotion?: Promotion | null;
  onSubmit: (values: ReturnType<typeof toPromotionDto>) => void;
  isPending?: boolean;
  onPreview?: (values: PromotionFormValues) => void;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white p-4">
      <header className="mb-3">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </header>

      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-700">
        {label}
        {required && <span className="ms-1 text-red-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function toFormValues(promotion: Promotion): PromotionFormValues {
  const start = new Date(promotion.startsAt);
  const end = new Date(promotion.expiresAt);

  const time = (date: Date) =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  return {
    ...EMPTY_PROMOTION_FORM,
    name: promotion.name,
    internalDescription: promotion.internalDescription ?? '',
    type: promotion.type,

    scope: promotion.scope,
    productIds: promotion.productIds ?? [],
    categoryIds: promotion.categoryIds ?? [],
    excludedProductIds: promotion.excludedProductIds ?? [],
    excludedCategoryIds: promotion.excludedCategoryIds ?? [],

    rewardType: promotion.rewardType,
    rewardValue: promotion.rewardValue ?? '',
    maxDiscountAmount: promotion.maxDiscountAmount ?? '',

    minQuantity: promotion.minQuantity || '',
    minCartValue: promotion.minCartValue || '',

    pairSize: promotion.pairSize,
    discountEveryExtraUnit: promotion.discountEveryExtraUnit,

    requiredQuantity: promotion.requiredQuantity,
    freeQuantity: promotion.freeQuantity,

    rewardScope: promotion.rewardScope ?? PromotionScope.PRODUCTS,
    rewardProductIds: promotion.rewardProductIds ?? [],
    rewardCategoryIds: promotion.rewardCategoryIds ?? [],
    suggestedProductId: promotion.suggestedProductId ?? '',
    suggestedCategoryId: promotion.suggestedCategoryId ?? '',
    rewardQuantity: promotion.rewardQuantity,
    freeItemSelection: promotion.freeItemSelection,
    autoAddReward: promotion.autoAddReward,
    requiresCustomerAcceptance: promotion.requiresCustomerAcceptance,
    removeRewardWhenTriggerRemoved: promotion.removeRewardWhenTriggerRemoved,

    isActive: promotion.isActive,
    startsAt: toPersianDate(promotion.startsAt),
    expiresAt: toPersianDate(promotion.expiresAt),
    startsAtTime: time(start),
    expiresAtTime: time(end),

    maxTotalUses: promotion.maxTotalUses ?? '',
    maxUsesPerCustomer: promotion.maxUsesPerCustomer ?? '',
    maxApplicationsPerCart: promotion.maxApplicationsPerCart,

    canStack: promotion.canStack,
    stackable: promotion.stackable,
    priority: promotion.priority,

    badgeText: promotion.badgeText ?? '',
    customerDescription: promotion.customerDescription ?? '',
    showBadgeOnProductCard: promotion.showBadgeOnProductCard,
    showBadgeOnProductPage: promotion.showBadgeOnProductPage,

    showPreCartPopup: promotion.showPreCartPopup,
    popupTitle: promotion.popupTitle ?? '',
    popupDescription: promotion.popupDescription ?? '',
    popupAcceptLabel: promotion.popupAcceptLabel ?? '',
    popupDismissLabel: promotion.popupDismissLabel ?? '',
    popupSuggestedProductId: promotion.popupSuggestedProductId ?? '',
    popupSuggestedCategoryId: promotion.popupSuggestedCategoryId ?? '',
  };
}

/**
 * سازندهٔ پروموشن — همهٔ انواع بدون نیاز به کدنویسی.
 *
 * فیلدهای هر نوع فقط وقتی نمایش داده می‌شوند که برای آن نوع معنا دارند تا
 * کارمند غیرفنی گمراه نشود.
 */
export default function PromotionForm({
  promotion,
  onSubmit,
  isPending = false,
  onPreview,
}: PromotionFormProps) {
  /**
   * تاریخ جلالی + ساعت را به ISO تبدیل می‌کند.
   * اگر ساعت خالی باشد، شروعِ روز / پایانِ روز در نظر گرفته می‌شود.
   */
  const helpers = {
    persianToIso: (date: string, time: string) => {
      if (!date) {
        return '';
      }

      const parsed = new Date(persianDateToISO(date, time === '23:59'));

      if (Number.isNaN(parsed.getTime())) {
        return '';
      }

      const [hour, minute] = time.split(':').map(Number);

      if (Number.isFinite(hour) && Number.isFinite(minute)) {
        parsed.setHours(hour, minute, time === '23:59' ? 59 : 0, 0);
      }

      return parsed.toISOString();
    },
  };

  const form = useForm<PromotionFormValues>({
    defaultValues: promotion ? toFormValues(promotion) : EMPTY_PROMOTION_FORM,
    mode: 'onChange',
  });

  const { register, handleSubmit, watch, setValue, control, reset } = form;

  const values = watch();

  useEffect(() => {
    if (promotion) {
      reset(toFormValues(promotion));
    }
  }, [promotion, reset]);

  const type = values.type;

  const needsPairFields = type === PromotionType.CHEAPER_ITEM_PAIR;
  const needsXyFields = type === PromotionType.BUY_X_GET_Y_SAME_GROUP;
  const needsTriggerReward = type === PromotionType.BUY_TRIGGER_GET_REWARD;
  const needsMinMoney =
    type === PromotionType.SPEND_AND_SAVE ||
    type === PromotionType.FREE_SHIPPING ||
    type === PromotionType.CART_DISCOUNT ||
    needsTriggerReward;
  const needsMinQuantity =
    type === PromotionType.BUY_X_GET_PERCENT_OFF ||
    type === PromotionType.CART_DISCOUNT ||
    needsTriggerReward;
  const needsBundleFields = type === PromotionType.FIXED_PRICE_BUNDLE;
  const needsRewardValue =
    values.rewardType === PromotionRewardType.PERCENTAGE ||
    values.rewardType === PromotionRewardType.FIXED ||
    values.rewardType === PromotionRewardType.FIXED_BUNDLE_PRICE;

  const handleTypeChange = (next: PromotionType) => {
    setValue('type', next);
    setValue('rewardType', normalizeRewardType(next, values.rewardType));

    if (next === PromotionType.BUY_X_GET_Y_SAME_GROUP) {
      if (!values.requiredQuantity) setValue('requiredQuantity', 2);
      if (!values.freeQuantity) setValue('freeQuantity', 1);
    }

    if (next === PromotionType.BUY_TRIGGER_GET_REWARD) {
      if (!values.minQuantity) setValue('minQuantity', 1);
      if (!values.rewardQuantity) setValue('rewardQuantity', 1);
    }

    if (next === PromotionType.FIXED_PRICE_BUNDLE) {
      if (!values.minQuantity) setValue('minQuantity', 2);
    }
  };

  const submit = handleSubmit(data => {
    onSubmit(toPromotionDto(data, helpers));
  });

  return (
    <form onSubmit={submit} className="space-y-4" dir="rtl">
      {/* =====================================================
          اطلاعات پایه
      ====================================================== */}

      <Section
        title="اطلاعات پروموشن"
        description="نام و توضیح داخلی فقط در پنل دیده می‌شود و به مشتری نمایش داده نمی‌شود."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="نام پروموشن" required>
            <Input {...register('name', { required: true })} />
          </Field>

          <Field label="نوع پروموشن" required hint={PROMOTION_TYPE_HINTS[type]}>
            <Select
              value={type}
              onValueChange={value => handleTypeChange(value as PromotionType)}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROMOTION_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="توضیح داخلی (برای تیم)">
          <Textarea
            {...register('internalDescription')}
            rows={2}
            placeholder="مثلاً: توافق با تأمین‌کننده برای کمپین پاییز"
          />
        </Field>
      </Section>

      {/* =====================================================
          شمول محصولات
      ====================================================== */}

      <Section
        title="کالاهای مشمول"
        description="دامنهٔ پروموشن را انتخاب کنید. استثناها همیشه بر شمول اولویت دارند و زیرمجموعه‌های دسته‌های انتخاب‌شده هم مشمول می‌شوند."
      >
        <Field label="دامنه">
          <Select
            value={values.scope}
            onValueChange={value => setValue('scope', value as PromotionScope)}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PromotionScope.ALL}>
                همهٔ محصولات سایت
              </SelectItem>
              <SelectItem value={PromotionScope.CATEGORIES}>
                فقط دسته‌های انتخاب‌شده
              </SelectItem>
              <SelectItem value={PromotionScope.PRODUCTS}>
                فقط محصولات انتخاب‌شده
              </SelectItem>
              <SelectItem value={PromotionScope.CATEGORIES_AND_PRODUCTS}>
                ترکیب دسته‌ها و محصولات
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {(values.scope === PromotionScope.CATEGORIES ||
          values.scope === PromotionScope.CATEGORIES_AND_PRODUCTS) && (
          <ScopePicker
            kind="categories"
            label="دسته‌های مشمول"
            value={values.categoryIds}
            onChange={ids => setValue('categoryIds', ids)}
          />
        )}

        {(values.scope === PromotionScope.PRODUCTS ||
          values.scope === PromotionScope.CATEGORIES_AND_PRODUCTS) && (
          <ScopePicker
            kind="products"
            label="محصولات مشمول"
            value={values.productIds}
            onChange={ids => setValue('productIds', ids)}
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <ScopePicker
            kind="products"
            label="استثنا: محصولات"
            hint="این محصولات هرگز مشمول نمی‌شوند."
            value={values.excludedProductIds}
            onChange={ids => setValue('excludedProductIds', ids)}
          />

          <ScopePicker
            kind="categories"
            label="استثنا: دسته‌ها"
            hint="همهٔ زیرمجموعه‌های این دسته‌ها هم مستثنی می‌شوند."
            value={values.excludedCategoryIds}
            onChange={ids => setValue('excludedCategoryIds', ids)}
          />
        </div>
      </Section>

      {/* =====================================================
          پاداش
      ====================================================== */}

      <Section
        title="تخفیف / پاداش"
        description="نوع پاداش بر اساس نوع پروموشن تعیین می‌شود."
      >
        <Field label="نوع پاداش" required>
          <Select
            value={values.rewardType}
            onValueChange={value =>
              setValue('rewardType', value as PromotionRewardType)
            }
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PromotionRewardType.PERCENTAGE}>
                درصد تخفیف
              </SelectItem>
              <SelectItem value={PromotionRewardType.FIXED}>
                مبلغ ثابت (تومان)
              </SelectItem>
              <SelectItem value={PromotionRewardType.FREE_ITEM}>
                کالای رایگان
              </SelectItem>
              <SelectItem value={PromotionRewardType.FIXED_BUNDLE_PRICE}>
                قیمت ثابت باندل
              </SelectItem>
              <SelectItem value={PromotionRewardType.FREE_SHIPPING}>
                ارسال رایگان
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {needsRewardValue && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={
                values.rewardType === PromotionRewardType.PERCENTAGE
                  ? 'درصد تخفیف'
                  : values.rewardType === PromotionRewardType.FIXED_BUNDLE_PRICE
                    ? 'قیمت ثابت باندل (تومان)'
                    : 'مبلغ تخفیف (تومان)'
              }
              required
            >
              <Input
                type="number"
                min={0}
                max={
                  values.rewardType === PromotionRewardType.PERCENTAGE
                    ? 100
                    : undefined
                }
                {...register('rewardValue', { valueAsNumber: true })}
              />
            </Field>

            {values.rewardType === PromotionRewardType.PERCENTAGE && (
              <Field label="سقف تخفیف (تومان)" hint="خالی = بدون سقف">
                <Input
                  type="number"
                  min={0}
                  {...register('maxDiscountAmount', { valueAsNumber: true })}
                />
              </Field>
            )}
          </div>
        )}

        {needsPairFields && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="تعداد کالای هر جفت"
              hint="پیش‌فرض ۲: برای هر ۲ کالا، یک واحد تخفیف می‌گیرد."
            >
              <Input
                type="number"
                min={2}
                max={20}
                {...register('pairSize', { valueAsNumber: true })}
              />
            </Field>

            <label className="flex items-center justify-between gap-2 border p-2 text-xs">
              <span>
                تخفیف روی همهٔ واحدهای بعدی (نه فقط جفت کامل)
                <span className="block text-[10px] text-muted-foreground">
                  مثلاً با ۵ کالا، همهٔ ۴ واحد اضافه تخفیف بگیرند.
                </span>
              </span>

              <Switch
                checked={values.discountEveryExtraUnit}
                onCheckedChange={checked =>
                  setValue('discountEveryExtraUnit', checked)
                }
              />
            </label>
          </div>
        )}

        {needsXyFields && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="تعداد کالای پرداختی (X)" required>
              <Input
                type="number"
                min={1}
                {...register('requiredQuantity', { valueAsNumber: true })}
              />
            </Field>

            <Field label="تعداد کالای رایگان (Y)" required>
              <Input
                type="number"
                min={1}
                {...register('freeQuantity', { valueAsNumber: true })}
              />
            </Field>
          </div>
        )}

        {needsBundleFields && (
          <Field
            label="تعداد اقلام باندل"
            hint="قیمت ثابت بالا برای همین تعداد کالا اعمال می‌شود."
          >
            <Input
              type="number"
              min={2}
              max={10}
              {...register('minQuantity', { valueAsNumber: true })}
            />
          </Field>
        )}
      </Section>

      {/* =====================================================
          شرط‌های حداقلی
      ====================================================== */}

      {(needsMinQuantity || needsMinMoney) && (
        <Section
          title="شرط‌های احراز"
          description="تا وقتی این شرط‌ها احراز نشود، تخفیف اعمال نمی‌شود."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {needsMinQuantity && (
              <Field
                label={
                  needsTriggerReward
                    ? 'حداقل تعداد کالای محرک'
                    : 'حداقل تعداد کالای مشمول'
                }
                required
              >
                <Input
                  type="number"
                  min={1}
                  {...register('minQuantity', { valueAsNumber: true })}
                />
              </Field>
            )}

            {needsMinMoney && (
              <Field
                label="حداقل مبلغ سبد (تومان)"
                hint="۰ یا خالی = بدون شرط مبلغ"
              >
                <Input
                  type="number"
                  min={0}
                  {...register('minCartValue', { valueAsNumber: true })}
                />
              </Field>
            )}
          </div>
        </Section>
      )}

      {/* =====================================================
          پاداش متفاوت (نوع C)
      ====================================================== */}

      {needsTriggerReward && (
        <Section
          title="کالای هدیه"
          description="کالا یا دستهٔ هدیه را تعیین کنید؛ می‌توانید انتخاب نهایی را به مشتری بسپارید."
        >
          <Field label="دامنهٔ هدیه">
            <Select
              value={values.rewardScope}
              onValueChange={value =>
                setValue('rewardScope', value as PromotionScope)
              }
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PromotionScope.PRODUCTS}>
                  محصولات مشخص
                </SelectItem>
                <SelectItem value={PromotionScope.CATEGORIES}>
                  دسته‌های مشخص
                </SelectItem>
                <SelectItem value={PromotionScope.CATEGORIES_AND_PRODUCTS}>
                  ترکیب دسته و محصول
                </SelectItem>
                <SelectItem value={PromotionScope.ALL}>
                  هر محصول سایت
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {(values.rewardScope === PromotionScope.PRODUCTS ||
            values.rewardScope === PromotionScope.CATEGORIES_AND_PRODUCTS) && (
            <ScopePicker
              kind="products"
              label="محصولات هدیه"
              value={values.rewardProductIds}
              onChange={ids => setValue('rewardProductIds', ids)}
            />
          )}

          {(values.rewardScope === PromotionScope.CATEGORIES ||
            values.rewardScope === PromotionScope.CATEGORIES_AND_PRODUCTS) && (
            <ScopePicker
              kind="categories"
              label="دسته‌های هدیه"
              value={values.rewardCategoryIds}
              onChange={ids => setValue('rewardCategoryIds', ids)}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="تعداد کالای رایگان">
              <Input
                type="number"
                min={1}
                max={20}
                {...register('rewardQuantity', { valueAsNumber: true })}
              />
            </Field>

            <Field label="انتخاب کالای هدیه">
              <Select
                value={values.freeItemSelection}
                onValueChange={value =>
                  setValue('freeItemSelection', value as FreeItemSelection)
                }
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FreeItemSelection.AUTO}>
                    سیستم انتخاب می‌کند (ارزان‌ترین)
                  </SelectItem>
                  <SelectItem value={FreeItemSelection.CUSTOMER}>
                    مشتری انتخاب می‌کند
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-2 border p-2 text-xs">
              <span>
                افزودن خودکار هدیه به سبد
                <span className="block text-[10px] text-muted-foreground">
                  بدون تأیید مشتری اضافه می‌شود.
                </span>
              </span>

              <Switch
                checked={values.autoAddReward}
                onCheckedChange={checked => {
                  setValue('autoAddReward', checked);

                  if (checked) {
                    setValue('requiresCustomerAcceptance', false);
                  }
                }}
              />
            </label>

            <label className="flex items-center justify-between gap-2 border p-2 text-xs">
              <span>
                نیاز به تأیید مشتری
                <span className="block text-[10px] text-muted-foreground">
                  پاپ‌آپ پیشنهاد نمایش داده می‌شود.
                </span>
              </span>

              <Switch
                checked={values.requiresCustomerAcceptance}
                onCheckedChange={checked => {
                  setValue('requiresCustomerAcceptance', checked);

                  if (checked) {
                    setValue('autoAddReward', false);
                  }
                }}
              />
            </label>
          </div>
        </Section>
      )}

      {/* =====================================================
          زمان‌بندی
      ====================================================== */}

      <Section
        title="زمان‌بندی و وضعیت"
        description="پروموشن فقط بین این دو تاریخ و با وضعیت «فعال» اعمال می‌شود."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Controller
            control={control}
            name="startsAt"
            render={() => (
              <div className="space-y-1.5">
                <PersianDatePicker name="startsAt" label="تاریخ شروع" required />

                <Field label="ساعت شروع">
                  <Input type="time" {...register('startsAtTime')} />
                </Field>
              </div>
            )}
          />

          <Controller
            control={control}
            name="expiresAt"
            render={() => (
              <div className="space-y-1.5">
                <PersianDatePicker name="expiresAt" label="تاریخ پایان" required />

                <Field label="ساعت پایان">
                  <Input type="time" {...register('expiresAtTime')} />
                </Field>
              </div>
            )}
          />
        </div>

        <label className="flex items-center justify-between gap-2 border p-2 text-xs">
          <span className="font-medium">فعال باشد</span>

          <Switch
            checked={values.isActive}
            onCheckedChange={checked => setValue('isActive', checked)}
          />
        </label>
      </Section>

      {/* =====================================================
          محدودیت استفاده و ترکیب
      ====================================================== */}

      <Section
        title="محدودیت و ترکیب"
        description="سقف استفاده و این‌که این پروموشن با بقیه ترکیب شود یا نه."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="سقف کل استفاده" hint="خالی = نامحدود">
            <Input
              type="number"
              min={1}
              {...register('maxTotalUses', { valueAsNumber: true })}
            />
          </Field>

          <Field label="سقف استفادهٔ هر مشتری" hint="خالی = نامحدود">
            <Input
              type="number"
              min={1}
              {...register('maxUsesPerCustomer', { valueAsNumber: true })}
            />
          </Field>

          <Field
            label="حداکثر اعمال در یک سبد"
            hint="پیش‌فرض ۱؛ جلوگیری از تکرار پاداش."
          >
            <Input
              type="number"
              min={1}
              max={20}
              {...register('maxApplicationsPerCart', { valueAsNumber: true })}
            />
          </Field>
        </div>

        <label className="flex items-center justify-between gap-2 border p-2 text-xs">
          <span>
            قابل ترکیب با سایر پروموشن‌ها
            <span className="block text-[10px] text-muted-foreground">
              اگر خاموش باشد، فقط بهترین پروموشن اعمال می‌شود.
            </span>
          </span>

          <Switch
            checked={values.canStack}
            onCheckedChange={checked => setValue('canStack', checked)}
          />
        </label>

        <Field label="اولویت" hint="عدد بزرگ‌تر زودتر در نظر گرفته می‌شود.">
          <Input
            type="number"
            {...register('priority', { valueAsNumber: true })}
          />
        </Field>
      </Section>

      {/* =====================================================
          نمایش به مشتری
      ====================================================== */}

      <Section
        title="نمایش به مشتری"
        description="نشان و توضیح پیشنهاد. قیمت کارت محصول تغییر نمی‌کند؛ فقط متن نشان نمایش داده می‌شود."
      >
        <Field
          label="متن نشان"
          hint="مثلاً: «خرید ۲، ۵۰٪ تخفیف روی ارزان‌تر». خالی = متن پیش‌فرض."
        >
          <Input {...register('badgeText')} maxLength={120} />
        </Field>

        <Field label="توضیح پیشنهاد برای مشتری">
          <Textarea {...register('customerDescription')} rows={2} maxLength={300} />
        </Field>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-2 border p-2 text-xs">
            <span>نشان روی کارت محصول</span>

            <Switch
              checked={values.showBadgeOnProductCard}
              onCheckedChange={checked =>
                setValue('showBadgeOnProductCard', checked)
              }
            />
          </label>

          <label className="flex items-center justify-between gap-2 border p-2 text-xs">
            <span>نشان در صفحهٔ محصول</span>

            <Switch
              checked={values.showBadgeOnProductPage}
              onCheckedChange={checked =>
                setValue('showBadgeOnProductPage', checked)
              }
            />
          </label>
        </div>
      </Section>

      {/* =====================================================
          پاپ‌آپ پیش از سبد
      ====================================================== */}

      <Section
        title="پاپ‌آپ پیش از سبد"
        description="وقتی سبد به هدیه نزدیک است، پیشنهاد غیرمسدودکننده‌ای نمایش داده می‌شود."
      >
        <label className="flex items-center justify-between gap-2 border p-2 text-xs">
          <span>
            نمایش پاپ‌آپ پیشنهاد
            <span className="block text-[10px] text-muted-foreground">
              با رد کردن، تا تغییر سبد بعدی دوباره نمایش داده نمی‌شود.
            </span>
          </span>

          <Switch
            checked={values.showPreCartPopup}
            onCheckedChange={checked => setValue('showPreCartPopup', checked)}
          />
        </label>

        {values.showPreCartPopup && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="عنوان پاپ‌آپ">
                <Input {...register('popupTitle')} maxLength={150} />
              </Field>

              <Field label="توضیح پاپ‌آپ">
                <Input {...register('popupDescription')} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="متن دکمهٔ افزودن">
                <Input {...register('popupAcceptLabel')} maxLength={100} />
              </Field>

              <Field label="متن دکمهٔ «نه ممنون»">
                <Input {...register('popupDismissLabel')} maxLength={100} />
              </Field>
            </div>

            <ScopePicker
              kind="products"
              label="محصول پیشنهادی در پاپ‌آپ"
              hint="کالایی که با یک کلیک به سبد اضافه می‌شود (اختیاری)."
              value={
                values.popupSuggestedProductId
                  ? [Number(values.popupSuggestedProductId)]
                  : []
              }
              onChange={ids => setValue('popupSuggestedProductId', ids[0] ?? '')}
            />

            <ScopePicker
              kind="categories"
              label="دستهٔ پیشنهادی در پاپ‌آپ"
              hint="اگر مشتری باید از این دسته انتخاب کند (اختیاری)."
              value={
                values.popupSuggestedCategoryId
                  ? [Number(values.popupSuggestedCategoryId)]
                  : []
              }
              onChange={ids =>
                setValue('popupSuggestedCategoryId', ids[0] ?? '')
              }
            />
          </>
        )}
      </Section>

      {/* =====================================================
          Actions
      ====================================================== */}

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t bg-white/95 p-3 backdrop-blur">
        {onPreview && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onPreview(values)}
          >
            <Wand2 className="ml-2 size-4" />
            پیش‌نمایش
          </Button>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="ml-2 size-4 animate-spin" />
          ) : (
            <Save className="ml-2 size-4" />
          )}
          {promotion ? 'ذخیرهٔ تغییرات' : 'ایجاد پروموشن'}
        </Button>
      </div>
    </form>
  );
}
