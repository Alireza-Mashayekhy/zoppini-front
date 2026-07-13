// components/pages/b2b-sale/b2b-sale-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import FormProvider from '@/components/form/form-provider';
import RHFInput from '@/components/form/rhf-input';
import RHFTextArea from '@/components/form/rhf-textarea';
import { Button } from '@/components/ui/button';
import { useCreateRequest } from '@/services/features/b2b/hooks';

const schema = z.object({
  fullName: z.string().min(2, 'نام کامل الزامی است'),
  companyName: z.string().min(2, 'نام سازمان الزامی است'),
  position: z.string().optional(),
  phone: z.string().min(10, 'شماره تماس معتبر نیست'),
  email: z.string().email('ایمیل نامعتبر است'),
  subject: z.string().min(2, 'موضوع درخواست الزامی است'),
  message: z.string().min(10, 'توضیحات حداقل ۱۰ کاراکتر است'),
});

type FormData = z.infer<typeof schema>;

export default function B2bSaleForm() {
  const { mutate, isPending } = useCreateRequest();
  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      companyName: '',
      position: '',
      phone: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = (data: FormData) => {
    mutate(data, {
      onSuccess: () => methods.reset(),
    });
  };

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RHFInput name="fullName" label="نام و نام خانوادگی" />
        <RHFInput name="companyName" label="نام سازمان" />
        <RHFInput name="position" label="سمت سازمانی (اختیاری)" />
        <RHFInput name="phone" label="شماره تماس" />
        <RHFInput name="email" label="ایمیل" type="email" />
        <RHFInput name="subject" label="موضوع درخواست" />
        <div className="md:col-span-2">
          <RHFTextArea name="message" label="توضیحات" rows={5} />
        </div>
        <Button
          type="submit"
          variant="dark"
          className="md:col-span-2"
          loading={isPending}
        >
          ارسال درخواست
        </Button>
      </div>
    </FormProvider>
  );
}
