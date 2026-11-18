import Image from 'next/image';

import styles from './blackfriday.module.css';

const teasers = [
  { label: 'اکسسوری', image: '/campaign/studio/clutch-black.webp' },
  { label: 'شلوار', image: '/campaign/studio/trousers-classic.webp' },
  { label: 'پیراهن و بافت', image: '/campaign/studio/knit-fullzip-black.webp' },
  { label: 'کت‌وشلوار و بلیزر', image: '/campaign/studio/blazer-black.webp' },
] as const;

export function CategoryTeaser() {
  return (
    <section
      className="bg-[var(--cs-black)] px-5 py-16 sm:px-8 lg:px-12 lg:py-20"
      aria-labelledby="teaser-heading"
    >
      <h2 id="teaser-heading" className="sr-only">
        دسته‌ها
      </h2>
      <ul dir="ltr" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {teasers.map(item => (
          <li key={item.label} className="group min-w-0">
            <article className="border-b border-[var(--cs-crimson)]">
              <span className="relative block aspect-[3/4] overflow-hidden bg-[var(--cs-studio)]">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-contain object-center motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]"
                />
              </span>
              <p
                dir="rtl"
                className={`${styles.persian} px-1 py-4 text-center text-sm leading-8 text-[var(--cs-ivory)]`}
              >
                {item.label}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
