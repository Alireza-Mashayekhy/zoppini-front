// components/pages/auth/forgot-password.tsx
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
import RHFInput from '@/components/form/rhf-input';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import {
  useForgotPassword,
  useResetPassword,
  useSendOtp,
} from '@/services/features/auth/hooks';
import { ResetPasswordDto, sendOtpDto } from '@/services/features/auth/types';

export default function ForgotPassword() {
  const [step, setStep] = useState<number>(1);
  const [phone, setPhone] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);

  const sendOtpMutation = useSendOtp();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();
  const router = useRouter();

  // شمای مرحله اول (شماره تلفن)
  const schemaStep1 = z.object({
    phone: z
      .string()
      .length(11, 'شماره تلفن وارد شده اشتباه است.')
      .startsWith('09', 'شماره تلفن وارد شده اشتباه است.'),
  });

  // شمای مرحله دوم (کد + رمز جدید)
  const schemaStep2 = z
    .object({
      code: z.string().length(5, 'کد باید ۵ رقم باشد'),
      password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر است'),
      confirmPassword: z.string().min(6, 'تکرار رمز عبور الزامی است'),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: 'رمز عبور و تکرار آن یکسان نیستند',
      path: ['confirmPassword'],
    });

  const methodsStep1 = useForm<sendOtpDto>({
    defaultValues: { phone: '' },
    resolver: zodResolver(schemaStep1),
  });

  const methodsStep2 = useForm<{
    code: string;
    password: string;
    confirmPassword: string;
  }>({
    defaultValues: { code: '', password: '', confirmPassword: '' },
    resolver: zodResolver(schemaStep2),
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
      setCanResend(true);
    }
  }, [step, timeLeft]);

  // مرحله اول: ارسال کد به شماره
  const onSubmitStep1 = async (data: sendOtpDto) => {
    try {
      await forgotPasswordMutation.mutateAsync(data);
      setPhone(data.phone);
      setStep(2);
      setTimeLeft(120);
      setCanResend(false);
      toast.success('کد به شماره شما ارسال شد');
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || 'خطا در ارسال کد';
      if (message === 'کد قبلا برای شما ارسال شده است') {
        setPhone(data.phone);
        setStep(2);
        setTimeLeft(120);
        setCanResend(false);
      } else {
        toast.error(message);
      }
    }
  };

  // مرحله دوم: ارسال کد + رمز جدید
  const onSubmitStep2 = async (data: {
    code: string;
    password: string;
    confirmPassword: string;
  }) => {
    const payload: ResetPasswordDto = {
      phone,
      code: data.code,
      newPassword: data.password,
    };

    try {
      await resetPasswordMutation.mutateAsync(payload);
      toast.success('رمز عبور با موفقیت تغییر کرد');
      router.push('/login');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        'خطا در تغییر رمز عبور';
      toast.error(message);
    }
  };

  // ارسال مجدد کد
  const handleResendCode = async () => {
    try {
      await sendOtpMutation.mutateAsync({ phone });
      setTimeLeft(120);
      setCanResend(false);
      methodsStep2.setValue('code', ''); // پاک کردن کد قبلی
      toast.success('کد جدید ارسال شد');
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
      {step === 1 && (
        <FormProvider
          methods={methodsStep1}
          onSubmit={methodsStep1.handleSubmit(onSubmitStep1)}
          className="space-y-3"
        >
          <RHFInput label="شماره تلفن" name="phone" />
          <Button
            type="submit"
            loading={forgotPasswordMutation.isPending}
            size="lg"
            variant="dark"
            className="w-full"
          >
            دریافت کد
          </Button>
          <Link href="/" className="flex items-center justify-center gap-2">
            بازگشت به خانه <ArrowLeft className="size-4" />
          </Link>
        </FormProvider>
      )}

      {step === 2 && (
        <FormProvider
          methods={methodsStep2}
          onSubmit={methodsStep2.handleSubmit(onSubmitStep2)}
          className="space-y-4"
        >
          <p className="text-sm text-center">
            کد به شماره <span className="font-semibold mx-1">{phone}</span>{' '}
            ارسال شد
          </p>

          {/* فیلد کد OTP */}
          <div className="space-y-1">
            <label className="block text-sm font-medium">کد تأیید</label>
            <InputOTP
              maxLength={5}
              value={methodsStep2.watch('code')}
              onChange={value => methodsStep2.setValue('code', value)}
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
          </div>

          <RHFInput label="رمز عبور جدید" name="password" type="password" />
          <RHFInput
            label="تکرار رمز عبور"
            name="confirmPassword"
            type="password"
          />

          {/* تایمر و ارسال مجدد */}
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
              onClick={() => {
                setStep(1);
                methodsStep2.reset();
              }}
              className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition"
            >
              تغییر شماره
            </span>
          </div>

          <Button
            type="submit"
            loading={resetPasswordMutation.isPending}
            size="lg"
            className="w-full"
            variant="dark"
          >
            تغییر رمز عبور
          </Button>
        </FormProvider>
      )}
    </div>
  );
}
