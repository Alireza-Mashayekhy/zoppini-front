'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import FormProvider from '@/components/form/form-provider';
import { PersianDatePicker } from '@/components/form/persian-date-picker';
import RHFInput from '@/components/form/rhf-input';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useSendOtp, useSignUp } from '@/services/features/auth/hooks';
import { SignUpDto } from '@/services/features/auth/types';

export default function SignUp() {
  const [step, setStep] = useState<number>(1);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);

  const sendOtpMutation = useSendOtp();
  const signUpMutation = useSignUp();
  const router = useRouter();

  // شمای اعتبارسنجی مرحله اول
  const schemaStep1 = z.object({
    fullName: z.string().min(3, 'نام کامل حداقل ۳ کاراکتر است'),
    phone: z
      .string()
      .length(11, 'شماره تلفن وارد شده اشتباه است.')
      .startsWith('09', 'شماره تلفن وارد شده اشتباه است.'),
    email: z.string().email('ایمیل نامعتبر است').optional().or(z.literal('')),
    password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر است'),
    birthDate: z.string().optional(),
  });

  type FormData = z.infer<typeof schemaStep1>;

  const methods = useForm<FormData>({
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      password: '',
      birthDate: '',
    },
    resolver: zodResolver(schemaStep1),
    mode: 'onChange',
  });

  // تایمر
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanResend(true);
    }
  }, [step, timeLeft]);

  // مرحله اول: ارسال اطلاعات و درخواست کد
  const onSubmitStep1 = async (data: FormData) => {
    try {
      await sendOtpMutation.mutateAsync({ phone: data.phone });
      setStep(2);
      setTimeLeft(120);
      setCanResend(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || 'خطا در ارسال کد';
      if (message === 'کد قبلا برای شما ارسال شده است') {
        setStep(2);
      } else {
        toast.error(message);
      }
    }
  };

  // مرحله دوم: تأیید کد و ثبت‌نام
  const onSubmitStep2 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = methods.getValues();
    const payload: SignUpDto = {
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email || '',
      code,
      password: formData.password,
      birthDate: formData.birthDate || '',
    };

    try {
      await signUpMutation.mutateAsync(payload);
      toast.success('ثبت‌نام موفق');
      router.push('/');
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || 'خطا در ثبت‌نام';
      toast.error(message);
    }
  };

  // ارسال مجدد کد
  const handleResendCode = async () => {
    try {
      await sendOtpMutation.mutateAsync({ phone: methods.getValues('phone') });
      setTimeLeft(120);
      setCanResend(false);
      setCode('');
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || 'خطا در ارسال مجدد';
      toast.error(message);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-[300px]">
      {step === 1 ? (
        <FormProvider
          methods={methods}
          onSubmit={methods.handleSubmit(onSubmitStep1)}
          className="space-y-3"
        >
          <RHFInput label="نام کامل" name="fullName" />
          <RHFInput label="شماره تلفن" name="phone" />
          <RHFInput label="ایمیل (اختیاری)" name="email" type="email" />
          <RHFInput label="رمز عبور" name="password" type="password" />
          <PersianDatePicker
            name="birthDate"
            label="تاریخ تولد"
            placeholder="تاریخ تولد را انتخاب کنید"
          />
          <Button
            type="submit"
            loading={sendOtpMutation.isPending}
            size="lg"
            variant="dark"
            className="w-full"
          >
            دریافت کد تایید
          </Button>
          <div className="flex items-center justify-between">
            <Link href="/login">ورود</Link>
            <Link href="/login-with-pass">ورود با رمز عبور</Link>
          </div>
          <Link href="/" className="flex items-center justify-center gap-2">
            بازگشت به خانه <ArrowLeft className="size-4" />
          </Link>
        </FormProvider>
      ) : (
        <form onSubmit={onSubmitStep2} className="space-y-4">
          <p className="text-sm text-center">
            کد به شماره{' '}
            <span className="font-semibold mx-1">
              {methods.getValues('phone')}
            </span>{' '}
            ارسال شد
          </p>

          <InputOTP
            maxLength={5}
            value={code}
            onChange={value => setCode(value)}
            dir="ltr"
            id="input-otp-ltr"
          >
            <InputOTPGroup className="w-full gap-2 flex-row-reverse">
              <InputOTPSlot
                index={0}
                className="w-full h-11 border rounded-none!"
              />
              <InputOTPSlot
                index={1}
                className="w-full h-11 border rounded-none!"
              />
              <InputOTPSlot
                index={2}
                className="w-full h-11 border rounded-none!"
              />
              <InputOTPSlot
                index={3}
                className="w-full h-11 border rounded-none!"
              />
              <InputOTPSlot
                index={4}
                className="w-full h-11 border rounded-none!"
              />
            </InputOTPGroup>
          </InputOTP>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={sendOtpMutation.isPending}
                  className="text-black underline underline-offset-2 hover:text-gray-600 disabled:opacity-50"
                >
                  {sendOtpMutation.isPending
                    ? 'در حال ارسال...'
                    : 'ارسال مجدد کد'}
                </button>
              ) : (
                <span>ارسال مجدد کد در {formatTime(timeLeft)}</span>
              )}
            </span>
            <span
              onClick={() => setStep(1)}
              className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition"
            >
              تغییر مشخصات
            </span>
          </div>

          <Button
            type="submit"
            loading={signUpMutation.isPending}
            disabled={code.length !== 5}
            size="lg"
            className="w-full"
            variant="dark"
          >
            ثبت‌نام
          </Button>
        </form>
      )}
    </div>
  );
}
