'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import FormProvider from '@/components/form/form-provider';
import { PersianDatePicker } from '@/components/form/persian-date-picker';
import RHFInput from '@/components/form/rhf-input';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useCallbackUrl } from '@/hooks/use-callback-url';
import { withCallbackUrl } from '@/lib/callback-url';
import {
  isAlreadySentError,
  isOtpExpiredError,
  OTP_TTL_SECONDS,
  otpErrorMessage,
  readOtpWindow,
} from '@/lib/otp-window';
import {
  buildSignUpPayload,
  signUpDetailsSchema,
  SignUpFormData,
} from '@/lib/sign-up';
import { useSendOtp, useSignUp } from '@/services/features/auth/hooks';

export default function SignUp() {
  return (
    <Suspense fallback={null}>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const [step, setStep] = useState<number>(1);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(OTP_TTL_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const sendOtpMutation = useSendOtp();
  const signUpMutation = useSignUp();
  const router = useRouter();
  const callbackUrl = useCallbackUrl();

  const methods = useForm<SignUpFormData>({
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      password: '',
      birthDate: '',
    },
    resolver: zodResolver(signUpDetailsSchema),
    mode: 'onChange',
  });

  // تایمر
  useEffect(() => {
    if (step !== 2) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanResend(true);
  }, [step, timeLeft]);

  const goToOtpStep = (expiresIn: number) => {
    setTimeLeft(expiresIn);
    setCanResend(false);
    setStep(2);
  };

  // مرحله اول: ارسال اطلاعات و درخواست کد
  const onSubmitStep1 = async (data: SignUpFormData) => {
    try {
      const result = await sendOtpMutation.mutateAsync({ phone: data.phone });
      goToOtpStep(readOtpWindow(result).expiresIn);
    } catch (error) {
      if (isAlreadySentError(error)) {
        // کد قبلی هنوز معتبر است: پیامک جدید نمیخواهیم، فقط برو مرحلهی کد
        goToOtpStep(timeLeft > 0 ? timeLeft : OTP_TTL_SECONDS);
      } else {
        toast.error(otpErrorMessage(error, 'خطا در ارسال کد'));
      }
    }
  };

  // مرحله دوم: تأیید کد و ثبت‌نام
  const onSubmitStep2 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = methods.getValues();
    const payload = buildSignUpPayload(formData, formData.phone, code);

    try {
      await signUpMutation.mutateAsync(payload);
      toast.success('ثبت‌نام موفق');
      await router.push(callbackUrl ?? '/');
      router.refresh();
    } catch (error) {
      if (isOtpExpiredError(error)) {
        setCode('');
        setTimeLeft(0);
        setCanResend(true);
      }
      toast.error(otpErrorMessage(error, 'خطا در ثبت‌نام'));
    }
  };

  // ارسال مجدد کد
  const handleResendCode = async () => {
    try {
      const result = await sendOtpMutation.mutateAsync({
        phone: methods.getValues('phone'),
      });
      const window = readOtpWindow(result);
      setTimeLeft(window.expiresIn);
      setCanResend(false);
      if (window.sent) setCode('');
    } catch (error) {
      if (isAlreadySentError(error)) {
        setCanResend(true);
        return;
      }
      toast.error(otpErrorMessage(error, 'خطا در ارسال مجدد'));
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
          <RHFInput
                  label="شماره تلفن"
                  name="phone"
                  inputMode="numeric"
                  autoComplete="tel"
                  dir="ltr"
                  placeholder="09xxxxxxxxx"
                />
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
            <Link href={withCallbackUrl('/login', callbackUrl)}>ورود</Link>
            <Link href={withCallbackUrl('/login-with-pass', callbackUrl)}>
              ورود با رمز عبور
            </Link>
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
