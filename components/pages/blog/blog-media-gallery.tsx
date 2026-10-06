'use client';

import Image from 'next/image';
import Link from 'next/link';

import { mediaUrl } from '@/lib/media';
import { BlogBlockItem } from '@/services/features/blog/types';

/**
 * گالری عکس و فیلم مقاله — فایل‌ها از سیستم ادمین آپلود شده‌اند.
 *
 * عکس‌ها با next/image بهینه می‌شوند و فیلم‌ها مستقیماً پخش می‌شوند.
 */
export default function BlogMediaGallery({
  items,
  title,
}: {
  items: BlogBlockItem[];
  title?: string | null;
}) {
  const media = items.filter(item => item.url);

  if (media.length === 0) return null;

  const isSingle = media.length === 1;

  return (
    <section className="my-8">
      {title && (
        <h2 className="mb-4 text-xl font-light text-[#1A1A1A] md:text-2xl">
          {title}
        </h2>
      )}

      <div
        className={
          isSingle
            ? 'space-y-4'
            : 'grid gap-4 sm:grid-cols-2 [&>figure:first-child]:sm:col-span-2'
        }
      >
        {media.map((item, index) => {
          const src = mediaUrl(item.url);

          const content =
            item.mediaType === 'video' ? (
              <video
                src={src}
                poster={item.poster ? mediaUrl(item.poster) : undefined}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full rounded-xl bg-black object-contain"
              />
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-50">
                <Image
                  src={src}
                  alt={item.alt || item.caption || 'تصویر مقاله'}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  loading="lazy"
                />
              </div>
            );

          return (
            <figure key={`${item.url}-${index}`} className="space-y-2">
              {item.linkUrl ? (
                <Link
                  href={item.linkUrl}
                  className="block"
                  target={item.linkUrl.startsWith('http') ? '_blank' : undefined}
                  rel={item.linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {content}
                </Link>
              ) : (
                content
              )}

              {item.caption && (
                <figcaption className="text-center text-xs text-gray-500 md:text-sm">
                  {item.caption}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
    </section>
  );
}
