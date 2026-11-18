import Image from 'next/image';

import styles from './blackfriday.module.css';
import { CampaignPhaseCopy } from './countdown';

export function ComingSoonWait() {
  return (
    <section
      className="relative overflow-x-clip bg-[var(--cs-black)]"
      aria-labelledby="wait-heading"
    >
      <div
        dir="ltr"
        className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]"
      >
        <figure className="relative min-h-[28rem] overflow-hidden bg-[var(--cs-studio)] sm:min-h-[32rem] lg:min-h-[36rem]">
          <Image
            src="/campaign/studio/blazer-linen-cream.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-contain object-top"
          />
        </figure>
        <div
          dir="rtl"
          className="flex flex-col justify-center bg-[var(--cs-burgundy)] px-6 py-12 text-right sm:px-10 lg:px-12 lg:py-16"
        >
          <p
            dir="ltr"
            lang="en"
            className={`${styles.condensed} text-right text-xs tracking-[0.4em] text-[var(--cs-ivory)]/80 sm:text-sm`}
          >
            BLACK FRIDAY
          </p>
          <h2
            id="wait-heading"
            className={`${styles.persian} mt-5 text-[1.35rem] leading-tight text-[var(--cs-ivory)] sm:text-3xl lg:text-4xl`}
          >
            <CampaignPhaseCopy
              before="انتظارها رو به پایان است!"
              after="انتظارها به پایان رسید!"
            />
          </h2>
        </div>
      </div>
    </section>
  );
}
