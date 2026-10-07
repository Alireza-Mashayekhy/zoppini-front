import type { Editor } from '@tiptap/core';

import { BLOCK_NODE_NAMES } from './block-html';
import {
  BlockConfig,
  DEFAULT_BLOCK_CONFIG,
  EditorBlockKind,
  MediaBlockItem,
} from './types';

/**
 * درج بلوک‌ها در متن.
 *
 * همه‌ی بلوک‌های اتمی (تصویر، ویدیو، اسلایدر، گالری، FAQ و فهرست) از
 * یک مسیر درج می‌شوند: اگر نشانگر داخل یک بند خالی باشد، همان بند با
 * بلوک جایگزین می‌شود و بعد از بلوک همیشه یک بند تازه ساخته می‌شود تا
 * نوشتن ادامه‌ی متن ممکن بماند.
 */

/** یک نود اتمی را جای نشانگر درج می‌کند */
export function insertAtomNode(
  editor: Editor,
  type: string,
  attrs: Record<string, unknown> = {},
): void {
  const { state } = editor;
  const { $from, empty } = state.selection;

  const isEmptyTextBlock =
    empty && $from.parent.isTextblock && $from.parent.content.size === 0;

  const chain = editor.chain().focus();

  // جایگزینی بند خالی به‌جای افزودن بلوک کنار آن
  if (isEmptyTextBlock && $from.depth > 0) {
    chain.deleteRange({
      from: $from.before($from.depth),
      to: $from.after($from.depth),
    });
  }

  chain
    .insertContent([{ type, attrs }, { type: 'paragraph' }])
    .run();
}

/** درج یکی از بلوک‌های ویژه‌ی مقاله */
export function insertEditorBlock(
  editor: Editor,
  kind: EditorBlockKind,
  config?: Partial<BlockConfig>,
): void {
  insertAtomNode(editor, BLOCK_NODE_NAMES[kind], {
    config: config ?? DEFAULT_BLOCK_CONFIG[kind](),
  });
}

/** درج تصویر */
export function insertImageNode(editor: Editor, src: string): void {
  insertAtomNode(editor, 'zpImage', { src });
}

/** درج ویدیو */
export function insertVideoNode(editor: Editor, src: string): void {
  insertAtomNode(editor, 'zpVideo', { src });
}

/** درج چند رسانه پشت سر هم (از پنجره‌ی درج رسانه) */
export function insertMediaEntries(
  editor: Editor,
  entries: { kind: 'image' | 'video'; src: string }[],
): void {
  entries.forEach(entry => {
    if (entry.kind === 'video') insertVideoNode(editor, entry.src);
    else insertImageNode(editor, entry.src);
  });
}

/** درج گالری (یک بلوک مدیا با چند فایل) */
export function insertGalleryBlock(
  editor: Editor,
  entries: { kind: 'image' | 'video'; src: string }[],
): void {
  const items: MediaBlockItem[] = entries.map(entry => ({
    mediaType: entry.kind,
    url: entry.src,
    caption: '',
  }));

  insertEditorBlock(editor, 'media', { items });
}
