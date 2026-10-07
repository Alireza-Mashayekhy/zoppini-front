import type { Editor } from '@tiptap/core';
import type { Node as ProsemirrorNode } from '@tiptap/pm/model';

/**
 * کارهای مشترک نودهای بلوکی (جابه‌جایی، کپی، حذف).
 *
 * همه‌ی بلوک‌های ویژه‌ی ادیتور (اسلایدر، گالری، FAQ، فهرست، عکس و فیلم)
 * از همین توابع استفاده می‌کنند تا رفتار یکدستی داشته باشند.
 */

/** موقعیت فعلی نود؛ اگر نود از سند خارج شده باشد undefined است */
function safePos(getPos: () => number | undefined): number | null {
  const pos = getPos();
  return typeof pos === 'number' ? pos : null;
}

/**
 * جابه‌جایی یک نود به بالا یا پایین.
 *
 * به‌جای محاسبه‌ی موقعیت‌های نسبی (که با حذف نود جابه‌جا می‌شوند)، کل
 * فرزندان والد با ترتیب جدید جایگزین می‌شوند؛ ساده و بی‌خطا.
 */
export function moveNodeVertically(
  editor: Editor,
  getPos: () => number | undefined,
  direction: -1 | 1,
): boolean {
  const pos = safePos(getPos);
  if (pos === null) return false;

  const { doc } = editor.state;
  const $pos = doc.resolve(pos);
  const depth = $pos.depth;
  const parent = $pos.node(depth);
  const index = $pos.index(depth);
  const target = index + direction;

  if (target < 0 || target >= parent.childCount) return false;

  const children: ProsemirrorNode[] = [];
  parent.forEach(child => children.push(child));

  const [moved] = children.splice(index, 1);
  children.splice(target, 0, moved);

  const from = depth === 0 ? 0 : $pos.start(depth);
  const to = depth === 0 ? doc.content.size : $pos.end(depth);

  editor.chain().focus().insertContentAt({ from, to }, children).run();

  return true;
}

/** آیا نود امکان جابه‌جایی در این جهت را دارد؟ */
export function canMoveNode(
  editor: Editor,
  getPos: () => number | undefined,
  direction: -1 | 1,
): boolean {
  const pos = safePos(getPos);
  if (pos === null) return false;

  const $pos = editor.state.doc.resolve(pos);
  const depth = $pos.depth;
  const parent = $pos.node(depth);
  const index = $pos.index(depth);
  const target = index + direction;

  return target >= 0 && target < parent.childCount;
}

/** کپی گرفتن از یک نود بلافاصله بعد از خودش */
export function duplicateNode(
  editor: Editor,
  getPos: () => number | undefined,
): void {
  const pos = safePos(getPos);
  if (pos === null) return;

  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;

  editor
    .chain()
    .focus()
    .insertContentAt(pos + node.nodeSize, node.toJSON())
    .run();
}

/** انتخاب یک نود (برای کلیک روی تصویر/بلوک) */
export function selectNode(
  editor: Editor,
  getPos: () => number | undefined,
): void {
  const pos = safePos(getPos);
  if (pos === null) return;

  editor.chain().focus().setNodeSelection(pos).run();
}

/** درج یک پاراگراف خالی بعد از نود تا نوشتن ادامه‌ی متن ممکن بماند */
export function ensureParagraphAfter(
  editor: Editor,
  pos: number,
  nodeSize: number,
): void {
  const after = editor.state.doc.nodeAt(pos + nodeSize);

  if (after?.isTextblock) return;

  editor
    .chain()
    .insertContentAt(pos + nodeSize, { type: 'paragraph' })
    .setTextSelection(pos + nodeSize + 1)
    .run();
}
