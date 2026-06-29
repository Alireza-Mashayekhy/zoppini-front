// app/dashboard/profile/page.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import FormProvider from '@/components/form/form-provider';
import { PersianDatePicker } from '@/components/form/persian-date-picker';
import RHFInput from '@/components/form/rhf-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMe } from '@/services/features/auth/hooks';
import { useUpdateProfile } from '@/services/features/users/hooks';
import { useAuthStore } from '@/store/auth.store';

const profileSchema = z.object({
  fullName: z.string().min(2, 'نام کامل حداقل ۲ کاراکتر است'),
  email: z.string().email('ایمیل نامعتبر است').optional().or(z.literal('')),
  birthDate: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const updateProfileMutation = useUpdateProfile();
  const { data: meData, isLoading, isSuccess } = useMe();
  const [isInitialized, setIsInitialized] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (isSuccess && meData) {
      setUser(meData);
    }
  }, [meData, setUser, isSuccess]);

  const methods = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      birthDate: '',
    },
  });

  const {
    reset,
    formState: { isDirty },
  } = methods;

  useEffect(() => {
    if (user && !Array.isArray(user) && !isInitialized) {
      console.log('user.birthDate', user.birthDate);
      reset({
        fullName: user.fullName || '',
        email: user.email || '',
        birthDate: user.birthDate,
      });
      setPhone(user.phone);
      setIsInitialized(true);
    }
  }, [user, reset, isInitialized]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user || !user.id) {
      toast.error('اطلاعات کاربر یافت نشد');
      return;
    }

    try {
      const updatedUser = await updateProfileMutation.mutateAsync({
        id: user.id,
        data,
      });
      setUser(updatedUser);
      toast.success('اطلاعات با موفقیت به‌روزرسانی شد');
    } catch (error: any) {
      toast.error(error?.message || 'خطا در به‌روزرسانی اطلاعات');
    }
  };

  if (isLoading) {
    return <div>در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-light tracking-wide">ویرایش پروفایل</h1>
      <FormProvider
        methods={methods}
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <RHFInput name="fullName" label="نام کامل" />
        <RHFInput name="email" label="ایمیل" type="email" />
        <PersianDatePicker
          name="birthDate"
          label="تاریخ تولد"
          placeholder="انتخاب تاریخ"
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            شماره تلفن
          </label>
          <Input value={phone || ''} disabled />
          <p className="text-xs text-gray-400">تغییر شماره تلفن ممکن نیست</p>
        </div>

        <Button
          type="submit"
          className="col-span-2"
          disabled={!isDirty || updateProfileMutation.isPending}
          loading={updateProfileMutation.isPending}
          variant="dark"
        >
          ذخیره تغییرات
        </Button>
      </FormProvider>
    </div>
  );
}
