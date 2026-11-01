import { Metadata } from 'next';

import HomeImagesManager from '@/components/admin/site-images/home-images-manager';

export const metadata: Metadata = {
  title: 'تصاویر صفحه اصلی | مدیریت',
  robots: {
    index: false,
  },
};

export default function SiteImagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">تصاویر صفحه اصلی</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          برای هر بخش از صفحه اصلی (پوستر ویدیوها، بنر فروش ویژه و تصاویر
          دسته‌بندی‌ها) می‌توانید تصویر دسکتاپ و موبایل + متن جایگزین (alt)
          آپلود کنید. تصویر موبایل اختیاری است؛ اگر آپلود نشود، همان تصویر
          دسکتاپ روی موبایل نمایش داده می‌شود. اگر برای جایگاهی تصویری آپلود
          نکنید، تصویر پیش‌فرض فعلی سایت نمایش داده می‌شود.
        </p>
      </div>

      <HomeImagesManager />
    </div>
  );
}
