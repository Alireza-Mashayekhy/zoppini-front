import { Metadata } from 'next';
import Image from 'next/image';

import B2bSaleForm from '@/components/pages/b2b-sale/b2b-sale-form';

export const metadata: Metadata = {
  title: 'فروش سازمانی - زوپینی',
  description:
    'فروش سازمانی پوشاک مردانه به صورت عمده با قیمت همکاری ویژه. ارائه گیفت کارت و شرایط خرید آسان برای سازمان‌ها و شرکت‌ها.',
  openGraph: {
    title: 'فروش سازمانی زوپینی',
    description:
      'فروش سازمانی پوشاک مردانه به صورت عمده با قیمت همکاری ویژه. ارائه گیفت کارت و شرایط خرید آسان برای سازمان‌ها و شرکت‌ها',
    images: [{ url: '/b2b/banner.webp' }],
    type: 'website',
    siteName: 'زوپینی',
    locale: 'fa_IR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'فروش سازمانی زوپینی',
    description: 'آدرس و شماره تماس فروشگاه زوپینی',
  },
  alternates: {
    canonical: '/b2bsale',
  },
};

export default function B2bSalePage() {
  return (
    <div className="min-h-screen pt-[80px] pb-12">
      <div className="custom-container">
        {/* Hero Banner - فقط عکس (بدون متن روی آن) */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 shadow-lg">
          <Image
            src="/b2b/banner.webp"
            alt="همکاری سازمانی زوپینی"
            fill
            className="object-cover object-bottom"
            priority
          />
        </div>

        {/* متن معرفی (جایگزین متن روی بنر) */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-12 border-r-4 border-[#D4A373]">
          <h1 className="text-2xl md:text-4xl font-light text-[#1A1A1A] mb-3">
            فروش و همکاری سازمانی{' '}
            <span className="font-medium text-[#D4A373]">زوپینی</span>
          </h1>
          <p className="text-gray-700 leading-relaxed text-base md:text-lg">
            در زوپینی، همکاری با سازمان‌ها تنها یک فرآیند فروش نیست؛ بلکه
            شکل‌گیری یک ارتباط حرفه‌ای و پایدار بر پایه کیفیت، اعتماد و درک دقیق
            نیازهای هر مجموعه است.
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-12">
          <p className="text-gray-700 leading-relaxed text-base md:text-lg text-justify">
            ما با ارائه راهکارهای متنوع در حوزه فروش سازمانی، کارت‌های هدیه
            اختصاصی و تولید پوشاک سازمانی، تلاش می‌کنیم تجربه‌ای منظم، سریع و
            مطمئن برای سازمان‌ها و شرکت‌ها فراهم کنیم.
            <br />
            <br />
            زوپینی آماده همکاری با مجموعه‌های کوچک و بزرگ است و امکان اجرای
            پروژه‌های کوتاه‌مدت، سفارش‌های پروژه‌ای و همچنین قراردادهای بلندمدت
            سازمانی را فراهم کرده است تا هر سازمان بتواند متناسب با نیاز خود از
            خدمات ما بهره‌مند شود.
          </p>
        </div>

        {/* Gift Cards Section */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-[#1A1A1A] mb-2">
            کارت‌های هدیه سازمانی زوپینی
          </h2>
          <p className="text-[#8A8580] italic mb-6 text-sm md:text-base">
            {`"گاهی بهترین هدیه، آزادی انتخاب است."`}
          </p>
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <p className="text-gray-700 leading-relaxed mb-6">
              کارت‌های هدیه سازمانی زوپینی این امکان را فراهم می‌کنند که
              سازمان‌ها هدیه‌ای ارزشمند، کاربردی و در عین حال انعطاف‌پذیر به
              کارکنان، مشتریان یا شرکای تجاری خود ارائه دهند.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {giftFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 bg-[#FBF7F0] p-3 rounded-lg"
                >
                  <span className="text-[#D4A373] text-lg">✦</span>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Corporate Purchase Section */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-[#1A1A1A] mb-6">
            خرید سازمانی پوشاک (عمده و پروژه‌ای)
          </h2>
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <p className="text-gray-700 leading-relaxed mb-6">
              زوپینی با ارائه مجموعه‌ای متنوع از پوشاک و همچنین خدمات تولید
              اختصاصی، این امکان را فراهم کرده است که سازمان‌ها نیاز پوششی
              مجموعه خود را با کیفیت بالا و استانداردهای حرفه‌ای تأمین کنند.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {corporateFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 bg-[#FBF7F0] p-3 rounded-lg"
                >
                  <span className="text-[#D4A373] text-lg">✦</span>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gift Packages */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-[#1A1A1A] mb-6">
            بسته‌های هدیه سازمانی
          </h2>
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <p className="text-gray-700 leading-relaxed">
              زوپینی امکان ارائه کارت‌های هدیه با مبلغ دلخواه سازمان شما را
              فراهم کرده است.
              <br />
              این گزینه راهکاری حرفه‌ای برای قدردانی از کارکنان، مشتریان یا
              شرکای تجاری محسوب می‌شود و می‌تواند متناسب با نیاز و ساختار هر
              سازمان شخصی‌سازی شود.
            </p>
          </div>
        </div>

        {/* Long-term Collaboration */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-[#1A1A1A] mb-6">
            همکاری‌های بلندمدت سازمانی
          </h2>
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              زوپینی آماده همکاری بلندمدت با سازمان‌ها و مجموعه‌هاست. این
              همکاری‌ها می‌تواند شامل موارد زیر باشد:
            </p>
            <ul className="space-y-2 pr-4">
              <li className="flex items-start gap-3">
                <span className="text-[#D4A373] text-lg">•</span>
                <span className="text-gray-700">
                  تأمین دوره‌ای پوشاک سازمانی
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4A373] text-lg">•</span>
                <span className="text-gray-700">
                  اجرای پروژه‌های سالانه برای مجموعه‌ها
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4A373] text-lg">•</span>
                <span className="text-gray-700">
                  سفارش‌های مستمر و برنامه‌ریزی‌شده
                </span>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              هدف ما ایجاد همکاری‌هایی پایدار و قابل اعتماد است؛ همکاری‌هایی که
              در آن کیفیت، نظم در اجرا و رضایت سازمان‌ها در اولویت قرار دارد.
            </p>
          </div>
        </div>

        {/* Pricing Model */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-[#1A1A1A] mb-6">
            مدل قیمت‌گذاری
          </h2>
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <p className="text-gray-700 leading-relaxed">
              قیمت خدمات و محصولات سازمانی زوپینی بر اساس عوامل مختلفی تعیین
              می‌شود، از جمله:
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {pricingFactors.map((factor, index) => (
                <span
                  key={index}
                  className="bg-[#FBF7F0] px-4 py-2 rounded-full text-sm text-gray-700 border border-[#E8DCCC]"
                >
                  {factor}
                </span>
              ))}
            </div>
            <p className="text-gray-700 leading-relaxed mt-4">
              پس از ثبت درخواست، پیشنهاد قیمت به‌صورت اختصاصی بررسی شده و به شکل
              رسمی برای مجموعه شما ارسال خواهد شد.
            </p>
          </div>
        </div>

        {/* Process */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-[#1A1A1A] mb-6">
            روند ثبت درخواست و پاسخگویی
          </h2>
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {processSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-[#FBF7F0] rounded-lg"
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Corporate Form */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-[#1A1A1A] mb-6">
            درخواست استعلام قیمت سازمانی
          </h2>
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              برای دریافت مشاوره و استعلام قیمت، لطفاً فرم زیر را تکمیل نمایید.
              کارشناسان زوپینی در کوتاه‌ترین زمان ممکن با شما تماس خواهند گرفت.
            </p>
            <B2bSaleForm />
          </div>
        </div>

        {/* Video Section */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
          <video
            muted
            loop
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/b2b/video.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Footer Message */}
        <div className="mt-8 text-center">
          <p className="text-lg md:text-xl font-light text-[#1A1A1A] tracking-wide">
            زوپینی، شریک قابل اعتماد شما در تأمین پوشاک و راهکارهای حرفه‌ای
            سازمانی.
          </p>
        </div>
      </div>
    </div>
  );
}

const giftFeatures = [
  'امکان خرید از جدیدترین مجموعه‌های پوشاک زوپینی',
  'قابلیت تعیین مبلغ کارت متناسب با بودجه سازمان',
  'قابل استفاده برای خرید حضوری از فروشگاه‌های زوپینی',
  'امکان تعریف کد اختصاصی برای خرید آنلاین سازمان',
  'امکان تعیین مدت اعتبار کارت بر اساس درخواست مجموعه',
  'هدیه‌ای شیک، کاربردی و مناسب برای سلیقه‌های مختلف',
];

const corporateFeatures = [
  'تنوع گسترده در طرح‌ها، مدل‌ها و رنگ‌ها',
  'صرفه‌جویی در زمان و هزینه تأمین پوشاک سازمانی',
  'امکان سفارشی‌سازی محصولات متناسب با هویت سازمان',
  'طراحی و درج لوگوی اختصاصی بر روی سفارش‌ها',
  'کیفیت تضمین‌شده مطابق استانداردهای تولید',
  'برای تولید اختصاصی: حداقل سفارش ۸۰ عدد',
  'امکان نمونه‌دوزی برای سفارش‌های حجیم',
  'برای سفارش‌های کمتر از ۸۰ عدد: استفاده از الگوهای استاندارد مجموعه',
];

const pricingFactors = [
  'تعداد سفارش',
  'نوع محصول',
  'میزان سفارشی‌سازی',
  'جزئیات پروژه',
];

const processSteps = [
  'تکمیل فرم استعلام سازمانی در وب‌سایت',
  'بررسی اطلاعات توسط تیم زوپینی',
  'تماس کارشناسان حداکثر ظرف کمتر از یک ساعت',
  'ارائه مشاوره تخصصی و اعلام قیمت',
  'هماهنگی نهایی و آغاز همکاری',
];
