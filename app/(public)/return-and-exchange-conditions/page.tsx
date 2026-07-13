import { PackageX, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen pt-[52px] pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 pt-6">
          <h1 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-wide">
            شرایط تعویض و مرجوعی
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            راهنمای کامل شرایط بازگشت کالا در زوپینی
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-[#F5F0EB] border-r-4 border-[#D4A373] rounded-lg p-4 md:p-6 mb-8">
          <p className="text-sm md:text-base text-gray-700 font-medium">
            ⚠️ مهلت تعویض کالا: <span className="font-bold">۳ روز</span> پس از
            خرید حضوری و <span className="font-bold">۵ روز</span> پس از تحویل در
            خریدهای آنلاین
          </p>
        </div>

        {/* Exchange Conditions */}
        <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-6 h-6 text-[#D4A373]" />
            <h2 className="text-xl md:text-2xl font-light text-[#1A1A1A]">
              شرایط تعویض
            </h2>
          </div>
          <ul className="space-y-3 pr-4">
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>
                تعویض کالا تنها یکبار امکان‌پذیر است. لطفاً در انتخاب کالا دقت
                فرمایید.
              </span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>
                تعویض کالا در صورت استفاده از بن و یا کارت هدیه تنها یک بار
                امکان‌پذیر است.
              </span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>
                تعویض اکسسوری نظیر کمربند، جوراب، لباس زیر به علت رعایت نکات
                بهداشتی امکان‌پذیر نمی‌باشد.
              </span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>
                در صورت عدم موجودی کالای خریداری شده، مشتری قادر به تعویض کالا
                با همان ارزش و یا بالاتر (با پرداخت مابه‌التفاوت) می‌باشد.
              </span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>
                تعویض یا مرجوع کالای خریداری شده در زمان حراج‌ها و یا جشنواره‌ها
                به هیچ عنوان امکان‌پذیر نیست.
              </span>
            </li>
          </ul>
        </section>

        {/* Return Conditions */}
        <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <PackageX className="w-6 h-6 text-[#D4A373]" />
            <h2 className="text-xl md:text-2xl font-light text-[#1A1A1A]">
              شرایط مرجوعی
            </h2>
          </div>
          <ul className="space-y-3 pr-4">
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>
                مرجوعی محصولات، تنها در زمانی صورت می‌گیرد که کالا دچار ایراد و
                یا نقص تولید و یا اشتباه در ارسال کالا باشد.
              </span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>
                انصراف از خرید بدون ایراد کالا شامل عودت وجه نمی‌باشد (فقط تعویض
                طبق شرایط مجاز است).
              </span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>
                وجه پرداختی حداکثر طی ۳ روز به حساب مشتری عودت داده می‌شود.
              </span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>
                در خرید آنلاین هزینه ارسال کالا برای تعویض و یا مرجوعی برعهده
                مشتری می‌باشد. درصورت نقص کالا و یا ارسال اشتباه کالا هزینه
                تعویض کالا بر عهده مجموعه می‌باشد.
              </span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>
                تیم خدمات مشتریان زوپینی موظف است در تمامی مراحل پاسخگو و همراه
                مشتری باشد.
              </span>
            </li>
          </ul>
        </section>

        {/* General Conditions */}
        <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-[#D4A373]" />
            <h2 className="text-xl md:text-2xl font-light text-[#1A1A1A]">
              شرایط کلی
            </h2>
          </div>
          <ul className="space-y-3 pr-4">
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>ارائه فاکتور خرید الزامی است.</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>
                کالا باید بدون استفاده، بدون بو و شستشو با اتیکت و بسته‌بندی
                اولیه باشد.
              </span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
              <span className="text-[#D4A373] text-lg">•</span>
              <span>
                مهلت تعویض کالا <strong>۳ روز</strong> پس از خرید حضوری و{' '}
                <strong>۵ روز</strong> پس از تحویل در خریدهای آنلاین.
              </span>
            </li>
          </ul>
        </section>

        {/* Contact Support */}
        <div className="bg-[#FBF7F0] border border-[#E8DCCC] rounded-xl p-6 text-center mt-8">
          <p className="text-gray-600 text-sm md:text-base">
            در صورت داشتن هرگونه سوال، تیم پشتیبانی{' '}
            <Link
              href="/contact"
              className="text-[#D4A373] font-medium hover:underline"
            >
              زوپینی
            </Link>{' '}
            آماده پاسخگویی به شماست.
          </p>
        </div>
      </div>
    </div>
  );
}
