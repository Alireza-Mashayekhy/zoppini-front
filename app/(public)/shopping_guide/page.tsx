// app/guide/page.tsx
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'راهنمای خرید - زوپینی',
  description:
    'ما تلاش می‌کنیم تجربه‌ای مطمئن، ساده و رضایت‌بخش از خرید آنلاین برای شما بسازیم',
  openGraph: {
    title: 'راهنمای خرید - زوپینی',
    description:
      'ما تلاش می‌کنیم تجربه‌ای مطمئن، ساده و رضایت‌بخش از خرید آنلاین برای شما بسازیم',
    images: [{ url: '/og-image.jpg' }],
    type: 'website',
    siteName: 'زوپینی',
    locale: 'fa_IR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'راهنمای خرید - زوپینی',
    description:
      'ما تلاش می‌کنیم تجربه‌ای مطمئن، ساده و رضایت‌بخش از خرید آنلاین برای شما بسازیم',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function GuidePage() {
  return (
    <div className="min-h-screen pt-[80px] pb-12">
      <div className="custom-container mx-auto px-4 max-w-4xl">
        {/* Header with image */}
        <div className="relative w-full h-[200px] md:h-[300px] rounded-2xl overflow-hidden mb-10 shadow-lg">
          <Image
            src="/home/5 (5).jpg"
            alt="راهنمای خرید زوپینی"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <h1 className="text-white text-3xl md:text-5xl font-light tracking-wide">
              راهنمای خرید از <span className="font-medium">زوپینی</span>
            </h1>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8">
          <p className="text-gray-700 leading-relaxed text-base md:text-lg text-justify">
            در زوپینی تلاش کرده‌ایم تجربه خرید آنلاین را به ساده‌ترین، سریع‌ترین
            و مطمئن‌ترین شکل ممکن برای شما فراهم کنیم. از لحظه انتخاب محصول تا
            تحویل سفارش، همه‌چیز با دقت طراحی شده تا خریدی لذت‌بخش و بدون دغدغه
            را تجربه کنید.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border-r-4 border-gray-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-lg md:text-xl font-medium text-gray-800 mb-1">
                    {step.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Tracking */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-[#E8DCCC]">
          <h2 className="text-xl font-medium text-[#1A1A1A] mb-3">
            پیگیری سفارش
          </h2>
          <p className="text-gray-600 leading-relaxed">
            پس از ثبت سفارش، می‌توانید وضعیت آن را از طریق{' '}
            <Link
              href="/dashboard/orders"
              className="text-[#1A1A1A] font-medium underline underline-offset-2 hover:no-underline"
            >
              حساب کاربری
            </Link>
            خود پیگیری کنید. در هر مرحله نیز تیم پشتیبانی زوپینی آماده پاسخگویی
            و راهنمایی شما خواهد بود.
          </p>
        </div>

        {/* Final message */}
        <div className="mt-8 text-center">
          <p className="text-lg md:text-xl font-light text-[#1A1A1A] tracking-wide">
            در زوپینی، هدف ما تنها فروش نیست
          </p>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            ما تلاش می‌کنیم تجربه‌ای مطمئن، ساده و رضایت‌بخش از خرید آنلاین برای
            شما بسازیم.
          </p>
        </div>
      </div>
    </div>
  );
}

const steps = [
  {
    title: 'جست‌وجو و انتخاب',
    description:
      'برای شروع، محصول مورد نظر خود را از طریق جست‌وجوی سایت یا دسته‌بندی‌های محصولات پیدا کنید. در صفحه هر محصول می‌توانید تصاویر، توضیحات و مشخصات آن را به‌طور کامل بررسی کرده و با اطمینان انتخاب کنید.',
  },
  {
    title: 'افزودن به سبد خرید',
    description:
      'پس از انتخاب محصول، با کلیک روی گزینه «افزودن به سبد خرید»، آن را به سبد خرید خود اضافه کنید. شما می‌توانید چندین محصول را انتخاب کرده و خرید خود را در یک سفارش نهایی ثبت کنید.',
  },
  {
    title: 'بررسی سبد خرید',
    description:
      'در بخش سبد خرید، فهرست محصولات انتخابی خود را مشاهده کنید. در این مرحله امکان ویرایش تعداد، حذف یا اضافه کردن محصولات دیگر نیز برای شما فراهم است تا سفارش دقیقاً مطابق با انتخاب شما ثبت شود.',
  },
  {
    title: 'ثبت اطلاعات ارسال',
    description:
      'برای ارسال سفارش، اطلاعات دریافت‌کننده شامل نام، شماره تماس و آدرس دقیق را وارد کنید. ثبت صحیح این اطلاعات کمک می‌کند سفارش شما سریع‌تر و بدون مشکل به دستتان برسد.',
  },
  {
    title: 'پرداخت امن',
    description:
      'در زوپینی پرداخت‌ها از طریق درگاه‌های پرداخت امن انجام می‌شود. شما می‌توانید با اطمینان کامل و در محیطی ایمن، هزینه سفارش خود را به‌صورت آنلاین پرداخت کنید.',
  },
  {
    title: 'ثبت و پردازش سفارش',
    description:
      'پس از تکمیل پرداخت، سفارش شما با موفقیت ثبت می‌شود و تیم زوپینی بلافاصله فرآیند آماده‌سازی و ارسال آن را آغاز می‌کند.',
  },
];
