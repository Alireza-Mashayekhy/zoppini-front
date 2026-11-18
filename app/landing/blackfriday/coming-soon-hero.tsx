import Image from 'next/image';

import styles from './blackfriday.module.css';
import { CampaignPhaseCopy, Countdown } from './countdown';

export function ComingSoonHero() {
  return (
    <section
      className="relative overflow-x-clip bg-[var(--cs-black)]"
      aria-labelledby="black-friday-heading"
    >
      <h1 id="black-friday-heading" className="sr-only" lang="en">
        BLACK FRIDAY
      </h1>
      <div
        dir="ltr"
        className="grid lg:min-h-[calc(100svh-var(--zp-header-h))] lg:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.1fr)]"
      >
        <div className="order-2 flex flex-col justify-center bg-[var(--cs-black)] px-5 py-10 sm:px-8 lg:order-1 lg:px-10 lg:py-14 xl:px-14">
          <p
            aria-hidden="true"
            className={`${styles.condensed} text-[3.3rem] leading-[0.76] font-bold tracking-[-0.05em] text-[var(--cs-crimson)] sm:text-[4.5rem] lg:text-[5.4rem]`}
          >
            BLACK
          </p>
          <p
            aria-hidden="true"
            className={`${styles.serif} mt-1 text-[2.7rem] leading-[0.84] font-medium tracking-[0.1em] text-[var(--cs-ivory)] italic sm:text-[3.6rem] lg:text-[4.5rem]`}
          >
            FRIDAY
          </p>
          <p
            className={`${styles.condensed} mt-8 text-xl font-medium tracking-[0.18em] text-[var(--cs-crimson)] sm:text-2xl`}
          >
            <span lang="en" aria-hidden="true">
              Up To 70% OFF
            </span>
            <span dir="rtl" className="sr-only">
              تا ۷۰٪ تخفیف
            </span>
          </p>
          <p
            dir="rtl"
            className={`${styles.persian} mt-4 text-right text-base leading-8 text-[var(--cs-ivory)]/85 sm:text-lg`}
          >
            پوشاک مردانه زوپینی
          </p>
          <p
            dir="rtl"
            className={`${styles.persian} mt-6 w-full text-right text-sm leading-8 text-[var(--cs-ivory)]/65 sm:text-[0.95rem]`}
          >
            <CampaignPhaseCopy
              before="بزرگ‌ترین رویداد فروش سال زوپینی به‌زودی آغاز می‌شود."
              after="بزرگ‌ترین رویداد فروش سال زوپینی آغاز شده است."
            />
          </p>
          <div className="mt-8 lg:mt-9">
            <Countdown />
          </div>
        </div>

        <figure className="relative order-1 min-h-[46svh] overflow-hidden bg-[var(--cs-studio)] sm:min-h-[52svh] lg:order-2 lg:min-h-full">
          <Image
            src="/campaign/studio/blazer-black.webp"
            alt=""
            fill
            preload
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-contain object-top"
          />
        </figure>
      </div>
    </section>
  );
}
