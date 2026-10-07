'use client';

import type { ReactNodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { canMoveNode, duplicateNode, moveNodeVertically } from '../lib/node-actions';
import { EditorBlockKind } from '../lib/types';
import BlockFrame from './block-frame';

/**
 * پوسته‌ی مشترک نودویوهای بلوکی.
 *
 * کارهای تکراری (پوشش نود، دستگیره‌ی درگ، جابه‌جایی بالا/پایین، کپی و
 * حذف) یک‌جا انجام می‌شود تا هر بلوک فقط محتوای اختصاصی خودش را بسازد.
 */
export default function BlockViewShell({
  kind,
  view,
  icon,
  header,
  footer,
  children,
  className,
}: {
  kind: EditorBlockKind;
  view: ReactNodeViewProps;
  icon?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { editor, getPos, deleteNode, selected, HTMLAttributes } = view;

  // صفت class خروجی renderHTML را با کلاس نمایشی خودمان ادغام می‌کنیم
  const { class: serializedClass, ...attributes } = (HTMLAttributes ?? {}) as Record<
    string,
    unknown
  >;

  return (
    <NodeViewWrapper
      as="div"
      {...attributes}
      className={cn(serializedClass as string, 'zp-block-view', className)}
    >
      <BlockFrame
        kind={kind}
        icon={icon}
        selected={selected}
        header={header}
        footer={footer}
        canMoveUp={canMoveNode(editor, getPos, -1)}
        canMoveDown={canMoveNode(editor, getPos, 1)}
        onMoveUp={() => moveNodeVertically(editor, getPos, -1)}
        onMoveDown={() => moveNodeVertically(editor, getPos, 1)}
        onDuplicate={() => duplicateNode(editor, getPos)}
        onRemove={() => deleteNode()}
      >
        {children}
      </BlockFrame>
    </NodeViewWrapper>
  );
}
