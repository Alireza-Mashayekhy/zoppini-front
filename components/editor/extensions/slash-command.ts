import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * منوی اسلش («/») — مثل گوتنبرگ وردپرس.
 *
 * این افزونه فقط کلیدها را مدیریت می‌کند؛ تشخیص خود «/»، جای منو و
 * فهرست گزینه‌ها در کامپوننت ادیتور انجام می‌شود تا با React ساده بماند.
 */

export interface SlashCommandOptions {
  /** آیا منو باز است؟ */
  isOpen: () => boolean;
  /** مدیریت کلیدها؛ اگر منو کلید را مصرف کرد true برمی‌گرداند */
  onKeyDown: (event: KeyboardEvent) => boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    slashCommand: {
      /** حذف «/» تایپ‌شده و درج بلوک انتخابی */
      consumeSlashQuery: (from: number, to: number) => ReturnType;
    };
  }
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      isOpen: () => false,
      onKeyDown: () => false,
    };
  },

  addCommands() {
    return {
      consumeSlashQuery:
        (from, to) =>
        ({ chain }) =>
          chain().focus().deleteRange({ from, to }).run(),
    };
  },

  addProseMirrorPlugins() {
    const { isOpen, onKeyDown } = this.options;

    return [
      new Plugin({
        key: new PluginKey('zpSlashCommand'),
        props: {
          handleKeyDown: (_view, event) => (isOpen() ? onKeyDown(event) : false),
        },
      }),
    ];
  },
});
