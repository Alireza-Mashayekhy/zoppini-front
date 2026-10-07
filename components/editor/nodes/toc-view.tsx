'use client';

import type { ReactNodeViewProps } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { ListTree } from 'lucide-react';
import { useMemo } from 'react';

import { normalizeBlockConfig } from '../lib/block-html';
import { TocBlockConfig } from '../lib/types';
import { BlockTitleInput } from '../ui/block-frame';
import BlockViewShell from '../ui/block-view-shell';

/** حداکثر عمق تیترهایی که در فهرست مطالب می‌آیند (هم‌راستا با سایت) */
const TOC_MAX_LEVEL = 4;

/**
 * بلوک فهرست مطالب.
 *
 * فهرست از تیترهای خود مقاله ساخته می‌شود؛ ادمین فقط جای نمایش و عنوان
 * آن را تعیین می‌کند. برای اطمینان از درست کار کردن، پیش‌نمایش زنده‌ی
 * تیترها هم داخل بلوک نشان داده می‌شود.
 */
export default function TocNodeView(view: ReactNodeViewProps) {
  const config = normalizeBlockConfig('toc', view.node.attrs.config);

  const update = (patch: Partial<TocBlockConfig>) =>
    view.updateAttributes({ config: { ...config, ...patch } });

  /** تیترهای فعلی سند (H2 تا H4) — با هر تغییر متن به‌روز می‌شود */
  const headings = useEditorState({
    editor: view.editor,
    selector: ({ editor }) => {
      if (!editor) return [];

      const found: { level: number; text: string }[] = [];

      editor.state.doc.descendants(node => {
        if (node.type.name !== 'heading') return;

        const level = Number(node.attrs.level);
        const text = node.textContent.trim();

        if (level >= 2 && level <= TOC_MAX_LEVEL && text) {
          found.push({ level, text });
        }
      });

      return found;
    },
  });

  const preview = useMemo(() => headings ?? [], [headings]);

  return (
    <BlockViewShell
      kind="toc"
      view={view}
      icon={<ListTree className="size-3.5" />}
      header={
        <BlockTitleInput
          value={config.title ?? ''}
          onChange={title => update({ title })}
          placeholder="عنوان فهرست (مثلاً فهرست مطالب)"
        />
      }
    >
      <p className="mb-3 rounded bg-blue-50 p-2.5 text-[11px] leading-5 text-blue-700">
        فهرست مطالب به‌صورت خودکار از تیترهای H2 تا H4 همین مقاله ساخته
        می‌شود؛ فقط جای نمایشش را در متن مشخص کنید.
      </p>

      {preview.length === 0 ? (
        <p className="rounded border border-dashed border-neutral-300 p-3 text-center text-[11px] text-neutral-500">
          هنوز تیتری (H2 تا H4) در مقاله نیست.
        </p>
      ) : (
        <ol className="space-y-1">
          {preview.map((heading, index) => (
            <li
              key={`${heading.text}-${index}`}
              className="truncate text-[11px] text-neutral-600"
              style={{ paddingInlineStart: (heading.level - 2) * 14 }}
            >
              <span className="text-neutral-400">H{heading.level}</span>{' '}
              {heading.text}
            </li>
          ))}
        </ol>
      )}
    </BlockViewShell>
  );
}
