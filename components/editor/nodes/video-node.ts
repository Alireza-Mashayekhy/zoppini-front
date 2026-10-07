import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { toStoredPath } from '@/lib/media';

import {
  MEDIA_ALIGNMENTS,
  readMediaAlign,
  readMediaElement,
  readMediaWidth,
} from '../lib/media-attrs';
import VideoNodeView from './video-view';

/**
 * نود ویدیوی مقاله.
 *
 * خروجی HTML:
 *   <figure class="zp-figure" data-zp-video>
 *     <video src="videos/x.mp4" poster="images/p.webp" controls preload="metadata"></video>
 *     <figcaption>…</figcaption>
 *   </figure>
 *
 * مثل تصویر، مسیر فایل نسبی ذخیره می‌شود تا وابسته به دامنه نباشد.
 */
export const EditorVideo = Node.create({
  name: 'zpVideo',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    const readVideo = (element: HTMLElement) => readMediaElement(element, 'video');

    return {
      src: {
        default: '',
        parseHTML: element => toStoredPath(readVideo(element)?.getAttribute('src') ?? ''),
        renderHTML: attributes => (attributes.src ? { src: attributes.src } : {}),
      },
      poster: {
        default: '',
        parseHTML: element =>
          toStoredPath(readVideo(element)?.getAttribute('poster') ?? ''),
        renderHTML: attributes =>
          attributes.poster ? { poster: attributes.poster } : {},
      },
      caption: {
        default: '',
        parseHTML: element =>
          element.querySelector('figcaption')?.textContent?.trim() ?? '',
      },
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
      autoplay: {
        default: false,
        parseHTML: element => readVideo(element)?.hasAttribute('autoplay') ?? false,
        renderHTML: attributes => (attributes.autoplay ? { autoplay: '' } : {}),
      },
      loop: {
        default: false,
        parseHTML: element => readVideo(element)?.hasAttribute('loop') ?? false,
        renderHTML: attributes => (attributes.loop ? { loop: '' } : {}),
      },
      muted: {
        default: true,
        parseHTML: element => readVideo(element)?.hasAttribute('muted') ?? true,
        renderHTML: attributes => (attributes.muted === false ? {} : { muted: '' }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'figure[data-zp-video]', priority: 100 },
      { tag: 'figure:has(> video)', priority: 60 },
      { tag: 'video[src]', priority: 50 },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, poster, caption, width, align, href, autoplay, loop, muted } =
      HTMLAttributes;

    if (!src) return ['p'];

    const videoAttributes: Record<string, string> = {
      src,
      controls: '',
      preload: 'metadata',
      playsinline: '',
    };

    if (poster) videoAttributes.poster = poster;
    if (autoplay) videoAttributes.autoplay = '';
    if (loop) videoAttributes.loop = '';
    if (muted !== false) videoAttributes.muted = '';

    const video = ['video', videoAttributes];

    const media = href
      ? [
          'a',
          { href, target: '_blank', rel: 'noopener noreferrer nofollow' },
          video,
        ]
      : video;

    const figureAttributes: Record<string, string> = {
      'data-zp-video': '',
      class: `zp-figure zp-figure--video is-align-${
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
    return ReactNodeViewRenderer(VideoNodeView);
  },
});
