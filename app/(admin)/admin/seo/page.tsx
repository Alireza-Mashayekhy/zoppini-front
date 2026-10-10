import { Metadata } from 'next';

import PageSeoList from '@/components/admin/seo/page-seo-list';

export const metadata: Metadata = {
  title: 'سئو صفحات | مدیریت',
  robots: {
    index: false,
  },
};

export default function SeoPagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">سئو صفحات</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          آدرس صفحه را وارد کنید و تایتل، متا تایتل، ایندکس، فالو، ریدایرکت و
          حضور در نقشه‌ی سایت را برایش مشخص کنید؛ حداکثر چند ده ثانیه بعد از
          ذخیره، روی همان صفحه در سایت اعمال می‌شود. سئوی محصولات و مقالات در
          صفحه‌ی ویرایش خودشان مدیریت می‌شود.
        </p>
      </div>

      <PageSeoList />
    </div>
  );
}
