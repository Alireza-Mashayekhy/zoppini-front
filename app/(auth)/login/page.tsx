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
import { phoneField } from '@/lib/phone-field';
import {
  buildSignUpPayload,
  LoginSignUpDetails,
  loginSignUpDetailsSchema,
} from '@/lib/sign-up';
import { useLogin, useSendOtp, useSignUp } from '@/services/features/auth/hooks';
import { sendOtpDto } from '@/services/features/auth/types';

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  // ۱: شماره | ۲: کد | ۳: تکمیل اطلاعات ثبتنام (کاربر تازهای که کدش تأیید شد)
  const [step, setStep] = useState<number>(1);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(OTP_TTL_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const sendOtpMutation = useSendOtp();
  const loginMutation = useLogin();
  const signUpMutation = useSignUp();
  const router = useRouter();
  const callbackUrl = useCallbackUrl();

  const schema = z.object({
    phone: phoneField,
  });

  const methods = useForm<sendOtpDto>({
    defaultValues: {
      phone: '',
    },
    resolver: zodResolver(schema),
  });

  // همان فیلدها و همان استایل فرم ثبتنام، فقط بدون شماره (شماره تأیید شده است)
  const signUpMethods = useForm<LoginSignUpDetails>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      birthDate: '',
    },
    resolver: zodResolver(loginSignUpDetailsSchema),
    mode: 'onChange',
  });

  // تایمر — مقدار اولیه و هر ریست، از `expiresIn` سرور گرفته میشود تا دقیقاً
  // با انقضای کد و زمان مجاز ارسال مجدد یکی باشد.
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

  const onSubmit = async (data: sendOtpDto) => {
    try {
      const result = await sendOtpMutation.mutateAsync(data);
      // پاسخ موفق «کد قبلا ارسال شده» هم اینجاست: پیامک جدیدی نرفته،
      // ولی باید برویم مرحلهی کد تا همان کد قبلی وارد شود.
      goToOtpStep(readOtpWindow(result).expiresIn);
    } catch (error) {
      if (isAlreadySentError(error)) {
        // نسخهی قدیمی بکاند 429 «صبر کنید» میداد؛ خطا نشان نمیدهیم
        goToOtpStep(timeLeft > 0 ? timeLeft : OTP_TTL_SECONDS);
      } else {
        toast.error(otpErrorMessage(error, 'خطا در ارسال کد'));
      }
    }
  };

  const onSubmitLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await loginMutation.mutateAsync({
        code,
        phone: methods.getValues().phone,
      });

      // شماره تأیید شد ولی حسابی وجود ندارد: کد مصرف نشده، پس همان کد را
      // همراه اطلاعات ثبتنام به /auth/sign-up میفرستیم.
      if (result?.data?.signupRequired || result?.message === 'signup_required') {
        if (result.data?.expiresIn && result.data.expiresIn > 0) {
          setTimeLeft(result.data.expiresIn);
        }
        setStep(3);
        return;
      }

      await router.push(callbackUrl ?? '/');
      router.refresh();
    } catch (error) {
      // کد منقضی/باطل شده → سرور همان لحظه ارسال مجدد را آزاد کرده است
      if (isOtpExpiredError(error)) {
        setCode('');
        setTimeLeft(0);
        setCanResend(true);
      }
      toast.error(otpErrorMessage(error, 'خطا در ورود'));
    }
  };

  const onSubmitSignUp = async (data: LoginSignUpDetails) => {
    const payload = buildSignUpPayload(
      data,
      methods.getValues('phone'),
      code,
    );

    try {
      await signUpMutation.mutateAsync(payload);
      toast.success('ثبت‌نام موفق');
      await router.push(callbackUrl ?? '/');
      router.refresh();
    } catch (error) {
      if (isOtpExpiredError(error)) {
        // کد در فاصلهی پرکردن فرم منقضی شده → برگرد به مرحلهی کد برای ارسال مجدد
        toast.error(otpErrorMessage(error, 'کد منقضی شده است'));
        setCode('');
        setTimeLeft(0);
        setCanResend(true);
        setStep(2);
        return;
      }
      toast.error(otpErrorMessage(error, 'خطا در ثبتنام'));
    }
  };

  // ارسال مجدد کد
  const handleResendCode = async () => {
    try {
      const result = await sendOtpMutation.mutateAsync({
        phone: methods.getValues().phone,
      });
      const window = readOtpWindow(result);
      setTimeLeft(window.expiresIn);
      setCanResend(false);
      // فقط وقتی پیامک تازهای رفته کد واردشده را پاک میکنیم
      if (window.sent) setCode('');
    } catch (error) {
      if (isAlreadySentError(error)) {
        // سازگاری با بکاند قدیمی: خطای «صبر کنید» یعنی کد قبلی هنوز معتبر است
        setCanResend(true);
        return;
      }
      toast.error(otpErrorMessage(error, 'خطا در ارسال مجدد'));
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
          <RHFInput
            label="شماره تلفن"
            name="phone"
            inputMode="numeric"
            autoComplete="tel"
            dir="ltr"
            placeholder="09xxxxxxxxx"
          />
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
      ) : step === 2 ? (
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
      ) : (
        <FormProvider
          methods={signUpMethods}
          onSubmit={signUpMethods.handleSubmit(onSubmitSignUp)}
          className="space-y-3"
        >
          <p className="text-sm text-center">
            برای ادامه، اطلاعات ثبت‌نام را تکمیل کنید
          </p>
          <RHFInput label="نام کامل" name="fullName" />
          <RHFInput label="ایمیل (اختیاری)" name="email" type="email" />
          <RHFInput label="رمز عبور" name="password" type="password" />
          <PersianDatePicker
            name="birthDate"
            label="تاریخ تولد"
            placeholder="تاریخ تولد را انتخاب کنید"
          />
          <Button
            type="submit"
            loading={signUpMutation.isPending}
            size="lg"
            variant="dark"
            className="w-full"
          >
            ثبت‌نام
          </Button>
          <div className="flex items-center justify-between">
            <span
              onClick={() => {
                setCode('');
                setStep(1);
              }}
              className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition"
            >
              تغییر شماره
            </span>
            <Link href={withCallbackUrl('/login-with-pass', callbackUrl)}>
              ورود با رمز عبور
            </Link>
          </div>
          <Link href="/" className="flex items-center justify-center gap-2">
            بازگشت به خانه <ArrowLeft className="size-4" />
          </Link>
        </FormProvider>
      )}
    </div>
  );
}
