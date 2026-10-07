import { Extension } from '@tiptap/core';

/**
 * افزونه‌ی جهت متن (RTL/LTR) برای پاراگراف، تیتر و لیست‌ها.
 *
 * افزونه‌ی رسمی TextAlign فقط `text-align` را مدیریت می‌کند؛ برای متن
 * فارسی گاهی لازم است یک بند یا تیتر خاص چپ‌به‌راست نوشته شود (مثلاً متن
 * انگلیسی یا آدرس). این افزونه صفت `dir` را به همان نودها اضافه می‌کند.
 */

const TYPES = ['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList'];

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    direction: {
      /** تنظیم جهت متن (rtl یا ltr) */
      setDirection: (direction: 'rtl' | 'ltr' | null) => ReturnType;
      /** جابه‌جایی بین راست‌به‌چپ و چپ‌به‌راست */
      toggleDirection: () => ReturnType;
      /** حذف جهت دستی (بازگشت به جهت پیش‌فرض سند) */
      unsetDirection: () => ReturnType;
    };
  }
}

/** نوع نود زیر نشانگر (اگر از نوع‌های پشتیبانی‌شده باشد) */
function currentDirectionType(editor: { state: { selection: { $anchor: { parent: { type: { name: string } } } } } }) {
  const name = editor.state.selection.$anchor.parent.type.name;
  return TYPES.includes(name) ? name : null;
}

export const Direction = Extension.create({
  name: 'direction',

  addGlobalAttributes() {
    return [
      {
        types: TYPES,
        attributes: {
          dir: {
            default: null,
            parseHTML: element => element.getAttribute('dir'),
            renderHTML: attributes => (attributes.dir ? { dir: attributes.dir } : {}),
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setDirection:
        direction =>
        ({ chain, editor }) => {
          const type = currentDirectionType(editor);

          if (!type) return false;

          return chain().updateAttributes(type, { dir: direction }).run();
        },

      toggleDirection:
        () =>
        ({ chain, editor }) => {
          const type = currentDirectionType(editor);

          if (!type) return false;

          const current = editor.state.selection.$anchor.parent.attrs.dir as
            | 'rtl'
            | 'ltr'
            | null;

          return chain()
            .updateAttributes(type, { dir: current === 'rtl' ? 'ltr' : 'rtl' })
            .run();
        },

      unsetDirection:
        () =>
        ({ chain }) =>
          chain().setDirection(null).run(),
    };
  },
});
