'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { SortableItemCard, SortableList } from './sortable';
import { BlockForm } from './types';
import { createItem, moveItem } from './utils';

/** بلوک سوالات متداول: نوشتن سوال/پاسخ و جابه‌جایی با درگ‌دراپ */
export default function FaqBlockEditor({
  block,
  onChange,
}: {
  block: BlockForm;
  onChange: (block: BlockForm) => void;
}) {
  const updateItem = (key: string, patch: Partial<BlockForm['items'][number]>) => {
    onChange({
      ...block,
      items: block.items.map(item =>
        item.key === key ? { ...item, ...patch } : item,
      ),
    });
  };

  const removeItem = (key: string) => {
    onChange({
      ...block,
      items: block.items.filter(item => item.key !== key),
    });
  };

  const addItem = () => {
    onChange({ ...block, items: [...block.items, createItem('faq')] });
  };

  return (
    <div className="space-y-3">
      {block.items.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
          هنوز سوالی اضافه نشده است. با دکمه‌ی زیر سوال و پاسخ بنویسید.
        </p>
      )}

      <SortableList
        ids={block.items.map(item => item.key)}
        onReorder={(from, to) =>
          onChange({ ...block, items: moveItem(block.items, from, to) })
        }
      >
        {block.items.map((item, index) => (
          <SortableItemCard
            key={item.key}
            id={item.key}
            onRemove={() => removeItem(item.key)}
          >
            <div className="space-y-2">
              <span className="text-xs text-gray-400">سوال {index + 1}</span>

              <Input
                value={item.question ?? ''}
                onChange={event =>
                  updateItem(item.key, { question: event.target.value })
                }
                placeholder="متن سوال"
                className="bg-white"
              />

              <Textarea
                value={item.answer ?? ''}
                onChange={event =>
                  updateItem(item.key, { answer: event.target.value })
                }
                placeholder="متن پاسخ"
                rows={3}
                className="bg-white"
              />
            </div>
          </SortableItemCard>
        ))}
      </SortableList>

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="size-4" />
        افزودن سوال
      </Button>
    </div>
  );
}
