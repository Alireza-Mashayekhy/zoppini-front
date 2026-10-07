'use client';

import Image from 'next/image';
import { useMemo } from 'react';

import { createTocContext, prepareContent, TOC_MAX_LEVEL } from '@/lib/blog-toc';
import { mediaUrl, resolveHtmlMedia } from '@/lib/media';
import { BlogBlock, BlogPostResponse } from '@/services/features/blog/types';

import BlogFaq from './blog-faq';
import BlogMediaGallery from './blog-media-gallery';
import BlogProductSlider from './blog-product-slider';
import BlogTableOfContents from './blog-table-of-contents';

/**
 * نمایش مقاله در سایت.
 *
 * متن مقاله و بلوک‌های ویژه (اسلایدر محصولات، گالری، سوالات متداول و
 * فهرست مطالب) همه در یک HTML نگه‌داری می‌شوند؛ بک‌اند همان HTML را به
 * بخش‌های مرتب تبدیل می‌کند و اینجا هر بخش با کامپوننت مخصوص خودش رندر
 * می‌شود. ترتیب همان چیزی است که ادمین در ادیتور چیده است.
 */

const PROSE_CLASSES = 'zp-prose max-w-none rtl';

interface Segment {
  block: BlogBlock;
  index: number;
  /** HTML آماده‌ی نمایش (فقط برای بخش‌های متن) */
  html: string | null;
}

export default function BlogContent({ post }: { post: BlogPostResponse }) {
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

  /**
   * آماده‌سازی متن هر بخش و ساخت فهرست مطالب در یک پاس.
   *
   * id تیترها از یک زمینه‌ی مشترک ساخته می‌شود تا لینک فهرست مطالب دقیقاً
   * به همان تیتر برسد، حتی وقتی متن مقاله بین بلوک‌ها تکه‌تکه شده باشد.
   */
  const { segments, headings } = useMemo(() => {
    const context = createTocContext();

    // مقاله‌های قدیمی متن بلوک ندارند؛ فقط اولین بلوک content از post.content پر می‌شود
    const firstContentIndex = blocks.findIndex(block => block.type === 'content');

    const prepared: Segment[] = blocks.map((block, index) => {
      if (block.type !== 'content') return { block, index, html: null };

      const html = block.items?.[0]?.html?.trim()
        ? (block.items[0].html as string)
        : index === firstContentIndex
          ? (post.content ?? '')
          : '';

      if (!html.trim()) return { block, index, html: null };

      return {
        block,
        index,
        html: resolveHtmlMedia(
          prepareContent(html, TOC_MAX_LEVEL, context).html,
        ),
      };
    });

    return { segments: prepared, headings: context.headings };
  }, [blocks, post.content]);

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

      {segments.map(({ block, index, html }) => {
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

          case 'content':
            if (!html) return null;

            return (
              <div
                key={key}
                className={PROSE_CLASSES}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );

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
