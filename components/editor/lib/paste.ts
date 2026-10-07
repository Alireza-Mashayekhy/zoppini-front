/**
 * تمیزکاری HTML پیست‌شده.
 *
 * وقتی متن از Word، Google Docs یا یک سایت دیگر کپی می‌شود، همراهش کلی
 * استایل داخلی، کلاس و تگ بی‌فایده می‌آید. اینجا پیش از ورود به ادیتور
 * پاک می‌شود تا خروجی ذخیره‌شده تمیز و سبک بماند (رفتاری مشابه «پیست
 * تمیز» در وردپرس).
 */

/** صفت‌هایی که نگه داشته می‌شوند */
const KEPT_ATTRIBUTES = [
  'href',
  'src',
  'alt',
  'title',
  'target',
  'rel',
  'colspan',
  'rowspan',
];

/**
 * استایل‌های مجاز.
 *
 * فقط قالب‌بندی‌هایی نگه داشته می‌شوند که خود ادیتور هم می‌شناسد (چینش،
 * اندازه فونت، رنگ و…) تا کپی‌کردن از سایت خودمان یا وردپرس قالبش را
 * از دست ندهد.
 */
const STYLE_WHITELIST = [
  'text-align',
  'direction',
  'font-size',
  'font-weight',
  'font-style',
  'font-family',
  'line-height',
  'letter-spacing',
  'text-decoration',
  'text-decoration-line',
  'text-transform',
  'color',
  'background-color',
  'vertical-align',
  'width',
  'max-width',
];

/** تگ‌هایی که کامل (با محتوا) حذف می‌شوند */
const STRIPPED_TAGS = [
  'script',
  'style',
  'meta',
  'link',
  'title',
  'head',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'svg',
  'canvas',
  'xml',
];

function stripTags(root: HTMLElement) {
  STRIPPED_TAGS.forEach(tag => {
    root.querySelectorAll(tag).forEach(element => element.remove());
  });

  // کامنت‌ها (از جمله کامنت‌های شرطی Word)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
  const comments: Comment[] = [];

  while (walker.nextNode()) comments.push(walker.currentNode as Comment);

  comments.forEach(comment => comment.remove());
}

/** استایل مجاز یک عنصر را نگه می‌دارد و بقیه‌اش را دور می‌ریزد */
function sanitizeStyle(element: HTMLElement): string {
  const declarations: string[] = [];

  STYLE_WHITELIST.forEach(property => {
    const value = element.style.getPropertyValue(property).trim();
    if (value) declarations.push(`${property}: ${value}`);
  });

  return declarations.join('; ');
}

function cleanAttributes(root: HTMLElement) {
  const elements = [
    root,
    ...Array.from(root.querySelectorAll<HTMLElement>('*')),
  ];

  elements.forEach(element => {
    if (!element.isConnected && element !== root) return;

    const style = element.getAttribute('style')
      ? sanitizeStyle(element)
      : '';

    Array.from(element.attributes).forEach(attribute => {
      const name = attribute.name.toLowerCase();

      if (KEPT_ATTRIBUTES.includes(name)) return;
      if (name.startsWith('data-zp-')) return;

      element.removeAttribute(attribute.name);
    });

    if (style) element.setAttribute('style', style);

    // لینک‌هایی که به فایل محلی یا جای نامعتبر اشاره می‌کنند باز می‌شوند
    if (element.tagName === 'A') {
      const href = element.getAttribute('href') ?? '';

      if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) {
        element.replaceWith(...Array.from(element.childNodes));
      }
    }
  });
}

/** حذف عناصر خالی بی‌فایده (مثل `<o:p></o:p>` یا `<span></span>`) */
function removeEmptyElements(root: HTMLElement) {
  const keepTags = ['IMG', 'VIDEO', 'BR', 'HR', 'TD', 'TH', 'TABLE'];

  let removed = true;
  let guard = 0;

  while (removed && guard < 6) {
    removed = false;
    guard += 1;

    Array.from(root.querySelectorAll<HTMLElement>('*')).forEach(element => {
      if (keepTags.includes(element.tagName)) return;
      if (element.dataset.zpBlock) return;
      if (element.textContent?.trim()) return;
      if (element.querySelector('img,video,br,hr,table')) return;

      element.remove();
      removed = true;
    });
  }
}

/** پاک‌سازی HTML پیست‌شده؛ خارج از مرورگر همان ورودی برگردانده می‌شود */
export function cleanPastedHtml(html: string): string {
  if (typeof document === 'undefined' || !html) return html;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  stripTags(wrapper);
  cleanAttributes(wrapper);
  removeEmptyElements(wrapper);

  return wrapper.innerHTML;
}

/** تبدیل متن ساده به پاراگراف‌های HTML (پیست متن بدون هیچ قالبی) */
export function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}
