'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { useCreateRequest } from '@/services/features/b2b/hooks';

import { B2B_SERVICE_OPTIONS, B2B_SERVICE_SELECT_EVENT } from './constants';

const schema = z.object({
  fullName: z.string().trim().min(2, 'نام و نام خانوادگی الزامی است'),
  organization: z.string().trim().min(2, 'نام سازمان الزامی است'),
  phone: z.string().trim().min(10, 'شماره تماس معتبر نیست'),
  service: z.string().min(1, 'نوع درخواست را انتخاب کنید'),
  quantity: z
    .string()
    .trim()
    .min(1, 'تعداد تقریبی را وارد کنید')
    .refine(value => /^[0-9۰-۹]+$/.test(value), 'تعداد را به عدد وارد کنید'),
  budget: z.string().trim().max(100).optional(),
  deadline: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
});

type FormData = z.infer<typeof schema>;

/** اعداد فارسی را به انگلیسی تبدیل می‌کند */
function toEnglishDigits(value: string) {
  return value.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
}

/** جزئیات فرم را به متن درخواست تبدیل می‌کند */
function buildMessage(data: FormData) {
  return [
    `نوع درخواست: ${data.service}`,
    `تعداد تقریبی: ${toEnglishDigits(data.quantity)}`,
    data.budget ? `بودجهٔ تقریبی: ${data.budget}` : null,
    data.deadline ? `زمان موردنیاز تحویل: ${data.deadline}` : null,
    data.description ? `توضیحات: ${data.description}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export default function B2bSaleRequestForm() {
  const { mutate, isPending } = useCreateRequest();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      organization: '',
      phone: '',
      service: '',
      quantity: '',
      budget: '',
      deadline: '',
      description: '',
    },
  });

  // پیش‌انتخاب نوع خدمت با کلیک روی لینک‌های کارت‌های راهکار
  useEffect(() => {
    const onSelectService = (event: Event) => {
      const service = (event as CustomEvent<string>).detail;

      if (!service) return;

      setValue('service', service, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };

    window.addEventListener(B2B_SERVICE_SELECT_EVENT, onSelectService);

    return () =>
      window.removeEventListener(B2B_SERVICE_SELECT_EVENT, onSelectService);
  }, [setValue]);

  const onSubmit = (data: FormData) => {
    mutate(
      {
        fullName: data.fullName,
        companyName: data.organization,
        phone: toEnglishDigits(data.phone),
        subject: data.service,
        message: buildMessage(data),
      },
      {
        onSuccess: () => reset(),
      },
    );
  };

  return (
    <form className="b2b__request-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="b2b__fields">
        <div className="b2b__field">
          <label htmlFor="fullName">نام و نام خانوادگی</label>
          <input
            id="fullName"
            autoComplete="name"
            maxLength={100}
            required
            {...register('fullName')}
          />
          {errors.fullName && (
            <p className="b2b__field-error">{errors.fullName.message}</p>
          )}
        </div>

        <div className="b2b__field">
          <label htmlFor="organization">نام سازمان</label>
          <input
            id="organization"
            autoComplete="organization"
            maxLength={120}
            required
            {...register('organization')}
          />
          {errors.organization && (
            <p className="b2b__field-error">{errors.organization.message}</p>
          )}
        </div>

        <div className="b2b__field">
          <label htmlFor="phone">شماره تماس</label>
          <input
            id="phone"
            type="tel"
            dir="ltr"
            autoComplete="tel"
            maxLength={25}
            required
            {...register('phone')}
          />
          {errors.phone && (
            <p className="b2b__field-error">{errors.phone.message}</p>
          )}
        </div>

        <div className="b2b__field">
          <label htmlFor="service">نوع درخواست</label>
          <select id="service" required {...register('service')}>
            <option value="">انتخاب کنید</option>
            {B2B_SERVICE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.service && (
            <p className="b2b__field-error">{errors.service.message}</p>
          )}
        </div>

        <div className="b2b__field">
          <label htmlFor="quantity">تعداد تقریبی</label>
          <input
            id="quantity"
            inputMode="numeric"
            placeholder="مثلاً ۵۰"
            required
            {...register('quantity')}
          />
          {errors.quantity && (
            <p className="b2b__field-error">{errors.quantity.message}</p>
          )}
        </div>

        <div className="b2b__field">
          <label htmlFor="budget">
            بودجهٔ تقریبی <span className="b2b__optional">اختیاری</span>
          </label>
          <input
            id="budget"
            placeholder="بودجهٔ کل یا هر نفر"
            maxLength={100}
            {...register('budget')}
          />
        </div>

        <div className="b2b__field b2b__field--full">
          <label htmlFor="deadline">
            زمان موردنیاز تحویل <span className="b2b__optional">اختیاری</span>
          </label>
          <input
            id="deadline"
            placeholder="مثلاً تا پایان آبان"
            maxLength={100}
            {...register('deadline')}
          />
        </div>

        <div className="b2b__field b2b__field--full">
          <label htmlFor="description">
            توضیحات <span className="b2b__optional">اختیاری</span>
          </label>
          <textarea
            id="description"
            rows={3}
            maxLength={2000}
            placeholder="نوع پوشاک، مناسبت یا نیاز خاص سازمان"
            {...register('description')}
          />
        </div>
      </div>

      <button
        type="submit"
        className="b2b__button b2b__button--primary"
        disabled={isPending}
      >
        {isPending ? 'در حال ارسال…' : 'درخواست مشاوره و قیمت'}
      </button>

      <p className="b2b__form-note">
        پس از ثبت درخواست، کارشناسان زوپینی برای بررسی جزئیات، بودجه و زمان
        تحویل با شما تماس می‌گیرند.
      </p>
    </form>
  );
}
