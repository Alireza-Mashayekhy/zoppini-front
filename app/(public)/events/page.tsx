import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'رویداد ها - زوپینی',
  description:
    'ما همچنان در مسیر رشد، خلق تجربه‌های تازه و حضور در رویدادهای الهام‌بخش ادامه می‌دهیم؛',
  openGraph: {
    title: 'رویداد ها - زوپینی',
    description:
      'ما همچنان در مسیر رشد، خلق تجربه‌های تازه و حضور در رویدادهای الهام‌بخش ادامه می‌دهیم؛',
    images: [{ url: '/og-image.jpg' }],
    type: 'website',
    siteName: 'زوپینی',
    locale: 'fa_IR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'رویداد ها - زوپینی',
    description:
      'ما همچنان در مسیر رشد، خلق تجربه‌های تازه و حضور در رویدادهای الهام‌بخش ادامه می‌دهیم؛',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function EventsPage() {
  return (
    <div className="min-h-screen pt-[52px] pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8 pt-6">
          <h1 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-wide">
            رویدادهای <span className="font-medium text-[#D4A373]">زوپینی</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base leading-relaxed max-w-2xl">
            روایتی از انتخاب‌های دقیق، نگاه متمایز و استانداردی متفاوت در کیفیت
            و تجربه
          </p>
        </div>

        {/* Brand Story */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8 border-r-4 border-[#D4A373]">
          <p className="text-gray-700 leading-relaxed text-sm md:text-base text-justify">
            زوپینی تنها یک نام تجاری نیست؛ روایتی از انتخاب‌های دقیق، نگاه
            متمایز و استانداردی متفاوت در کیفیت و تجربه است.
            <br />
            <br />
            ما باور داریم یک برند زمانی معنا پیدا می‌کند که بتواند فراتر از
            محصولات، تجربه‌ای قابل لمس برای مخاطبان خود خلق کند.
            <br />
            حضور زوپینی در نمایشگاه‌ها، افتتاحیه‌ها و رویدادهای مختلف، بخشی از
            همین مسیر است؛ مسیری که در آن تلاش می‌کنیم از نزدیک با مخاطبان خود
            دیدار کنیم، نگاه و جهان برند را به اشتراک بگذاریم و تجربه‌ای متفاوت
            از زوپینی بسازیم.
          </p>
        </div>

        {/* Iran Retail Show 1404 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#D4A373] text-2xl">✦</span>
            <h2 className="text-2xl md:text-3xl font-light text-[#1A1A1A]">
              نمایشگاه ایران ریتیل شو ۱۴۰۴
            </h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <p className="text-gray-700 leading-relaxed text-sm md:text-base mb-6">
              زوپینی در نمایشگاه ایران ریتیل شو ۱۴۰۴ حضور داشت؛ رویدادی تخصصی در
              حوزه ریتیل که فرصتی ارزشمند برای تعامل با فعالان این صنعت و معرفی
              نگاه و محصولات زوپینی فراهم کرد.
              <br />
              <br />
              در این نمایشگاه، بازدیدکنندگان و فعالان حوزه ریتیل از نزدیک با
              فضای برند، محصولات و رویکرد زوپینی در ارائه تجربه‌ای متفاوت آشنا
              شدند.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {retailShowImages.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100"
                >
                  <Image
                    src={img}
                    alt={`نمایشگاه ایران ریتیل شو ${index + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kerman Branch Opening */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#D4A373] text-2xl">✦</span>
            <h2 className="text-2xl md:text-3xl font-light text-[#1A1A1A]">
              افتتاحیه شعبه کرمان زوپینی
            </h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <p className="text-gray-700 leading-relaxed text-sm md:text-base mb-6">
              افتتاح شعبه کرمان، نقطه‌ای مهم در مسیر رشد و گسترش زوپینی بود؛
              رویدادی که با حضور مهمانان و همراهان برند برگزار شد و فرصتی فراهم
              کرد تا فضای زوپینی از نزدیک تجربه شود.
              <br />
              <br />
              در این مراسم، مهمانان با محیط فروشگاه، محصولات و نگاه زوپینی به
              کیفیت و تجربه مشتری آشنا شدند. شعبه کرمان با همان هویت همیشگی
              زوپینی طراحی شده است؛ فضایی مدرن و خوش‌سلیقه که تلاش می‌کند
              تجربه‌ای متفاوت از خرید را برای مخاطبان فراهم کند.
              <br />
              <br />
              از حضور ارزشمند همه مهمانان و همراهانی که در این لحظه کنار زوپینی
              بودند صمیمانه سپاسگزاریم.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {kermanOpeningImages.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100"
                >
                  <Image
                    src={img}
                    alt={`افتتاحیه شعبه کرمان ${index + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing Message */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 text-center border border-[#E8DCCC]">
          <p className="text-gray-700 leading-relaxed text-base md:text-lg font-light">
            ما همچنان در مسیر رشد، خلق تجربه‌های تازه و حضور در رویدادهای
            الهام‌بخش ادامه می‌دهیم؛
          </p>
          <p className="text-[#D4A373] font-light text-sm md:text-base mt-2">
            چرا که باور داریم برندها، با تجربه‌هایی که می‌سازند در ذهن‌ها
            ماندگار می‌شوند.
          </p>
        </div>
      </div>
    </div>
  );
}

const retailShowImages = [
  'https://images.unsplash.com/photo-1605022093847-0400063b1758?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1601748389448-9a5b8a34c67a?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=300&fit=crop&crop=center',
];

const kermanOpeningImages = [
  'https://images.unsplash.com/photo-1605022093847-0400063b1758?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1601748389448-9a5b8a34c67a?w=400&h=300&fit=crop&crop=center',
];
