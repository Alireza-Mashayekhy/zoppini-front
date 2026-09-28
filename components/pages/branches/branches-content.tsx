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

interface locationsPropes {
  name: string;
  address: string;
  phone?: string | null;
  tel?: string | null;
  email?: string | null;
  coords: [number, number];
}

export default function BranchesContent() {
  const items: locationsPropes[] = [
    {
      name: 'دفتر مرکزی (تهران)',
      address:
        'تهران، خیابان فردوسی، خیابان منوچهری، خیابان ارباب جمشید پلاک ۱۷، واحد ۲۹، طبقه ۲',
      phone: '۰۹۱۹۴۱۳۱۳۱۶',
      tel: '۰۲۱-۶۶۷۴۵۵۲۱',
      email: 'zoppini.collection1@gmail.com',
      coords: [35.69776219399375, 51.42114981432789],
    },
    {
      name: 'شعبه کرمان',
      address: 'کرمان، خیابان هزار و یک شب، نبش کوچه ۶',
      phone: null,
      tel: '۰۳۴-۳۲۴۸۷۸۷۶',
      email: null,
      coords: [30.286455507638387, 57.03517457530013],
    },
    {
      name: 'شعبه تهران',
      address:
        'تهران , پاسداران، میدان هروی، خیابان موسوی شرقی، پلاک۱۴ مرکز خرید هدیش مال, طبقه سوم, پلاک 343',
      phone: null,
      tel: '021-26879141',
      email: null,
      coords: [35.7654305, 51.4807367],
    },
  ];

  return (
    <div className="min-h-screen pt-[52px] pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 pt-6">
          <h1 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-wide">
            شعب <span className="font-medium text-[#D4A373]">زوپینی</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            ما همیشه برای پاسخگویی به شما در دسترس هستیم
          </p>
        </div>

        <div className="space-y-4">
          {items?.map(item => (
            <div key={item.name} className="grid gap-2 sm:grid-cols-2">
              <div className="bg-white flex flex-col justify-around rounded-2xl shadow-sm p-6 md:p-8 border-r-4 border-[#D4A373]">
                <h2 className="text-xl font-medium text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#D4A373]" />
                  {item.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{item.address}</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-[#D4A373]" />
                  <span>{item.tel}</span>
                  {item?.phone && <span className="text-gray-400 mx-1">|</span>}
                  {item?.phone && <span>{item?.phone}</span>}
                </div>
                {item?.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-[#D4A373]" />
                    <a
                      href={`mailto:${item?.email}`}
                      className="hover:text-[#D4A373] transition-colors"
                    >
                      {item?.email}
                    </a>
                  </div>
                )}
              </div>
              <section className="bg-white rounded-2xl shadow-sm">
                <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-gray-100">
                  <BranchesMap location={item} />
                </div>
              </section>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
