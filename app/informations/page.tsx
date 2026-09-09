import Image from 'next/image';

import Header from '@/components/layout/public/header';
import InformationCard from '@/components/pages/information/card';
import Items from '@/components/pages/information/items';

export default function InformationPage() {
  return (
    <>
      <Header />
      <div className="pt-13">
        <div className="relative w-full aspect-square sm:aspect-video">
          <Image
            src="/information/desktop.jpg"
            fill
            alt="desktop banner"
            loading="eager"
            objectFit="cover"
            className="hidden sm:block"
          />
          <Image
            src="/information/mobile.jpg"
            fill
            alt="mobile banner"
            loading="eager"
            objectFit="cover"
            className="sm:hidden"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 p-4 my-4">
          <InformationCard
            name="شعبه هدیش مال"
            address="تهران, هدیش مال, طبقه سوم, پلاک 343"
            phoneDisplay="021-66745520"
            phoneHref="+982166745520"
            image={`/home/store-02.webp`}
            lat={35.76543938319641}
            lng={51.48074636594069}
          />
          <InformationCard
            name="شعبه کرمان"
            address="کرمان، خیابان هزار و یک شب، نبش کوچه ۶"
            phoneDisplay="034-32487876"
            phoneHref="03432487876"
            image={`/home/store-02.webp`}
            lat={30.286455507638387}
            lng={57.03517457530013}
          />
        </div>
        <Items />
      </div>
    </>
  );
}
