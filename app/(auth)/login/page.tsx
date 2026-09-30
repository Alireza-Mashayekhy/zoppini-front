'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
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
import { useCallbackUrl } from '@/hooks/use-callback-url';
import { withCallbackUrl } from '@/lib/callback-url';
import { useLogin, useSendOtp } from '@/services/features/auth/hooks';
import { sendOtpDto } from '@/services/features/auth/types';

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [step, setStep] = useState<number>(1);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // ۲ دقیقه به ثانیه
  const [canResend, setCanResend] = useState(false);

  const sendOtpMutation = useSendOtp();
  const loginMutation = useLogin();
  const router = useRouter();
  const callbackUrl = useCallbackUrl();

  const schema = z.object({
    phone: z
      .string()
      .length(11, 'شماره تلفن وارد شده اشتباه است.')
      .startsWith('09', 'شماره تلفن وارد شده اشتباه است.'),
  });

  const methods = useForm<sendOtpDto>({
    defaultValues: {
      phone: '',
    },
    resolver: zodResolver(schema),
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

  const onSubmit = async (data: sendOtpDto) => {
    try {
      await sendOtpMutation.mutateAsync(data);
      setStep(2);
      setTimeLeft(120); // ریست تایمر
      setCanResend(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || 'خطا در ارسال کد';
      if (message == 'کد قبلا برای شما ارسال شده است') {
        setStep(2);
      } else {
        toast.error(message);
      }
    }
  };

  const onSubmitLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({
        code,
        phone: methods.getValues().phone,
      });

      router.push(callbackUrl ?? '/');
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || 'خطا در ارسال کد';
      toast.error(message);
    }
  };

  // ارسال مجدد کد
  const handleResendCode = async () => {
    try {
      await sendOtpMutation.mutateAsync({ phone: methods.getValues().phone });
      setTimeLeft(120);
      setCanResend(false);
      setCode('');
    } catch (error) {
      console.log(error);
    }
  };

  // فرمت نمایش زمان (دقیقه:ثانیه)
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
          onSubmit={methods.handleSubmit(onSubmit)}
          className="space-y-3"
        >
          <RHFInput label="شماره تلفن" name="phone" />
          <Button
            type="submit"
            loading={sendOtpMutation.isPending}
            size="lg"
            variant="dark"
            className="w-full"
          >
            ارسال کد
          </Button>
          <div className="flex items-center justify-between">
            <Link href={withCallbackUrl('/sign-up', callbackUrl)}>ثبت نام</Link>
            <Link href={withCallbackUrl('/login-with-pass', callbackUrl)}>
              ورود با رمز عبور
            </Link>
          </div>
          <Link href="/" className="flex items-center justify-center gap-2">
            بازگشت به خانه <ArrowLeft className="size-4" />
          </Link>
        </FormProvider>
      ) : (
        <form onSubmit={onSubmitLogin} className="space-y-4">
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

          {/* تایمر و دکمه ارسال مجدد */}
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
              تغییر شماره
            </span>
          </div>

          <Button
            type="submit"
            loading={loginMutation.isPending}
            disabled={code.length !== 5}
            size="lg"
            className="w-full"
            variant="dark"
          >
            ورود
          </Button>
        </form>
      )}
    </div>
  );
}
