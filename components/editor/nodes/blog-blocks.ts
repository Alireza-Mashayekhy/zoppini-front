import { mergeAttributes, Node } from '@tiptap/core';
import type { ReactNodeViewProps } from '@tiptap/react';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { ComponentType } from 'react';

import {
  BLOCK_CLASS_NAME,
  BLOCK_CONFIG_ATTRIBUTE,
  BLOCK_KIND_ATTRIBUTE,
  BLOCK_NODE_NAMES,
  decodeBlockConfig,
  encodeBlockConfig,
} from '../lib/block-html';
import { EditorBlockKind } from '../lib/types';
import FaqNodeView from './faq-view';
import MediaNodeView from './media-view';
import SliderNodeView from './slider-view';
import TocNodeView from './toc-view';

/**
 * نودهای بلوک‌های ویژه‌ی مقاله (اسلایدر، گالری، FAQ و فهرست مطالب).
 *
 * هر چهار نود یک ساختار مشترک دارند: یک `<div>` با صفت نوع بلوک و یک
 * صفت JSON که پیکربندی کامل بلوک در آن است. به همین دلیل یک کارخانه
 * (factory) هر چهار نود را می‌سازد و فقط نمای هرکدام متفاوت است.
 */

interface BlogBlockDefinition {
  kind: EditorBlockKind;
  name: string;
  component: ComponentType<ReactNodeViewProps>;
}

function createBlogBlockNode({ kind, name, component }: BlogBlockDefinition) {
  return Node.create({
    name,
    group: 'block',
    /** بلوک یکپارچه است: نشانگر متن وارد آن نمی‌شود و با NodeSelection انتخاب می‌شود */
    atom: true,
    draggable: true,
    selectable: true,
    isolating: true,

    addAttributes() {
      return {
        config: {
          default: null,
          parseHTML: element =>
            decodeBlockConfig(element.getAttribute(BLOCK_CONFIG_ATTRIBUTE)),
          renderHTML: attributes => ({
            [BLOCK_CONFIG_ATTRIBUTE]: encodeBlockConfig(attributes.config ?? {}),
          }),
        },
      };
    },

    parseHTML() {
      return [{ tag: `div[${BLOCK_KIND_ATTRIBUTE}="${kind}"]` }];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'div',
        mergeAttributes(
          { class: BLOCK_CLASS_NAME, [BLOCK_KIND_ATTRIBUTE]: kind },
          HTMLAttributes,
        ),
      ];
    },

    addNodeView() {
      return ReactNodeViewRenderer(component);
    },
  });
}

/** اسلایدر محصولات */
export const ZpSlider = createBlogBlockNode({
  kind: 'slider',
  name: BLOCK_NODE_NAMES.slider,
  component: SliderNodeView,
});

/** گالری عکس و فیلم */
export const ZpMedia = createBlogBlockNode({
  kind: 'media',
  name: BLOCK_NODE_NAMES.media,
  component: MediaNodeView,
});

/** سوالات متداول */
export const ZpFaq = createBlogBlockNode({
  kind: 'faq',
  name: BLOCK_NODE_NAMES.faq,
  component: FaqNodeView,
});

/** فهرست مطالب */
export const ZpToc = createBlogBlockNode({
  kind: 'toc',
  name: BLOCK_NODE_NAMES.toc,
  component: TocNodeView,
});

/** همه‌ی بلوک‌های ویژه (برای اضافه شدن به لیست افزونه‌ها) */
export const blogBlockNodes = [ZpSlider, ZpMedia, ZpFaq, ZpToc];
