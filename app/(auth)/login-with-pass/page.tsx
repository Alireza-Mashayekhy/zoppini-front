// components/pages/auth/login-with-password.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import FormProvider from '@/components/form/form-provider';
import RHFInput from '@/components/form/rhf-input';
import { Button } from '@/components/ui/button';
import { useLoginPassword } from '@/services/features/auth/hooks';
import { LoginWithPasswordDto } from '@/services/features/auth/types';

const schema = z.object({
  phone: z
    .string()
    .length(11, 'شماره تلفن وارد شده اشتباه است.')
    .startsWith('09', 'شماره تلفن وارد شده اشتباه است.'),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر است'),
});

export default function LoginWithPassword() {
  const router = useRouter();
  const loginMutation = useLoginPassword();

  const methods = useForm<LoginWithPasswordDto>({
    defaultValues: {
      phone: '',
      password: '',
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginWithPasswordDto) => {
    try {
      await loginMutation.mutateAsync(data);
      toast.success('ورود موفق');
      router.push('/');
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || 'خطا در ورود';
      toast.error(message);
    }
  };

  return (
    <div className="w-full max-w-[300px]">
      <FormProvider
        methods={methods}
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-3"
      >
        <RHFInput label="شماره تلفن" name="phone" />
        <RHFInput label="رمز عبور" name="password" type="password" />
        <Button
          type="submit"
          loading={loginMutation.isPending}
          size="lg"
          variant="dark"
          className="w-full"
        >
          ورود
        </Button>
        <div className="flex items-center justify-between">
          <Link href="/forgot-pass">فراموشی رمز عبور</Link>
          <Link href="/login">ورود با کد</Link>
        </div>
        <Link href="/" className="flex items-center justify-center gap-2">
          بازگشت به خانه <ArrowLeft className="size-4" />
        </Link>
      </FormProvider>
    </div>
  );
}
