'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * لیست مرتب‌شدنی با درگ‌دراپ.
 *
 * هر لیست DndContext مستقل خودش را دارد تا لیست‌های تودرتو (آیتم‌های
 * داخل هر بخش) با لیست بیرونی (خود بخش‌ها) تداخل نکنند.
 */
export function SortableList({
  ids,
  onReorder,
  children,
  className,
}: {
  ids: string[];
  onReorder: (from: number, to: number) => void;
  children: ReactNode;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // فاصله‌ی کم برای شروع درگ تا کلیک روی دکمه‌ها/ورودی‌ها از بین نرود
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;

        const from = ids.indexOf(String(active.id));
        const to = ids.indexOf(String(over.id));

        if (from === -1 || to === -1) return;

        onReorder(from, to);
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={cn('space-y-3', className)}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * کارت یک آیتم داخل بخش‌ها (سوال، محصول اسلایدر، عکس/فیلم)
 */
export function SortableItemCard({
  id,
  leading,
  children,
  onRemove,
  className,
  removeLabel = 'حذف',
}: {
  id: string;
  leading?: ReactNode;
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
  removeLabel?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 20 : undefined,
      }}
      className={cn(
        'flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3',
        isDragging && 'border-primary-400 shadow-lg',
        className,
      )}
      {...attributes}
    >
      <button
        type="button"
        {...listeners}
        aria-label="جابه‌جایی"
        className="mt-1 shrink-0 cursor-grab touch-none text-gray-400 transition-colors hover:text-gray-700 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      {leading}

      <div className="min-w-0 flex-1">{children}</div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="shrink-0 rounded-md p-1 text-red-500 transition-colors hover:bg-red-50"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
