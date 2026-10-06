'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Image as ImageIcon,
  Info,
  ListTree,
  MessageCircleQuestion,
  Plus,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { ReactNode, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { BlogBlockType } from '@/services/features/blog/types';

import ContentBlockEditor from './content-block-editor';
import FaqBlockEditor from './faq-block-editor';
import MediaBlockEditor from './media-block-editor';
import SliderBlockEditor from './slider-block-editor';
import { SortableList } from './sortable';
import { BlockForm } from './types';
import { BLOCK_ADDABLE_TYPES, BLOCK_LABELS, createBlock, ensureContentBlock, moveItem } from './utils';

const BLOCK_ICONS: Record<BlogBlockType, ReactNode> = {
  content: <ListTree className="size-4" />,
  faq: <MessageCircleQuestion className="size-4" />,
  slider: <SlidersHorizontal className="size-4" />,
  media: <ImageIcon className="size-4" />,
  toc: <ListTree className="size-4" />,
};

const BLOCK_HINTS: Record<BlogBlockType, string> = {
  content: 'یک قسمت از متن مقاله؛ می‌توانید هر تعداد بخش متن بین عکس، FAQ و اسلایدر اضافه کنید.',
  faq: 'سوال‌های متداول مرتبط با همین مقاله؛ در مقاله به شکل آکاردئون نمایش داده می‌شود.',
  slider: 'اسلایدر محصولات انتخابی از محصولات موجود فروشگاه.',
  media: 'عکس و فیلم‌هایی که از سیستم خودتان آپلود می‌کنید.',
  toc: 'به‌صورت خودکار از تیترهای (H2 تا H4) متن مقاله ساخته می‌شود؛ فقط جای نمایشش را تعیین کنید.',
};

/**
 * ویرایشگر بخش‌های مقاله.
 *
 * ترتیب بخش‌ها با درگ‌دراپ تعیین می‌شود و همان ترتیب در سایت نمایش
 * داده می‌شود. داخل هر بخش هم آیتم‌ها (سوال، محصول، فایل) درگ‌دراپی‌اند.
 */
export default function BlogBlocksEditor({
  blocks,
  onChange,
}: {
  blocks: BlockForm[];
  onChange: (blocks: BlockForm[]) => void;
}) {
  // useMemo تا کلید کلاینتی بخش متن اصلی بین رندرها ثابت بماند
  const orderedBlocks = useMemo(() => ensureContentBlock(blocks), [blocks]);

  const updateBlock = (key: string, nextBlock: BlockForm) => {
    onChange(orderedBlocks.map(block => (block.key === key ? nextBlock : block)));
  };

  const removeBlock = (key: string) => {
    onChange(orderedBlocks.filter(block => block.key !== key));
  };

  const addBlock = (type: BlogBlockType) => {
    onChange([...orderedBlocks, createBlock(type)]);
  };

  const hasToc = orderedBlocks.some(block => block.type === 'toc');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          بخش‌ها را با دستگیره جابه‌جا کنید؛ ترتیب همین‌جا در مقاله اعمال
          می‌شود.
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="dark" size="sm">
              <Plus className="size-4" />
              افزودن بخش
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {BLOCK_ADDABLE_TYPES.map(type => (
              <DropdownMenuItem
                key={type}
                disabled={type === 'toc' && hasToc}
                onClick={() => addBlock(type)}
                className="flex items-center gap-2"
              >
                {BLOCK_ICONS[type]}
                {BLOCK_LABELS[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SortableList
        ids={orderedBlocks.map(block => block.key)}
        onReorder={(from, to) => onChange(moveItem(orderedBlocks, from, to))}
      >
        {orderedBlocks.map((block, index) => (
          <SortableBlockCard
            key={block.key}
            block={block}
            index={index}
            onUpdate={nextBlock => updateBlock(block.key, nextBlock)}
            onRemove={
              block.type === 'content' &&
              orderedBlocks.filter(item => item.type === 'content').length === 1
                ? undefined
                : () => removeBlock(block.key)
            }
          >
            {block.type === 'faq' && (
              <FaqBlockEditor block={block} onChange={updateBlock.bind(null, block.key)} />
            )}

            {block.type === 'slider' && (
              <SliderBlockEditor block={block} onChange={updateBlock.bind(null, block.key)} />
            )}

            {block.type === 'media' && (
              <MediaBlockEditor block={block} onChange={updateBlock.bind(null, block.key)} />
            )}

            {block.type === 'toc' && (
              <p className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-xs text-blue-700">
                <Info className="mt-0.5 size-4 shrink-0" />
                {BLOCK_HINTS.toc}
              </p>
            )}

            {block.type === 'content' && (
              <ContentBlockEditor
                block={block}
                onChange={updateBlock.bind(null, block.key)}
              />
            )}
          </SortableBlockCard>
        ))}
      </SortableList>
    </div>
  );
}

/** قاب هر بخش با دستگیره‌ی درگ‌دراپ، عنوان و دکمه‌ی حذف */
function SortableBlockCard({
  block,
  index,
  onUpdate,
  onRemove,
  children,
}: {
  block: BlockForm;
  index: number;
  onUpdate: (block: BlockForm) => void;
  onRemove?: () => void;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.key });

  const isContent = block.type === 'content';

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 20 : undefined,
      }}
      className={cn(
        'rounded-xl border border-gray-200 bg-gray-50/60',
        isDragging && 'border-primary-400 shadow-xl',
        isContent && 'bg-white',
      )}
      {...attributes}
    >
      <div className="flex items-center gap-3 border-b border-gray-100 px-3 py-2.5">
        <button
          type="button"
          {...listeners}
          aria-label="جابه‌جایی بخش"
          className="cursor-grab touch-none text-gray-400 transition-colors hover:text-gray-700 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>

        <span className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
          {BLOCK_ICONS[block.type]}
          {BLOCK_LABELS[block.type]}
        </span>

        <span className="text-xs text-gray-400">بخش {index + 1}</span>

        {!isContent && (
          <Input
            value={block.title ?? ''}
            onChange={event => onUpdate({ ...block, title: event.target.value })}
            placeholder="عنوان بخش (اختیاری)"
            className="ms-auto h-8 max-w-64 bg-white"
          />
        )}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="حذف بخش"
            className={cn(
              'rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50',
              isContent ? 'ms-auto' : '',
            )}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <div className="p-3">{children}</div>
    </div>
  );
}
