import { BlogBlock, BlogBlockItem } from '@/services/features/blog/types';

/**
 * تایپ‌های مخصوص فرم پنل ادمین.
 *
 * هر بلوک/آیتم یک `key` کلاینتی دارد تا درگ‌دراپ (dnd-kit) موقع
 * جابه‌جایی، هویت عنصر را گم نکند. این key قبل از ارسال به سرور حذف می‌شود.
 */
export interface BlockItemForm extends BlogBlockItem {
  key: string;
}

export interface BlockForm extends Omit<BlogBlock, 'items'> {
  key: string;
  items: BlockItemForm[];
}

let keySequence = 0;

/** کلید یکتای کلاینتی */
export function nextKey(): string {
  keySequence += 1;
  return `bk-${Date.now().toString(36)}-${keySequence}`;
}
