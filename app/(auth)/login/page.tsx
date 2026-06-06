'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import FormProvider from '@/components/form/form-provider';
import RHFInput from '@/components/form/rhf-input';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useLogin, useSendOtp } from '@/services/features/auth/hooks';
import { sendOtpDto } from '@/services/features/auth/types';

export default function Login() {
  const [step, setStep] = useState<number>(1);
  const [code, setCode] = useState('');

  const sendOtpMutation = useSendOtp();
  const loginMutation = useLogin();

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

  const onSubmit = async (data: sendOtpDto) => {
    try {
      sendOtpMutation.mutateAsync(data);
      setStep(2);
    } catch (error) {
      console.log(error);
    }
  };

  const onSubmitLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      loginMutation.mutateAsync({ code, phone: methods.getValues().phone });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {step === 1 ? (
        <FormProvider
          methods={methods}
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <RHFInput label="شماره تلفن" name="phone" />
          <Button
            type="submit"
            loading={sendOtpMutation.isPending}
            size="lg"
            className="w-full"
          >
            ارسال کد
          </Button>
        </FormProvider>
      ) : (
        <form onSubmit={onSubmitLogin}>
          <InputOTP
            maxLength={5}
            value={code}
            onChange={value => setCode(value)}
            dir="rtl"
          >
            <InputOTPGroup className="w-full gap-2 ">
              <InputOTPSlot
                index={0}
                className="w-full h-11 border rounded-md"
              />
              <InputOTPSlot
                index={1}
                className="w-full h-11 border rounded-md"
              />
              <InputOTPSlot
                index={2}
                className="w-full h-11 border rounded-md"
              />
              <InputOTPSlot
                index={3}
                className="w-full h-11 border rounded-md"
              />
              <InputOTPSlot
                index={4}
                className="w-full h-11 border rounded-md"
              />
            </InputOTPGroup>
          </InputOTP>
          <Button
            type="submit"
            loading={loginMutation.isPending}
            disabled={code.length !== 5}
            size="lg"
            className="w-full"
          >
            ارسال کد
          </Button>
        </form>
      )}
    </>
  );
}
