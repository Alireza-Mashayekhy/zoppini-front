import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** حداکثر تعداد محصولاتی که می‌توانند هم‌زمان مقایسه شوند */
export const MAX_COMPARE = 4;

export interface CompareItem {
  id: number;
  title: string;
  slug: string;
  /** URL کامل تصویر (برای نمایش مستقیم بدون پیشوند مجدد) */
  image: string;
  price: number;
}

export type ToggleCompareResult = 'added' | 'removed' | 'limit';

interface CompareStore {
  items: CompareItem[];

  /**
   * تا زمانی که rehydration از localStorage انجام نشده، مقادیر سمت سرور
   * (خالی) معتبر هستند؛ کامپوننت‌ها تا true شدن این فلگ، state واقعی را
   * نمایش نمی‌دهند تا hydration mismatch رخ ندهد.
   */
  hydrated: boolean;
  setHydrated: () => void;

  toggle: (item: CompareItem) => ToggleCompareResult;
  remove: (id: number) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,

      setHydrated: () =>
        set(state => (state.hydrated ? state : { ...state, hydrated: true })),

      toggle: item => {
        const state = get();
        const exists = state.items.some(current => current.id === item.id);

        if (exists) {
          set({ items: state.items.filter(current => current.id !== item.id) });
          return 'removed';
        }

        if (state.items.length >= MAX_COMPARE) {
          return 'limit';
        }

        set({ items: [...state.items, item] });
        return 'added';
      },

      remove: id =>
        set(state => ({
          items: state.items.filter(current => current.id !== id),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'zoppini-compare-items',
      // فقط لیست محصولات ذخیره شود؛ hydrated هر بار صفر می‌شود
      partialize: state => ({ items: state.items }),
    },
  ),
);
