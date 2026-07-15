import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'درباره ما - زوپینی',
  description:
    'برند زوپینی فعالیت خود را از سال ۱۳۷۷ با هدف ارائه پوشاک مردانه با کیفیت و متفاوت آغاز کرد.طی بیش از دو دهه همواره کوشیده ایم فراتر از یک تولید کننده باشیم ،',
  alternates: {
    canonical: '/about-us',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-[52px] pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8 pt-6">
          <h1 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-wide">
            درباره <span className="font-medium text-[#D4A373]">زوپینی</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            بیش از دو دهه تعهد به کیفیت، طراحی و ظرافت
          </p>
        </div>

        {/* Brand Story */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8 border-r-4 border-[#D4A373]">
          <p className="text-gray-700 leading-relaxed text-base md:text-lg text-justify">
            برند زوپینی فعالیت خود را از سال{' '}
            <span className="font-medium">۱۳۷۷</span> با هدف ارائه پوشاک مردانه
            با کیفیت و متفاوت آغاز کرد.
            <br />
            <br />
            طی بیش از دو دهه همواره کوشیده‌ایم فراتر از یک تولیدکننده باشیم، ما
            زنجیره‌ای کامل از طراحی و تأمین مواد اولیه و تولید را به‌صورت تخصصی
            و یکپارچه در اختیار داریم.
          </p>
        </div>

        {/* Images Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-sm">
            <Image
              src="/about-us/image_1.webp"
              alt="طراحی و دوخت زوپینی"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
              <p className="text-white text-sm font-light">
                طراحی و دوخت تخصصی
              </p>
            </div>
          </div>
          <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-sm">
            <Image
              src="/about-us/image_2.webp"
              alt="محصولات زوپینی"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
              <p className="text-white text-sm font-light">
                کیفیت در تولید، نوآوری در طراحی
              </p>
            </div>
          </div>
        </div>

        {/* Products Style */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8">
          <p className="text-gray-700 leading-relaxed text-base md:text-lg text-justify">
            محصولات زوپینی در دو سبک <span className="font-medium">کلاسیک</span>{' '}
            و <span className="font-medium">کژوال</span> طراحی می‌شوند.
            <br />
            <br />
            از مهمترین مزیت‌های ما طراحی اختصاصی کت و شلوارهایی است که با الهام
            از فرم کلاسیک ایتالیایی، متناسب با سلیقه و استایل مرد ایرانی
            بازطراحی شده‌اند. این امر حاصل سالها تجربه، تحقیق و درک دقیق از
            آناتومی بدن آقایان و نیازهای روز بازار هدف است.
          </p>
        </div>

        {/* Three Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-[#D4A373]">
            <h3 className="text-xl font-light text-[#1A1A1A] mb-2">
              کیفیت در تولید
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              انتخاب دقیق مواد اولیه و نظارت بر تمام مراحل تولید
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-[#D4A373]">
            <h3 className="text-xl font-light text-[#1A1A1A] mb-2">
              نوآوری در طراحی
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              تلفیق سبک کلاسیک ایتالیایی با سلیقه ایرانی
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-[#D4A373]">
            <h3 className="text-xl font-light text-[#1A1A1A] mb-2">
              ظرافت در دوخت
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              دقت در جزییات و اجرای حرفه‌ای در تمام محصولات
            </p>
          </div>
        </div>

        {/* Future Vision */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-[#E8DCCC]">
          <h2 className="text-xl font-light text-[#1A1A1A] mb-3 tracking-wide">
            افق آینده
          </h2>
          <p className="text-gray-700 leading-relaxed text-base md:text-lg text-justify">
            افق آینده ما گسترده‌تر از امروز است. توسعه خطوط تولید، ورود به
            بازارهای بین‌المللی، به کارگیری فناوری‌های نوین در طراحی و فروش و
            ارائه تجربه‌ای متفاوت از برنامه‌های راهبردی ما در سال‌های پیش روست.
          </p>
        </div>
      </div>
    </div>
  );
}
