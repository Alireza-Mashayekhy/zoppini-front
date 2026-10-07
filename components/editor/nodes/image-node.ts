import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { toStoredPath } from '@/lib/media';

import {
  MEDIA_ALIGNMENTS,
  readMediaAlign,
  readMediaElement,
  readMediaWidth,
} from '../lib/media-attrs';
import ImageNodeView from './image-view';

/**
 * نود تصویر مقاله.
 *
 * خروجی HTML همان الگوی آشناست:
 *   <figure class="zp-figure" data-zp-image style="width:75%">
 *     <a href="…"><img src="…" alt="…"></a>
 *     <figcaption>…</figcaption>
 *   </figure>
 *
 * نکته‌ی مهم: در متن همیشه «مسیر نسبی» فایل ذخیره می‌شود (مثل
 * `images/x.webp`) تا با تغییر دامنه چیزی خراب نشود؛ نمایش در پنل و سایت
 * با `mediaUrl()` کامل می‌شود.
 */
export const EditorImage = Node.create({
  name: 'zpImage',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: element =>
          toStoredPath(readMediaElement(element, 'img')?.getAttribute('src') ?? ''),
        renderHTML: attributes => (attributes.src ? { src: attributes.src } : {}),
      },
      alt: {
        default: '',
        parseHTML: element => readMediaElement(element, 'img')?.getAttribute('alt') ?? '',
        renderHTML: attributes => (attributes.alt ? { alt: attributes.alt } : {}),
      },
      title: {
        default: '',
        parseHTML: element =>
          readMediaElement(element, 'img')?.getAttribute('title') ?? '',
        renderHTML: attributes => (attributes.title ? { title: attributes.title } : {}),
      },
      caption: {
        default: '',
        parseHTML: element =>
          element.querySelector('figcaption')?.textContent?.trim() ?? '',
      },
      /** عرض نمایشی به درصد (null یعنی تمام عرض) */
      width: {
        default: null,
        parseHTML: element => readMediaWidth(element),
      },
      align: {
        default: 'center',
        parseHTML: element => readMediaAlign(element),
      },
      href: {
        default: '',
        parseHTML: element => element.querySelector('a')?.getAttribute('href') ?? '',
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'figure[data-zp-image]', priority: 100 },
      { tag: 'figure:has(> img)', priority: 60 },
      { tag: 'img[src]', priority: 50 },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, title, caption, width, align, href } = HTMLAttributes;

    if (!src) return ['p'];

    const imageAttributes: Record<string, string> = { src, loading: 'lazy' };

    if (alt) imageAttributes.alt = alt;
    if (title) imageAttributes.title = title;

    const media = href
      ? [
          'a',
          { href, target: '_blank', rel: 'noopener noreferrer nofollow' },
          ['img', imageAttributes],
        ]
      : ['img', imageAttributes];

    const figureAttributes: Record<string, string> = {
      'data-zp-image': '',
      class: `zp-figure zp-figure--image is-align-${
        MEDIA_ALIGNMENTS.includes(align) ? align : 'center'
      }`,
    };

    if (width) figureAttributes.style = `width:${width}%`;

    return [
      'figure',
      figureAttributes,
      media,
      caption ? ['figcaption', {}, caption] : 0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
