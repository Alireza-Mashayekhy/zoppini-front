'use client';

import { useEffect, useState } from 'react';

import { TocHeading } from '@/lib/blog-toc';
import { cn } from '@/lib/utils';

/**
 * فهرست مطالب مقاله.
 *
 * تیترها از خود متن مقاله ساخته می‌شوند (اتوماتیک) و لینک‌ها با اسکرول
 * نرم به همان تیتر می‌روند؛ تیتر فعال هم هم‌زمان مشخص می‌شود.
 */
export default function BlogTableOfContents({
  headings,
  title = 'فهرست مطالب',
  className,
}: {
  headings: TocHeading[];
  title?: string;
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map(heading => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => !!element);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-90px 0px -70% 0px', threshold: 0 },
    );

    elements.forEach(element => observer.observe(element));

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const minLevel = Math.min(...headings.map(heading => heading.level));

  return (
    <nav
      className={cn(
        'my-8 rounded-2xl border border-[#EFE4D6] bg-[#FBF7F0] p-5 md:p-6',
        className,
      )}
      aria-label={title}
    >
      <p className="mb-4 flex items-center gap-2 text-base font-medium text-[#1A1A1A]">
        {title}
      </p>

      <ol className="space-y-2">
        {headings.map(heading => {
          const isActive = activeId === heading.id;

          return (
            <li
              key={heading.id}
              style={{ paddingInlineStart: (heading.level - minLevel) * 16 }}
            >
              <a
                href={`#${heading.id}`}
                onClick={event => {
                  event.preventDefault();

                  document
                    .getElementById(heading.id)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setActiveId(heading.id);
                }}
                className={cn(
                  'block border-e-2 pe-3 text-sm leading-6 text-gray-600 transition-colors hover:text-[#B8895A]',
                  isActive
                    ? 'border-[#D4A373] font-medium text-[#B8895A]'
                    : 'border-transparent',
                )}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
