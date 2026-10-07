'use client';

import { Eraser, Eye,FileCode2, LayoutList, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  decodeBlockConfig,
  hasEditorBlocks,
  renderBlockHtml,
  ZoppiniEditor,
} from '@/components/editor';
import { BLOCK_KIND_ATTRIBUTE } from '@/components/editor/lib/block-html';
import { BLOCK_LABELS } from '@/components/editor/lib/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolveHtmlMedia } from '@/lib/media';

/**
 * صفحه‌ی آزمایش ادیتور (فقط محیط توسعه).
 *
 * سه نما دارد: ادیتور، چیزی که کاربر در سایت می‌بیند، و همان HTML که در
 * دیتابیس ذخیره می‌شود به‌همراه بلوک‌هایی که بک‌اند از آن بیرون می‌کشد.
 */

/**
 * تصویر نمونه به‌شکل data URI تا پیش‌نمایش بدون سرور فایل هم کار کند.
 * در مقاله‌ی واقعی، آدرس فایل آپلودشده به‌صورت نسبی ذخیره می‌شود.
 */
const SAMPLE_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='420'%3E%3Crect width='800' height='420' fill='%23efe4d6'/%3E%3Crect x='24' y='24' width='752' height='372' fill='none' stroke='%23d4a373' stroke-width='2'/%3E%3Ctext x='400' y='224' font-family='sans-serif' font-size='34' fill='%23b8895a' text-anchor='middle'%3EZOPPINI%3C/text%3E%3C/svg%3E";

/** ویدیوی نمونه‌ی عمومی (کوچک) برای دیدن نود ویدیو */
const SAMPLE_VIDEO =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

/** نمونه‌ی یک مقاله‌ی کامل برای دیدن همه‌ی امکانات بدون تایپ دستی */
const SAMPLE_HTML = [
  '<h2>راهنمای انتخاب کت شلوار مردانه</h2>',
  '<p>انتخاب کت شلوار فقط انتخاب رنگ نیست؛ <strong>جنس پارچه</strong>، <em>برش</em> و تناسب با فرم بدن تعیین می‌کند که لباس در تن چطور می‌نشیند. در این راهنما همه‌ی این موارد را کوتاه مرور می‌کنیم.</p>',
  renderBlockHtml('toc', { title: 'فهرست مطالب' }),
  '<h3>۱. جنس پارچه</h3>',
  '<p>برای استفاده‌ی روزمره پارچه‌ی پشمی سبک یا ترکیب پشم و پلی‌استر انتخاب مناسبی است؛ برای مراسم رسمی، پشم خالص با بافت ریز ظاهر بهتری دارد.</p>',
  '<ul><li>پشم خالص: فرم‌پذیری و دوام بالا</li><li>کتان: خنک و مناسب بهار</li><li>مخمل: فقط برای مراسم شب</li></ul>',
  '<blockquote><p>قانون ساده: کت باید روی شانه دقیقاً اندازه باشد؛ بقیه‌ی اصلاحات را خیاط انجام می‌دهد.</p></blockquote>',
  '<h3>۲. رنگ و ست کردن</h3>',
  '<p>سرمه‌ای و طوسی دو رنگ پایه‌ای هستند که با بیشتر پیراهن‌ها ست می‌شوند. اگر اولین کت شلوار خود را می‌خرید، از یکی از این دو شروع کنید.</p>',
  '<ol><li>کت شلوار سرمه‌ای + پیراهن سفید</li><li>کت طوسی + پیراهن آبی روشن</li><li>کت مشکی + پیراهن سفید (رسمی)</li></ol>',
  `<figure data-zp-image="" class="zp-figure zp-figure--image is-align-center" style="width:70%"><img src="${SAMPLE_IMAGE}" loading="lazy" alt="نمونه تصویر مقاله"><figcaption>تصویر نمونه؛ روی تصویر کلیک کنید تا نوار ابزار اندازه و چینش باز شود.</figcaption></figure>`,
  `<figure data-zp-video="" class="zp-figure zp-figure--video is-align-center" style="width:60%"><video src="${SAMPLE_VIDEO}" controls preload="metadata"></video><figcaption>ویدیوی نمونه با کنترل پخش</figcaption></figure>`,
  '<hr>',
  '<h3>۳. نمونه‌های موجود در فروشگاه</h3>',
  renderBlockHtml('slider', {
    title: 'محصولات مرتبط با این راهنما',
    autoplay: true,
    items: [
      {
        productId: 101,
        badge: 'پیشنهاد ویژه',
        product: {
          id: 101,
          title: 'کت شلوار کلاسیک سرمه‌ای',
          slug: 'classic-navy-suit',
          image: null,
          price: 9800000,
          inStock: true,
          colorOptions: [],
        },
      },
      {
        productId: 102,
        product: {
          id: 102,
          title: 'کت تک طوسی پشمی',
          slug: 'grey-wool-blazer',
          image: null,
          price: 6400000,
          inStock: true,
          colorOptions: [],
        },
      },
    ],
  }),
  renderBlockHtml('media', {
    title: 'گالری استایل',
    items: [
      {
        mediaType: 'image',
        url: 'images/sample-look.webp',
        alt: 'نمونه ست کت شلوار',
        caption: 'ست سرمه‌ای با پیراهن سفید',
      },
    ],
  }),
  '<h3>۴. نگهداری از کت شلوار</h3>',
  '<p data-dir="rtl">کت را بعد از هر بار پوشیدن روی چوب‌لباسی مناسب بگذارید و فقط در صورت نیاز بشویید.</p>',
  '<ul data-type="taskList"><li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>برس‌زدن بعد از هر بار پوشیدن</p></div></li><li data-checked="false"><label><input type="checkbox"><span></span></label><div><p>شست‌وشوی خشک، حداکثر دو بار در سال</p></div></li></ul>',
  renderBlockHtml('faq', {
    title: 'سوالات متداول',
    items: [
      {
        question: 'سایز کت شلوار را چطور انتخاب کنم؟',
        answer:
          'دور سینه را اندازه بگیرید و با جدول سایز همان محصول مقایسه کنید. اگر بین دو سایز بودید، سایز بزرگ‌تر را انتخاب کنید تا امکان تنگ‌کردن داشته باشید.',
      },
      {
        question: 'امکان تعویض کالا وجود دارد؟',
        answer:
          'بله؛ تا ۷ روز پس از تحویل، در صورت نو بودن کالا و داشتن برچسب، تعویض سایز انجام می‌شود.',
      },
    ],
  }),
].join('');

/** div بلوک ویژه، همان قراردادی که بک‌اند هم می‌خواند */
const BLOCK_TAG_REGEX = /<div\b[^>]*data-zp-block\s*=\s*(["'])([^"']+)\1[^>]*>\s*<\/div>/gi;
const CONFIG_REGEX = /data-zp-config\s*=\s*"([^"]*)"/i;

interface ParsedBlock {
  kind: string;
  title: string;
  items: number;
}

/** استخراج بلوک‌های ویژه از HTML (نمایش ساده‌ی کاری که سرویس مقاله می‌کند) */
function parseBlocks(html: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];

  for (const match of html.matchAll(BLOCK_TAG_REGEX)) {
    const config = (decodeBlockConfig(
      CONFIG_REGEX.exec(match[0])?.[1],
    ) ?? {}) as { title?: string | null; items?: unknown[] };

    blocks.push({
      kind: match[2],
      title: config.title?.trim() || '',
      items: Array.isArray(config.items) ? config.items.length : 0,
    });
  }

  return blocks;
}

export default function EditorDemo() {
  const [html, setHtml] = useState(SAMPLE_HTML);
  const [tab, setTab] = useState('preview');

  const blocks = useMemo(() => parseBlocks(html), [html]);
  const previewHtml = useMemo(() => resolveHtmlMedia(html), [html]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6 space-y-2">
        <h1 className="text-xl font-semibold">آزمایشگاه ادیتور زوپینی</h1>
        <p className="text-sm text-neutral-500">
          همین ادیتور در پنل مدیریت برای مقاله، توضیحات محصول و توضیحات
          دسته‌بندی استفاده می‌شود. این صفحه فقط در محیط توسعه باز است و به
          هیچ API‌ای وصل نیست.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => setHtml(SAMPLE_HTML)}>
            <Sparkles className="size-4" />
            بارگذاری نمونه‌ی کامل
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setHtml('')}>
            <Eraser className="size-4" />
            خالی کردن
          </Button>
        </div>
      </header>

      <ZoppiniEditor
        value={html}
        onChange={setHtml}
        variant="blog"
        minHeight={420}
        placeholder="بنویسید… برای دیدن فهرست درج سریع، «/» تایپ کنید"
      />

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="w-fit">
          <TabsTrigger value="preview">
            <Eye className="size-4" />
            پیش‌نمایش سایت
          </TabsTrigger>
          <TabsTrigger value="blocks">
            <LayoutList className="size-4" />
            بلوک‌ها ({blocks.length})
          </TabsTrigger>
          <TabsTrigger value="html">
            <FileCode2 className="size-4" />
            HTML ذخیره‌شده
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4">
          <div className="rounded-md border bg-white p-6">
            <p className="mb-4 text-xs text-neutral-400">
              متن و رسانه‌ها دقیقاً مثل سایت رندر می‌شوند. بلوک‌های ویژه در
              سایت با کامپوننت‌های اختصاصی خودشان (اسلایدر محصولات، گالری،
              سوالات متداول و فهرست مطالب) نمایش داده می‌شوند، نه با این
              div‌ها.
            </p>
            <div
              className="zp-prose max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </TabsContent>

        <TabsContent value="blocks" className="mt-4 space-y-2">
          {!hasEditorBlocks(html) && (
            <p className="text-sm text-neutral-500">
              هنوز بلوک ویژه‌ای در متن نیست. با تایپ «/» یا دکمه‌ی «افزودن» در
              نوار ابزار، اسلایدر محصولات، گالری، سوالات متداول یا فهرست مطالب
              اضافه کنید.
            </p>
          )}

          {blocks.map((block, index) => (
            <div
              key={`${block.kind}-${index}`}
              className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm"
            >
              <span className="font-medium">
                {BLOCK_LABELS[block.kind as keyof typeof BLOCK_LABELS] ??
                  block.kind}
              </span>
              <span className="text-xs text-neutral-500">
                {block.title ? `${block.title} · ` : ''}
                {block.items > 0 ? `${block.items} آیتم` : 'بدون آیتم'}
              </span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="html" className="mt-4">
          <p className="mb-2 text-xs text-neutral-500">
            همین یک رشته در ستون <code dir="ltr">content</code> ذخیره می‌شود و
            بک‌اند از روی <code dir="ltr">{BLOCK_KIND_ATTRIBUTE}</code> بلوک‌ها
            را برای نمایش سایت می‌سازد.
          </p>
          <textarea
            readOnly
            dir="ltr"
            spellCheck={false}
            rows={18}
            value={html}
            className="w-full rounded-md border bg-neutral-50 p-3 font-mono text-xs leading-6"
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
