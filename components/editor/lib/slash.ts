import type { Editor } from '@tiptap/core';

/**
 * تشخیص «/» برای باز شدن منوی اسلش.
 *
 * فقط وقتی منو باز می‌شود که نشانگر داخل یک بند متنی باشد و «/» در
 * ابتدای بند یا بعد از یک فاصله تایپ شده باشد (تا آدرس‌هایی مثل
 * example.com/path منو را باز نکنند).
 */

export interface SlashQuery {
  /** عبارت تایپ‌شده بعد از «/» */
  query: string;
  /** موقعیت خود «/» در سند */
  from: number;
  /** موقعیت نشانگر */
  to: number;
}

export function getSlashQuery(editor: Editor): SlashQuery | null {
  const { selection } = editor.state;

  if (!selection.empty) return null;

  const { $from } = selection;

  if (!$from.parent.isTextblock) return null;

  const textBefore = $from.parent.textBetween(
    Math.max(0, $from.parentOffset - 40),
    $from.parentOffset,
    undefined,
    '\ufffc',
  );

  const match = /(?:^|\s)\/([^\s]*)$/u.exec(textBefore);

  if (!match) return null;

  const query = match[1] ?? '';

  // عبارت خیلی طولانی یعنی کاربر دارد آدرس می‌نویسد، نه منو
  if (query.length > 24) return null;

  return {
    query,
    from: $from.pos - query.length - 1,
    to: $from.pos,
  };
}
