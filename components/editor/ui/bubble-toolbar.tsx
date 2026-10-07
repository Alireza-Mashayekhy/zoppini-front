'use client';

import type { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Quote,
  RemoveFormatting,
  Strikethrough,
  Underline,
} from 'lucide-react';

import LinkPopover from './link-popover';
import { ToolbarButton, ToolbarDivider } from './toolbar-button';

/** نودهایی که منوی شناور رویشان باز نمی‌شود */
const ATOM_NODES = ['zpImage', 'zpVideo', 'zpSlider', 'zpMedia', 'zpFaq', 'zpToc'];

/**
 * نوار ابزار شناور روی متن انتخاب‌شده.
 *
 * بدون رفتن به نوار ابزار بالا، قالب‌بندی سریع و لینک روی انتخاب اعمال
 * می‌شود — همان چیزی که کاربر از ادیتور وردپرس انتظار دارد.
 */
export default function BubbleToolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current) return null;

      return {
        bold: current.isActive('bold'),
        italic: current.isActive('italic'),
        underline: current.isActive('underline'),
        strike: current.isActive('strike'),
        code: current.isActive('code'),
        heading2: current.isActive('heading', { level: 2 }),
        heading3: current.isActive('heading', { level: 3 }),
        blockquote: current.isActive('blockquote'),
      };
    },
  });

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={100}
      shouldShow={({ editor: current, state }) => {
        if (!current.isEditable) return false;
        if (state.selection.empty) return false;
        if (state.selection instanceof NodeSelection) return false;

        const type = state.selection.$from.parent.type.name;

        return !ATOM_NODES.includes(type) && !current.isActive('codeBlock');
      }}
      className="zp-bubble"
    >
      <ToolbarButton
        title="درشت"
        active={state?.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="کج"
        active={state?.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="زیرخط"
        active={state?.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="خط‌خورده"
        active={state?.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="کد درون‌خطی"
        active={state?.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="size-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <LinkPopover editor={editor} />

      <ToolbarDivider />

      <ToolbarButton
        title="تیتر ۲"
        active={state?.heading2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="تیتر ۳"
        active={state?.heading3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="نقل‌قول"
        active={state?.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="حذف قالب‌بندی"
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      >
        <RemoveFormatting className="size-3.5" />
      </ToolbarButton>
    </BubbleMenu>
  );
}
