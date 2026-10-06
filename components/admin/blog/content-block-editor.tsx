'use client';

import 'nilfam-editor/nilfam-editor.css';

import { NilfamEditor } from 'nilfam-editor';

import { BlockForm } from './types';
import { createItem } from './utils';

/** ویرایشگر متن هر بخش؛ متن داخل خود بلوک ذخیره می‌شود. */
export default function ContentBlockEditor({
  block,
  onChange,
}: {
  block: BlockForm;
  onChange: (block: BlockForm) => void;
}) {
  const item = block.items[0] ?? { ...createItem('content'), html: '' };

  return (
    <div className="space-y-2">
      <NilfamEditor
        value={item.html ?? ''}
        onChange={(html: string) =>
          onChange({ ...block, items: [{ ...item, html }] })
        }
        lang="fa"
        dark={false}
        placeholder="متن این قسمت را بنویسید؛ سپس عکس، سوالات متداول یا هر بخش دیگری را زیر آن اضافه کنید..."
      />
      <p className="text-xs text-gray-500">
        برای ادامه‌ی متن بعد از یک عکس یا FAQ، از «افزودن بخش ← متن» استفاده کنید.
      </p>
    </div>
  );
}
