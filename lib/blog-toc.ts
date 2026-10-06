/**
 * ساخت فهرست مطالب (TOC) از HTML مقاله.
 *
 * ادیتور متن به تیترها به‌صورت خودکار id می‌دهد، ولی محتوای قدیمی یا
 * پیست‌شده ممکن است بدون id باشد؛ پس اینجا هم idها تضمین و هم لیست
 * فهرست استخراج می‌شود.
 */

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

const HEADING_REGEX = /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi;

/** حداکثر عمقی که در فهرست نمایش داده می‌شود */
export const TOC_MAX_LEVEL = 4;

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCharCode(Number(code)),
    );
}

/** متن خالص یک تیتر (بدون تگ‌های داخلی) */
export function headingText(innerHtml: string): string {
  return decodeEntities(innerHtml.replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

/** ساخت id امن از متن فارسی/انگلیسی تیتر */
export function headingId(text: string, index: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[\s\u200c]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  const base = slug || `heading-${index + 1}`;

  return `h-${base}`.slice(0, 80);
}

function uniqueId(candidate: string, used: Set<string>): string {
  let id = candidate;
  let counter = 2;

  while (used.has(id)) {
    id = `${candidate}-${counter}`;
    counter += 1;
  }

  used.add(id);

  return id;
}

export interface PreparedContent {
  /** HTML با id تضمین‌شده برای همه تیترها */
  html: string;
  /** تیترهایی که در فهرست مطالب نمایش داده می‌شوند */
  headings: TocHeading[];
}

/**
 * آماده‌سازی محتوای مقاله: id تیترها + استخراج فهرست.
 *
 * ترتیب برگشتی headings همان ترتیب ظاهر شدن در متن است.
 */
export function prepareContent(html: string, maxLevel = TOC_MAX_LEVEL): PreparedContent {
  if (!html) return { html: '', headings: [] };

  const headings: TocHeading[] = [];
  const used = new Set<string>();
  let index = 0;

  const preparedHtml = html.replace(
    HEADING_REGEX,
    (match, levelRaw: string, attrs: string, inner: string) => {
      const level = Number(levelRaw);
      const text = headingText(inner);

      const existingId = /id\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];

      const id = uniqueId(existingId || headingId(text, index), used);

      index += 1;

      if (!text) return match;

      if (level <= maxLevel) {
        headings.push({ id, text, level });
      }

      // اگر id از قبل وجود دارد، همان تگ دست‌نخورده می‌ماند
      if (existingId === id) return match;

      const attributesWithoutId = attrs.replace(
        /\s*id\s*=\s*["'][^"']*["']/i,
        '',
      );

      return `<h${level} id="${id}"${attributesWithoutId}>${inner}</h${level}>`;
    },
  );

  return { html: preparedHtml, headings };
}
