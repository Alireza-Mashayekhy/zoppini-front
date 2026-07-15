'use client';
import { Mail, MapPin, Phone } from 'lucide-react';
import dynamic from 'next/dynamic';

const BranchesMap = dynamic(
  () => import('@/components/pages/branches/branches-map'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl" />
    ),
  },
);

export default function BranchesContent() {
  return (
    <div className="min-h-screen pt-[52px] pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 pt-6">
          <h1 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-wide">
            تماس با <span className="font-medium text-[#D4A373]">زوپینی</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            ما همیشه برای پاسخگویی به شما در دسترس هستیم
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Tehran Office */}
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border-r-4 border-[#D4A373]">
            <h2 className="text-xl font-medium text-[#1A1A1A] mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#D4A373]" />
              دفتر مرکزی (تهران)
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p className="text-gray-700 leading-relaxed">
                تهران، خیابان فردوسی، خیابان منوچهری، خیابان ارباب جمشید
                <br />
                پلاک ۱۷، واحد ۲۹، طبقه ۲
              </p>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-[#D4A373]" />
                <span>۰۲۱-۶۶۷۴۵۵۲۱</span>
                <span className="text-gray-400 mx-1">|</span>
                <span>۰۹۱۹۴۱۳۱۳۱۶</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-[#D4A373]" />
                <a
                  href="mailto:zoppini.collection1@gmail.com"
                  className="hover:text-[#D4A373] transition-colors"
                >
                  zoppini.collection1@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Kerman Branch */}
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border-r-4 border-[#D4A373]">
            <h2 className="text-xl font-medium text-[#1A1A1A] mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#D4A373]" />
              شعبه کرمان
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p className="text-gray-700 leading-relaxed">
                کرمان، خیابان هزار و یک شب، نبش کوچه ۶
              </p>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-[#D4A373]" />
                <span>۰۳۴-۳۲۴۸۷۸۷۶</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-[#D4A373]" />
                <a
                  href="mailto:zoppini.collection1@gmail.com"
                  className="hover:text-[#D4A373] transition-colors"
                >
                  zoppini.collection1@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <section className="bg-white rounded-2xl shadow-sm">
            <div className="h-[400px] md:h-[500px] w-full rounded-xl overflow-hidden bg-gray-100">
              <BranchesMap location={0} />
            </div>
          </section>
          <section className="bg-white rounded-2xl shadow-sm">
            <div className="h-[400px] md:h-[500px] w-full rounded-xl overflow-hidden bg-gray-100">
              <BranchesMap location={1} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
