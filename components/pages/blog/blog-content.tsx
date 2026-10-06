'use client';

import Image from 'next/image';
import { useMemo } from 'react';

import { prepareContent } from '@/lib/blog-toc';
import { mediaUrl } from '@/lib/media';
import { BlogBlock, BlogPostResponse } from '@/services/features/blog/types';

import BlogFaq from './blog-faq';
import BlogMediaGallery from './blog-media-gallery';
import BlogProductSlider from './blog-product-slider';
import BlogTableOfContents from './blog-table-of-contents';

const PROSE_CLASSES =
  'prose prose-neutral max-w-none rtl [&_h1]:scroll-mt-24 [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24 [&_h4]:scroll-mt-24 [&_img]:rounded-xl [&_video]:rounded-xl';

/**
 * نمایش مقاله در سایت.
 *
 * ترتیب بخش‌ها همان ترتیبی است که ادمین با درگ‌دراپ در پنل چیده است:
 * متن مقاله، فهرست مطالب، سوالات متداول، اسلایدر محصولات و گالری عکس/فیلم.
 */
export default function BlogContent({ post }: { post: BlogPostResponse }) {
  const { html, headings } = useMemo(
    () => prepareContent(post.content ?? ''),
    [post.content],
  );

  const blocks = useMemo<BlogBlock[]>(() => {
    const list = (post.blocks ?? []).filter(Boolean);

    // مقالات قدیمی که بلوکی ندارند: فقط متن مقاله نمایش داده می‌شود
    if (list.length === 0) return [{ type: 'content', items: [] }];

    // اگر جای متن اصلی مشخص نشده باشد، به انتهای مقاله می‌رود
    if (!list.some(block => block.type === 'content')) {
      return [...list, { type: 'content', items: [] }];
    }

    return list;
  }, [post.blocks]);

  const faqItems = blocks
    .filter(block => block.type === 'faq')
    .flatMap(block => block.items ?? [])
    .filter(item => item.question && item.answer);

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('fa-IR')
    : null;

  return (
    <article className="custom-container pb-10">
      {post.coverImage && (
        <div className="relative mb-8 aspect-video w-full overflow-hidden">
          <Image
            src={mediaUrl(post.coverImage)}
            fill
            alt={post.title}
            className="object-cover"
            priority
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-light">{post.title}</h1>

        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          {post.author?.fullName && <span>{post.author.fullName}</span>}
          {formattedDate && <span>{formattedDate}</span>}
        </div>

        {post.excerpt && (
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
        )}
      </header>

      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case 'toc':
            return (
              <BlogTableOfContents
                key={key}
                headings={headings}
                title={block.title || 'فهرست مطالب'}
              />
            );

          case 'content': {
            // بلوک‌های جدید متن خودشان را دارند؛ بلوک قدیمی از post.content می‌خواند.
            const blockHtml = block.items?.[0]?.html;
            const prepared = blockHtml ? prepareContent(blockHtml).html : html;

            return (
              <div
                key={key}
                className={PROSE_CLASSES}
                dangerouslySetInnerHTML={{ __html: prepared }}
              />
            );
          }

          case 'faq':
            return (
              <BlogFaq
                key={key}
                items={block.items ?? []}
                title={block.title}
              />
            );

          case 'slider':
            return (
              <BlogProductSlider
                key={key}
                items={block.items ?? []}
                title={block.title}
                autoplay={block.settings?.autoplay ?? true}
              />
            );

          case 'media':
            return (
              <BlogMediaGallery
                key={key}
                items={block.items ?? []}
                title={block.title}
              />
            );

          default:
            return null;
        }
      })}

      {faqItems.length > 0 && <FaqJsonLd items={faqItems} />}
    </article>
  );
}

/** داده‌ی ساخت‌یافته‌ی سوالات متداول برای گوگل */
function FaqJsonLd({
  items,
}: {
  items: { question?: string; answer?: string }[];
}) {
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
