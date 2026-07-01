import Image from 'next/image';

import AnimateLink from '@/components/shared/animate-link';

export default function Footer() {
  return (
    <div className="p-12 bg-gray-200 flex flex-col gap-10">
      <div className="flex justify-between flex-wrap gap-10">
        <div className="flex flex-col gap-5">
          <span className="text-sm font-semibold">اطلاعات تماس</span>
          <ul className="flex flex-col gap-4 text-sm">
            <AnimateLink href="tel:02166745521">
              <li>021-66745521</li>
            </AnimateLink>
            <AnimateLink href="tel:09352715016">
              <li>09352715016</li>
            </AnimateLink>
            <AnimateLink href="mailto:zoppini.collection1@gmail.com">
              <li>zoppini.collection1@gmail.com</li>
            </AnimateLink>
          </ul>
        </div>
        <div className="flex flex-col gap-5">
          <span className="text-sm font-semibold">لینک های مفید</span>
          <ul className="flex flex-col gap-4 text-sm">
            <AnimateLink href="/blog">
              <li>مقالات</li>
            </AnimateLink>
            <AnimateLink href="">
              <li>درباره ما</li>
            </AnimateLink>
            <AnimateLink href="">
              <li>تماس با ما</li>
            </AnimateLink>
            <AnimateLink href="">
              <li>راهنمای خرید</li>
            </AnimateLink>
            <AnimateLink href="">
              <li>باشگاه مشتریان</li>
            </AnimateLink>
          </ul>
        </div>
        <div className="flex flex-col gap-5">
          <span className="text-sm font-semibold">راهنما</span>
          <ul className="flex flex-col gap-4 text-sm">
            <AnimateLink href="">
              <li>آدرس شعب</li>
            </AnimateLink>
            <AnimateLink href="">
              <li>سوالات متداول</li>
            </AnimateLink>
            <AnimateLink href="">
              <li>شرایط مرجوع</li>
            </AnimateLink>
            <AnimateLink href="">
              <li>رویداد ها</li>
            </AnimateLink>
          </ul>
        </div>
        {/* <div className="flex flex-col gap-5 max-w-72">
          <span className="text-sm font-semibold">خبرنامه</span>
          <p className="text-sm">
            از آخرین اخبار ما مطلع شوید، خلاقیت‌های جدید ما را کشف کنید و از
            امتیازات ویژه ما بهره‌مند شوید.
          </p>
          <Button>عضویت</Button>
        </div> */}
        <div className="flex flex-col gap-5 max-w-72">
          <span className="text-sm font-semibold">درباره ما</span>
          <p className="text-sm">
            لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ لورم
            ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ لورم ایپسوم متن
            ساختگی با تولید سادگی نامفهوم از صنعت چاپ
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-4">
          <a
            href="https://trustseal.enamad.ir/?id=623198&Code=7xRZA0dpQegx0Gn2tqPs9M4LH7bjIHMr"
            target="_blank"
          >
            <Image
              src="/footer/enamad.webp"
              alt="enamad"
              width={30}
              height={30}
            />
          </a>
          <Image
            src="/footer/smartis.webp"
            alt="smartis"
            width={30}
            height={30}
          />
          <Image
            src="/footer/snapppay.webp"
            alt="snapppay"
            width={30}
            height={30}
          />
          <Image src="/footer/tara.webp" alt="tara" width={30} height={30} />
          <Image
            src="/footer/zarinpal.webp"
            alt="zarinpal"
            width={30}
            height={30}
          />
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://www.aparat.com/shorts/user/zoppini.official/shorts"
            target="_blank"
            className=""
          >
            <Image
              className="grayscale-100 hover:grayscale-0 transition"
              src="/footer/aparat.webp"
              alt="aparat"
              width={20}
              height={20}
            />
          </a>
          <a href="https://ble.ir/zoppini" target="_blank" className="">
            <Image
              className="grayscale-100 hover:grayscale-0 transition"
              src="/footer/bale.webp"
              alt="bale"
              width={20}
              height={20}
            />
          </a>
          <a href="https://www.eitaa.com/zoppini" target="_blank" className="">
            <Image
              className="grayscale-100 hover:grayscale-0 transition"
              src="/footer/eitaa.webp"
              alt="eitaa"
              width={20}
              height={20}
            />
          </a>
          <a
            href="https://www.instagram.com/zoppini.official?igsh=MW02d3p6dnh2ODF0OA=="
            target="_blank"
            className=""
          >
            <Image
              className="grayscale-100 hover:grayscale-0 transition"
              src="/footer/instagram.webp"
              alt="instagram"
              width={20}
              height={20}
            />
          </a>
          <a
            href="https://rubika.ir/zoppini_officiall"
            target="_blank"
            className=""
          >
            <Image
              className="grayscale-100 hover:grayscale-0 transition"
              src="/footer/rubicka.webp"
              alt="rubicka"
              width={20}
              height={20}
            />
          </a>
        </div>
      </div>
      <p className="text-center text-xs">
        کلیه حقوق این سایت متعلق به زوپینی می باشد.
      </p>
    </div>
  );
}
