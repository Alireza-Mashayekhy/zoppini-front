'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

const INSTAGRAM_URL = 'https://www.instagram.com/zoppini.official/';
const CHALLENGE_URL = '/gamification';

const steps = [
  {
    number: '1',
    title: 'استایل خود را پیدا کنید',
    description: 'به ۴ سؤال کوتاه جواب دهید.',
  },
  {
    number: '2',
    title: 'عضو باشگاه زوپینی شوید',
    description: 'اطلاعات خود را ثبت کنید و نتیجه استایلتان را ببینید.',
  },
  {
    number: '3',
    title: 'زوپینی را در اینستاگرام دنبال کنید',
    description: (
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        dir="ltr"
        className="text-[#e0c992] underline underline-offset-4 transition-colors hover:text-[#c9a96e]"
      >
        @zoppini.official
      </a>
    ),
  },
  {
    number: '4',
    title: 'اعتبار خود را دریافت کنید',
    description:
      'کارت هدیه ۲ میلیون تومانی خود را از کانتر زوپینی در هدیش مال دریافت کنید.',
  },
];

const styles = [
  {
    en: 'CLASSIC GENTLEMAN',
    fa: 'کلاسیک جنتلمن',
  },
  {
    en: 'MODERN CLASSIC',
    fa: 'مدرن کلاسیک',
  },
  {
    en: 'SMART CASUAL',
    fa: 'اسمارت کژوال',
  },
  {
    en: 'URBAN CASUAL',
    fa: 'اربان کژوال',
  },
];

const faqs = [
  {
    question: 'اعتبار خرید چطور فعال می‌شود؟',
    answer: (
      <>
        بعد از تکمیل تست استایل و ثبت اطلاعات، عضویت شما در باشگاه مشتریان
        زوپینی انجام می‌شود و کارت هدیه کمپین را از کانتر زوپینی دریافت می‌کنید.
      </>
    ),
  },
  {
    question: 'آیا شرکت در تست هزینه دارد؟',
    answer: 'خیر.',
  },
  {
    question: 'تست چقدر طول می‌کشد؟',
    answer: 'کمتر از یک دقیقه و شامل ۴ سؤال کوتاه است.',
  },
  {
    question: 'اعتبار تا چه زمانی قابل استفاده است؟',
    answer: 'تا پایان مهرماه.',
  },
  {
    question: 'کارت هدیه را از کجا دریافت کنم؟',
    answer: 'از کانتر زوپینی در هدیش مال.',
  },
  {
    question: 'آیا دنبال کردن اینستاگرام لازم است؟',
    answer: (
      <>
        بله. برای دریافت کارت هدیه، پیج رسمی زوپینی را دنبال کنید:{' '}
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className="text-[#e0c992] underline underline-offset-4"
        >
          @zoppini.official
        </a>
      </>
    ),
  },
];

function SectionTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`text-[clamp(1.35rem,4vw,1.85rem)] font-semibold leading-[1.45] text-[#f4f1eb] ${className}`}
    >
      {children}
    </h2>
  );
}

function GoldLine() {
  return (
    <div
      aria-hidden="true"
      className="my-5 h-px w-12 bg-linear-to-r from-transparent via-[#c9a96e] to-transparent"
    />
  );
}

function ChallengeButton({ className = '' }: { className?: string }) {
  return (
    <Button
      asChild
      className={`h-13.5 rounded-[8px] border-0 bg-linear-to-br from-[#c9a96e] to-[#a88b4a] px-6 text-base font-semibold text-[#0a0a0b] shadow-[0_4px_22px_rgba(201,169,110,0.28)] transition-all hover:-translate-y-px hover:from-[#e0c992] hover:to-[#c9a96e] hover:shadow-[0_6px_28px_rgba(201,169,110,0.4)] active:translate-y-0 ${className}`}
    >
      <Link href={CHALLENGE_URL}>شروع چالش استایل</Link>
    </Button>
  );
}

export default function OpeningLandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;

    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting);
      },
      {
        threshold: 0.15,
      },
    );

    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#090909] font-sans text-[#f4f1eb]"
      style={{
        backgroundImage: `
          radial-gradient(
            ellipse 80% 45% at 50% -15%,
            rgba(201,169,110,0.07),
            transparent
          ),
          radial-gradient(
            ellipse 50% 35% at 100% 80%,
            rgba(201,169,110,0.03),
            transparent
          )
        `,
      }}
    >
      {/* =====================================================
          HERO / FIRST FOLD
      ====================================================== */}

      <div ref={heroRef} className="flex min-h-dvh flex-col md:min-h-0">
        {/* Header */}
        <header className="shrink-0 px-5 pb-1 pt-[max(0.45rem,env(safe-area-inset-top))] text-center md:px-7 md:pt-6 lg:px-8 lg:pt-8">
          <Image
            src="/opening/zoppini-logo-full.png"
            alt="ZOPPINI"
            width={512}
            height={512}
            priority
            loading="eager"
            className="mx-auto w-26 object-contain sm:w-28 md:w-44 lg:w-49"
          />

          <div
            dir="ltr"
            className="mt-1 flex flex-col gap-0.5 text-[8px] uppercase tracking-[0.22em] text-[#9a9690] sm:text-[9px] md:mt-3 md:text-[10px] md:tracking-[0.32em] mb-3"
          >
            <span>OPENING EVENT</span>
            <span>HADISH MALL</span>
          </div>
        </header>

        {/* Hero */}
        <section
          aria-labelledby="hero-title"
          className="flex flex-1 flex-col pb-0 md:flex-none md:pb-9 lg:pb-10"
        >
          <div className="mx-auto flex min-h-0 w-full max-w-300 flex-1 flex-col gap-2 md:grid md:flex-none md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-7 md:px-7 lg:grid-cols-2 lg:gap-14 lg:px-8">
            {/* Copy */}
            <div className="shrink-0 px-5 text-center md:px-0 md:text-right">
              <p className="mb-1 text-[13px] leading-[1.55] text-[#9a9690] sm:text-sm md:mb-3 md:text-base">
                افتتاح شعبه زوپینی در هدیش مال
              </p>

              <h1
                id="hero-title"
                className="text-[clamp(1.45rem,6.2vw,1.85rem)] font-bold leading-tight tracking-tight sm:text-3xl md:text-[clamp(1.85rem,3.6vw,2.35rem)] lg:text-[2.75rem]"
              >
                <span className="mb-0.5 block text-[#e0c992]">
                  ۲ میلیون تومان
                </span>

                <span>اعتبار خرید هدیه بگیرید</span>
              </h1>

              <p className="mt-2 text-[13px] leading-[1.55] text-[#9a9690] sm:text-sm md:mt-4 md:text-[0.98rem] md:leading-[1.8]">
                استایل شخصی خود را در کمتر از یک دقیقه پیدا کنید،
                <br className="hidden sm:block" />
                عضو باشگاه مشتریان زوپینی شوید
                <br className="hidden sm:block" />و اعتبار افتتاحیه خود را
                دریافت کنید.
              </p>

              <div className="mt-3 flex w-full flex-col items-stretch md:mt-5 md:items-start">
                <ChallengeButton className="w-full sm:w-auto sm:min-w-60 lg:min-w-65" />

                <p className="mt-2 text-center text-[11px] text-[#9a9690] md:text-right">
                  تست کوتاه استایل • کمتر از یک دقیقه
                </p>

                <p className="mt-0.5 text-center text-[11px] text-[#c9a96e] md:text-right">
                  فقط ۴ سؤال کوتاه
                </p>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-[#111113] md:h-auto md:max-h-130 md:aspect-3/4 md:flex-none md:border md:border-white/8 lg:max-h-160">
              <Image
                src="/opening/hero.jpg"
                alt="کمپین افتتاحیه زوپینی — پوشاک مردانه پریمیوم"
                fill
                loading="eager"
                priority
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 600px"
                className="object-cover object-[center_20%]"
              />

              <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[rgba(9,9,9,0.8)]" />
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================
          STEPS
      ====================================================== */}

      <section className="px-5 py-11 md:px-7 md:py-14 lg:px-8 lg:py-18">
        <div className="mx-auto w-full max-w-280">
          <SectionTitle>چطور اعتبار خرید را دریافت می‌کنید؟</SectionTitle>

          <GoldLine />

          <ol className="mt-7 grid grid-cols-1 border-t border-white/8 lg:grid-cols-2 lg:gap-x-8 lg:border-t-0">
            {steps.map(step => (
              <li
                key={step.number}
                className="grid grid-cols-[3rem_1fr] gap-4 border-b border-white/8 py-5 lg:border-t lg:border-b-0"
              >
                <span
                  dir="ltr"
                  aria-hidden="true"
                  className="text-[1.35rem] font-light leading-tight text-[#c9a96e]"
                >
                  {step.number}
                </span>

                <div>
                  <h3 className="mb-1 text-base font-semibold sm:text-[1.05rem]">
                    {step.title}
                  </h3>

                  <div className="text-sm leading-[1.8] text-[#9a9690]">
                    {step.description}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* =====================================================
          STYLE PROFILES
      ====================================================== */}

      <section className="px-5 py-9 md:px-7 md:py-11 lg:px-8 lg:py-13">
        <div className="mx-auto w-full max-w-280">
          <SectionTitle>استایل شما کدام است؟</SectionTitle>

          <p className="mt-2 max-w-xl text-sm leading-[1.8] text-[#9a9690] sm:text-[0.98rem]">
            با چند انتخاب ساده ببینید کدام استایل بیشتر به شما نزدیک است.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
            {styles.map(style => (
              <div
                key={style.en}
                className="rounded-[8px] border border-white/8 bg-[rgba(18,18,20,0.65)] p-5 transition-all duration-300 hover:border-[rgba(201,169,110,0.35)] hover:bg-[rgba(27,27,29,0.8)]"
              >
                <span
                  dir="ltr"
                  className="block mb-1 text-[10px] tracking-[0.2em] text-[#c9a96e] sm:text-xs"
                >
                  {style.en}
                </span>

                <span className="text-base font-medium">{style.fa}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          BRAND
      ====================================================== */}

      <section className="px-5 py-11 md:px-7 md:py-14 lg:px-8 lg:py-18">
        <div className="mx-auto grid w-full max-w-280 grid-cols-1 items-center gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div>
            <SectionTitle>
              زوپینی؛ استایل مردانه برای انتخاب‌های متفاوت
            </SectionTitle>

            <GoldLine />

            <div className="space-y-4 text-[15px] leading-[1.9] text-[#9a9690]">
              <p>
                زوپینی با بیش از دو دهه تجربه در صنعت پوشاک، با تمرکز بر طراحی،
                کیفیت و تنوع استایل مردانه فعالیت می‌کند.
              </p>

              <p>
                حالا برای اولین بار، تجربه زوپینی را در شعبه هدیش مال از نزدیک
                خواهید داشت.
              </p>
            </div>
          </div>

          <div className="relative aspect-16/10 overflow-hidden border border-white/8 bg-[#111113]">
            <Image
              src="/opening/brand.jpg"
              alt="استایل مردانه زوپینی — کمپین افتتاحیه"
              fill
              loading="lazy"
              sizes="(max-width: 1023px) 100vw, 550px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          OFFER
      ====================================================== */}

      <section className="px-5 py-11 md:px-7 md:py-14 lg:px-8 lg:py-18">
        <div className="mx-auto w-full max-w-280">
          <div className="mx-auto max-w-180 rounded-[8px] border border-[rgba(201,169,110,0.35)] bg-[radial-gradient(ellipse_80%_70%_at_50%_0%,rgba(201,169,110,0.08),transparent_60%),#121214] px-5 py-8 text-center sm:px-8 lg:py-10">
            <p className="mb-3 text-[10px] tracking-[0.28em] text-[#c9a96e]">
              هدیه افتتاحیه
            </p>

            <p
              dir="ltr"
              className="text-[clamp(1.7rem,7.5vw,2.75rem)] font-bold leading-tight tracking-tight text-[#e0c992]"
            >
              ۲,۰۰۰,۰۰۰ تومان
            </p>

            <p className="mt-1 text-base text-[#f4f1eb]">اعتبار خرید زوپینی</p>

            <p className="mx-auto mt-5 max-w-md text-sm leading-[1.8] text-[#9a9690]">
              با تکمیل چالش استایل و عضویت در باشگاه مشتریان زوپینی، اعتبار
              افتتاحیه خود را دریافت کنید.
            </p>

            <div className="mx-auto mt-6 max-w-md border-t border-white/8 pt-5 text-sm leading-[1.85] text-[#9a9690]">
              <p>برای دریافت کارت هدیه، پیج رسمی زوپینی را دنبال کنید:</p>

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="mt-1 inline-flex items-center gap-1 text-[#e0c992] underline underline-offset-4 transition-colors hover:text-[#c9a96e]"
              >
                @zoppini.official
              </a>

              <p className="mt-3">اعتبار تا پایان مهرماه قابل استفاده است.</p>

              <p>قابل استفاده در فروشگاه زوپینی — هدیش مال</p>
            </div>

            <div className="mt-7 flex justify-center">
              <ChallengeButton className="w-full sm:w-auto sm:min-w-65" />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          LOCATION
      ====================================================== */}

      <section className="px-5 py-12 text-center md:px-7 md:py-14 lg:px-8">
        <div className="mx-auto w-full max-w-280">
          <SectionTitle>منتظرتان هستیم</SectionTitle>

          <p
            dir="ltr"
            className="mt-2 text-xs tracking-[0.35em] text-[#c9a96e]"
          >
            ZOPPINI
          </p>

          <p className="mt-2 text-xl font-semibold">هدیش مال</p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-6">
            <Image
              src="/opening/hadish-mall-logo.png"
              alt="Hadish Mall"
              width={240}
              height={240}
              loading="lazy"
              className="w-22.5 object-contain sm:w-30"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          FAQ
      ====================================================== */}

      <section className="px-5 py-11 md:px-7 md:py-14 lg:px-8 lg:py-18">
        <div className="mx-auto w-full max-w-280">
          <SectionTitle>سؤالات متداول</SectionTitle>

          <GoldLine />

          <Accordion
            type="single"
            collapsible
            className="mt-7 border-t border-white/8"
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${index + 1}`}
                className="border-b border-white/8"
              >
                <AccordionTrigger className="min-h-12 py-4 text-right text-sm font-medium hover:no-underline [&>svg]:size-4 [&>svg]:text-[#c9a96e]">
                  {faq.question}
                </AccordionTrigger>

                <AccordionContent className="pb-5 text-sm leading-[1.85] text-[#9a9690]">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section
        className="px-5 py-11 text-center md:px-7 md:py-14 lg:px-8 lg:py-14"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(201,169,110,0.07), transparent 65%)',
        }}
      >
        <div className="mx-auto max-w-280">
          <SectionTitle>استایل شما کدام است؟</SectionTitle>

          <p className="mx-auto mt-4 max-w-sm text-[15px] leading-[1.9] text-[#9a9690]">
            ۴ سؤال کوتاه.
            <br />
            یک نتیجه شخصی.
            <br />۲ میلیون تومان اعتبار خرید.
          </p>

          <div className="mt-6 flex justify-center">
            <ChallengeButton className="w-full sm:w-auto sm:min-w-65" />
          </div>

          <p className="mt-3 text-xs text-[#9a9690]">کمتر از یک دقیقه</p>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-white/8 px-5 pb-[max(2.25rem,calc(env(safe-area-inset-bottom)+5.75rem))] pt-9 text-center lg:px-8 lg:pb-10">
        <Image
          src="/opening/zoppini-logo.png"
          alt="ZOPPINI"
          width={220}
          height={60}
          loading="lazy"
          className="mx-auto w-30 opacity-90"
        />

        <p
          dir="ltr"
          className="mt-3 text-[10px] tracking-[0.22em] text-[#9a9690]"
        >
          {`ZOPPINI — Men's Fashion`}
        </p>

        <p className="mt-2 text-xs text-[#9a9690]">© ZOPPINI</p>

        <a
          href="https://www.zoppinico.com"
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className="mt-2 inline-block text-xs text-[#9a9690] transition-colors hover:text-[#c9a96e]"
        >
          zoppinico.com
        </a>
      </footer>

      {/* =====================================================
          MOBILE STICKY CTA
      ====================================================== */}

      <div
        aria-hidden={!showSticky}
        className={`fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 transition-all duration-300 md:hidden ${showSticky ? 'translate-y-0 opacity-100 pointer-events-auto' : 'pointer-events-none translate-y-[110%] opacity-0'}`}
        style={{
          background:
            'linear-gradient(180deg, transparent, rgba(9,9,9,0.92) 28%, rgba(9,9,9,0.98))',
        }}
      >
        <ChallengeButton className="w-full shadow-[0_4px_24px_rgba(201,169,110,0.35)]" />
      </div>
    </main>
  );
}
