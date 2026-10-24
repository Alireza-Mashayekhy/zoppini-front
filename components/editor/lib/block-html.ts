import {
  BlogBlock,
  BlogBlockItem,
} from '@/services/features/blog/types';

import {
  BlockConfig,
  EditorBlockKind,
  FaqBlockConfig,
  MediaBlockConfig,
  SliderBlockConfig,
  TocBlockConfig,
} from './types';

/**
 * قرارداد HTML بلوک‌های ویژه‌ی مقاله.
 *
 * هر بلوک یک `<div>` خالی با دو صفت است:
 *   <div class="zp-block" data-zp-block="slider" data-zp-config="{...}"></div>
 *
 * چرا JSON در یک صفت؟
 *  ۱) بدون هیچ اطلاعات اضافی، دقیقاً همان چیزی است که ادیتور می‌سازد و
 *     دوباره می‌خواند (رفت و برگشت بدون از دست رفتن داده).
 *  ۲) بک‌اند می‌تواند با یک عبارت باقاعده‌ی ساده همان ساختار بلوک‌های قبلی را از متن
 *     بیرون بکشد؛ پس API عمومی و کامپوننت‌های نمایش سایت دست‌نخورده می‌مانند.
 *
 * نکته: این فایل «تنها مرجع» قرارداد است و نسخه‌ی بک‌اند
 * (back/src/blog/utils/blog-content.util.ts) باید با آن هم‌خوان بماند.
 */

export const BLOCK_CLASS_NAME = 'zp-block';
export const BLOCK_KIND_ATTRIBUTE = 'data-zp-block';
export const BLOCK_CONFIG_ATTRIBUTE = 'data-zp-config';

/** نام نود تیپ‌تپ برای هر بلوک */
export const BLOCK_NODE_NAMES: Record<EditorBlockKind, string> = {
  slider: 'zpSlider',
  media: 'zpMedia',
  faq: 'zpFaq',
  toc: 'zpToc',
};

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** فرار کاراکترهای خطرناک برای قرار گرفتن داخل یک صفت HTML */
export function escapeAttribute(value: string): string {
  return value.replace(/[&<>"']/g, character => ESCAPES[character]);
}

/** برگرداندن entityهای HTML به کاراکتر اصلی (برای خواندن JSON از صفت) */
export function unescapeAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * JSON پیکربندی بلوک، آماده‌ی گذاشتن در «صفت یک عنصر DOM».
 *
 * چرا اینجا فرار (escape) نمی‌کنیم؟
 * خروجی `renderHTML` نود به‌صورت صفت یک عنصر واقعی تنظیم می‌شود و خود
 * مرورگر هنگام ساختن HTML مقاله، `"` و `&` را فرار می‌کند. اگر ما از قبل
 * فرار کنیم، مقدار «دو بار» فرار می‌شود (`&amp;quot;`) و بک‌اند دیگر
 * نمی‌تواند JSON را بخواند؛ در نتیجه بلوک (اسلایدر/گالری/FAQ) در صفحه‌ی
 * مقاله نمایش داده نمی‌شود، هرچند داخل ادیتور درست به نظر می‌رسد.
 *
 * تنها `<` و `>` باید خودشان عوض شوند: مرورگر این دو را داخل مقدار صفت
 * فرار نمی‌کند و `>` خام هم قالب HTML را به هم می‌ریزد و هم الگوی تشخیص
 * بلوک در بک‌اند را. `\u003c` و `\u003e` در JSON دقیقاً همان کاراکترها
 * هستند، پس معنی داده عوض نمی‌شود.
 */
export function stringifyBlockConfig(config: unknown): string {
  return JSON.stringify(config ?? {})
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}

/**
 * تبدیل پیکربندی بلوک به مقدار آماده‌ی نوشتن در صفت.
 *
 * فقط وقتی استفاده می‌شود که «خودمان» رشته‌ی HTML می‌سازیم و مرورگری در
 * کار نیست (مثل `renderBlockHtml` برای مهاجرت مقاله‌های قدیمی)؛ برای صفت
 * یک نود تیپ‌تپ از `stringifyBlockConfig` استفاده کنید.
 */
export function encodeBlockConfig(config: unknown): string {
  return escapeAttribute(stringifyBlockConfig(config));
}

/** تجزیه‌ی JSON؛ در صورت نامعتبر بودن null */
function parseConfigJson(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * خواندن پیکربندی بلوک از صفت HTML.
 *
 * مرورگر هنگام خواندن صفت، entityها را یک‌بار برمی‌گرداند؛ اما مقاله‌هایی
 * که با نسخه‌های قبلی (فرار دستی) ذخیره شده‌اند یک لایه‌ی اضافه دارند
 * (`&quot;`). پس اول همان مقدار و در صورت نیاز نسخه‌ی باز‌شده آزمایش
 * می‌شود تا هر دو نسل محتوا درست خوانده شوند.
 */
export function decodeBlockConfig(
  raw: string | null | undefined,
): Record<string, unknown> | null {
  if (!raw) return null;

  const candidates = [raw, unescapeAttribute(raw)];

  for (const candidate of candidates) {
    const parsed = parseConfigJson(candidate);
    if (parsed) return parsed;
  }

  return null;
}

/**
 * گزینه‌های خواندن پیکربندی یک بلوک.
 *
 * `editing: true` یعنی این پیکربندی برای «ویرایش درجا» داخل ادیتور خوانده
 * می‌شود، نه برای خروجی نهایی:
 *  - آیتم خالیِ تازه‌اضافه‌شده نگه داشته می‌شود؛ وگرنه دکمه‌ی «افزودن
 *    سوال» یک ردیف خالی می‌سازد که همان لحظه فیلتر می‌شود و هیچ اتفاقی
 *    نمی‌افتد.
 *  - متن‌ها trim نمی‌شوند؛ وگرنه تایپ فاصله بین کلمه‌ها ممکن نیست (با هر
 *    بار به‌روزرسانی، فاصله‌ی آخر حذف می‌شود).
 *
 * داده‌ی ذخیره‌شده همچنان در بک‌اند تمیز می‌شود (trim و حذف آیتم‌های خالی).
 */
export interface BlockConfigOptions {
  editing?: boolean;
}

/** سقف طول عنوان بخش (هم‌تراز با BLOCK_LIMITS.maxTitleLength در بک‌اند) */
const MAX_TITLE_LENGTH = 150;

/** پیکربندی امن یک بلوک (با مقادیر پیش‌فرض) */
export function normalizeBlockConfig<K extends EditorBlockKind>(
  kind: K,
  config: unknown,
  options?: BlockConfigOptions,
): K extends 'slider'
  ? SliderBlockConfig
  : K extends 'media'
    ? MediaBlockConfig
    : K extends 'faq'
      ? FaqBlockConfig
      : TocBlockConfig;
export function normalizeBlockConfig(
  kind: EditorBlockKind,
  config: unknown,
  options?: BlockConfigOptions,
): BlockConfig {
  const raw = (config ?? {}) as Record<string, unknown>;
  const editing = options?.editing === true;

  const title = asTitle(raw.title, editing);

  if (kind === 'slider') {
    const items = Array.isArray(raw.items) ? raw.items : [];

    return {
      title,
      autoplay: raw.autoplay !== false,
      items: items
        .map(item => normalizeSliderItem(item, editing))
        .filter((item): item is SliderBlockConfig['items'][number] => !!item),
    };
  }

  if (kind === 'media') {
    const items = Array.isArray(raw.items) ? raw.items : [];

    return {
      title,
      layout: raw.layout === 'grid' ? 'grid' : 'auto',
      items: items
        .map(item => normalizeMediaItem(item, editing))
        .filter((item): item is MediaBlockConfig['items'][number] => !!item),
    };
  }

  if (kind === 'faq') {
    const items = Array.isArray(raw.items) ? raw.items : [];

    return {
      title,
      items: items
        .map(item => normalizeFaqItem(item, editing))
        .filter((item): item is FaqBlockConfig['items'][number] => !!item),
    };
  }

  return { title };
}

/**
 * متن یک فیلد.
 *
 * در حالت ویرایش درجا (`editing`) فقط سقف طول اعمال می‌شود تا آنچه ادمین
 * تایپ می‌کند (از جمله فاصله‌ها) دست‌نخورده بماند؛ در حالت خروجی، متن
 * trim می‌شود و رشته‌ی خالی/سفید `undefined` می‌شود.
 */
function asText(
  value: unknown,
  maxLength = 5000,
  editing = false,
): string | undefined {
  if (typeof value !== 'string') return undefined;

  if (editing) return value.slice(0, maxLength) || undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  return trimmed.slice(0, maxLength);
}

/** عنوان بخش؛ وقتی خالی باشد null است تا عنوان پیش‌فرض استفاده شود */
function asTitle(value: unknown, editing = false): string | null {
  const text = asText(value, MAX_TITLE_LENGTH, editing);
  return text ?? null;
}

function asId(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeSliderItem(
  raw: unknown,
  editing = false,
): SliderBlockConfig['items'][number] | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as Record<string, unknown>;
  const productId = asId(item.productId);

  if (!productId) return null;

  const badge = asText(item.badge, 40, editing);
  const caption = asText(item.caption, 300, editing);

  return {
    productId,
    ...(asId(item.colorId) ? { colorId: asId(item.colorId) } : {}),
    ...(badge ? { badge } : {}),
    ...(caption ? { caption } : {}),
    ...(item.product && typeof item.product === 'object'
      ? { product: item.product as SliderBlockConfig['items'][number]['product'] }
      : {}),
  };
}

function normalizeMediaItem(
  raw: unknown,
  editing = false,
): MediaBlockConfig['items'][number] | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as Record<string, unknown>;
  const url = asText(item.url, 1000, editing);

  if (!url) return null;

  const poster = asText(item.poster, 1000, editing);
  const alt = asText(item.alt, 300, editing);
  const caption = asText(item.caption, 300, editing);
  const linkUrl = asText(item.linkUrl, 1000, editing);
  const linkLabel = asText(item.linkLabel, 80, editing);

  return {
    mediaType: item.mediaType === 'video' ? 'video' : 'image',
    url,
    ...(poster ? { poster } : {}),
    ...(alt ? { alt } : {}),
    ...(caption ? { caption } : {}),
    ...(linkUrl ? { linkUrl } : {}),
    ...(linkLabel ? { linkLabel } : {}),
  };
}

/**
 * یک ردیف سوالات متداول.
 *
 * ردیف کاملاً خالی در حالت ویرایش نگه داشته می‌شود (ادمین هنوز چیزی
 * ننوشته) و در خروجی نهایی حذف می‌شود؛ بک‌اند هم موقع نمایش سایت چنین
 * ردیفی را دور می‌ریزد.
 */
function normalizeFaqItem(
  raw: unknown,
  editing = false,
): FaqBlockConfig['items'][number] | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as Record<string, unknown>;
  const question = asText(item.question, 500, editing) ?? '';
  const answer = asText(item.answer, 5000, editing) ?? '';

  if (!editing && !question && !answer) return null;

  return { question, answer };
}

/** ساخت HTML یک بلوک ویژه (برای درج در متن یا مهاجرت داده‌ی قدیمی) */
export function renderBlockHtml(
  kind: 'slider',
  config: Partial<SliderBlockConfig>,
): string;
export function renderBlockHtml(
  kind: 'media',
  config: Partial<MediaBlockConfig>,
): string;
export function renderBlockHtml(kind: 'faq', config: Partial<FaqBlockConfig>): string;
export function renderBlockHtml(kind: 'toc', config?: Partial<TocBlockConfig>): string;
export function renderBlockHtml(
  kind: EditorBlockKind,
  config: object = {},
): string {
  const encoded = encodeBlockConfig(config);

  return `<div class="${BLOCK_CLASS_NAME}" ${BLOCK_KIND_ATTRIBUTE}="${kind}" ${BLOCK_CONFIG_ATTRIBUTE}="${encoded}"></div>`;
}

/** آیا این HTML بلوک ویژه دارد؟ (تشخیص مقاله‌های نسل جدید از قدیمی) */
export function hasEditorBlocks(html?: string | null): boolean {
  return !!html && html.includes(`${BLOCK_KIND_ATTRIBUTE}=`);
}

/**
 * تبدیل بلوک‌های قدیمی (جدول blog_blocks) به HTML ادیتور.
 *
 * مقاله‌هایی که پیش از این تغییر ساخته شده‌اند، متنشان در چند بلوک جدا و
 * اسلایدر/FAQ/گالری در ردیف‌های دیتابیس است. با این تابع همان مقاله بدون
 * از دست رفتن چیزی داخل ادیتور یکپارچه باز می‌شود و از ذخیره‌ی بعدی به
 * شکل جدید نگه‌داری می‌گردد.
 */
export function legacyBlocksToEditorHtml(
  blocks: BlogBlock[] = [],
  fallbackContent = '',
): string {
  const list = (blocks ?? []).filter(Boolean);

  if (list.length === 0) return fallbackContent || '';

  const ordered = list.some(block => block.type === 'content')
    ? list
    : [...list, { type: 'content', items: [] } as BlogBlock];

  let fallbackUsed = false;

  const parts = ordered.map(block => {
    switch (block.type) {
      case 'content': {
        const html = block.items?.[0]?.html?.trim() ? block.items[0].html : '';

        if (html) return html;

        // متن قدیمی مقاله فقط یک‌بار (در اولین بخش متن) استفاده می‌شود
        if (!fallbackUsed && fallbackContent?.trim()) {
          fallbackUsed = true;
          return fallbackContent;
        }

        return '';
      }

      case 'slider':
        return renderBlockHtml('slider', {
          title: block.title ?? undefined,
          autoplay: block.settings?.autoplay ?? true,
          items: (block.items ?? [])
            .filter(item => item.productId)
            .map(item => ({
              productId: item.productId as number,
              ...(item.colorId ? { colorId: item.colorId } : {}),
              ...(item.badge ? { badge: item.badge } : {}),
              ...(item.caption ? { caption: item.caption } : {}),
              ...(item.product ? { product: item.product } : {}),
            })),
        });

      case 'media':
        return renderBlockHtml('media', {
          title: block.title ?? undefined,
          items: (block.items ?? [])
            .filter(item => item.url)
            .map(item => ({
              mediaType: item.mediaType === 'video' ? 'video' : 'image',
              url: item.url as string,
              ...(item.poster ? { poster: item.poster } : {}),
              ...(item.alt ? { alt: item.alt } : {}),
              ...(item.caption ? { caption: item.caption } : {}),
              ...(item.linkUrl ? { linkUrl: item.linkUrl } : {}),
            })),
        });

      case 'faq':
        return renderBlockHtml('faq', {
          title: block.title ?? undefined,
          items: (block.items ?? [])
            .filter(item => item.question || item.answer)
            .map(item => ({
              question: item.question ?? '',
              answer: item.answer ?? '',
            })),
        });

      case 'toc':
        return renderBlockHtml('toc', { title: block.title ?? undefined });

      default:
        return '';
    }
  });

  return parts.filter(part => part.trim().length > 0).join('\n');
}

/** آیتم‌های یک بلوک به شکل مورد انتظار API (برای سازگاری با کد قدیمی) */
export function blockItemsFromConfig(
  kind: EditorBlockKind,
  config: BlockConfig,
): BlogBlockItem[] {
  if (kind === 'slider') {
    return (config as SliderBlockConfig).items.map(item => ({
      productId: item.productId,
      ...(item.colorId ? { colorId: item.colorId } : {}),
      ...(item.badge ? { badge: item.badge } : {}),
      ...(item.caption ? { caption: item.caption } : {}),
    }));
  }

  if (kind === 'media') {
    return (config as MediaBlockConfig).items.map(item => ({
      mediaType: item.mediaType,
      url: item.url,
      ...(item.poster ? { poster: item.poster } : {}),
      ...(item.alt ? { alt: item.alt } : {}),
      ...(item.caption ? { caption: item.caption } : {}),
      ...(item.linkUrl ? { linkUrl: item.linkUrl } : {}),
    }));
  }

  if (kind === 'faq') {
    return (config as FaqBlockConfig).items.map(item => ({
      question: item.question,
      answer: item.answer,
    }));
  }

  return [];
}
