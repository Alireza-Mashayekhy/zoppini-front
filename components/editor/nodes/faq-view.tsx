'use client';

import type { ReactNodeViewProps } from '@tiptap/react';
import { MessageCircleQuestion, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { normalizeBlockConfig } from '../lib/block-html';
import { FaqBlockConfig, FaqBlockItem } from '../lib/types';
import { BlockTitleInput, FrameButton } from '../ui/block-frame';
import BlockViewShell from '../ui/block-view-shell';

/**
 * بلوک سوالات متداول — داخل خود متن مقاله.
 *
 * سوال‌ها و پاسخ‌ها متن ساده‌اند (نه HTML) تا هم در سایت به‌شکل
 * آکاردئون تمیز نمایش داده شوند و هم داده‌ی ساخت‌یافته‌ی FAQ برای
 * گوگل از همان‌ها ساخته شود.
 */
export default function FaqNodeView(view: ReactNodeViewProps) {
  const config = normalizeBlockConfig('faq', view.node.attrs.config);
  const items = config.items;

  const update = (patch: Partial<FaqBlockConfig>) =>
    view.updateAttributes({ config: { ...config, ...patch } });

  const updateItems = (next: FaqBlockItem[]) => update({ items: next });

  const updateItem = (index: number, patch: Partial<FaqBlockItem>) =>
    updateItems(
      items.map((item, current) =>
        current === index ? { ...item, ...patch } : item,
      ),
    );

  const addItem = () =>
    updateItems([...items, { question: '', answer: '' }]);

  const removeItem = (index: number) =>
    updateItems(items.filter((_, current) => current !== index));

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);

    updateItems(next);
  };

  return (
    <BlockViewShell
      kind="faq"
      view={view}
      icon={<MessageCircleQuestion className="size-3.5" />}
      header={
        <BlockTitleInput
          value={config.title ?? ''}
          onChange={title => update({ title })}
          placeholder="عنوان بخش (مثلاً سوالات متداول)"
        />
      }
      footer={
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="size-3.5" />
          افزودن سوال
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="rounded border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500">
          هنوز سوالی اضافه نشده است؛ با «افزودن سوال» شروع کنید.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="rounded border border-neutral-100 bg-neutral-50/60 p-2"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[11px] text-neutral-400">
                  سوال {index + 1}
                </span>

                <div className="ms-auto flex items-center gap-0.5">
                  <FrameButton
                    title="انتقال به بالا"
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                  >
                    <span className="text-[10px]">▲</span>
                  </FrameButton>
                  <FrameButton
                    title="انتقال به پایین"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                  >
                    <span className="text-[10px]">▼</span>
                  </FrameButton>
                  <FrameButton
                    title="حذف سوال"
                    tone="danger"
                    onClick={() => removeItem(index)}
                  >
                    <span className="text-[10px]">✕</span>
                  </FrameButton>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  value={item.question}
                  onChange={event => updateItem(index, { question: event.target.value })}
                  placeholder="متن سوال"
                  className="h-8 bg-white text-xs"
                />

                <Textarea
                  value={item.answer}
                  onChange={event => updateItem(index, { answer: event.target.value })}
                  placeholder="متن پاسخ"
                  rows={3}
                  className="bg-white text-xs"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </BlockViewShell>
  );
}
