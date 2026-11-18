export interface SortableSize {
  id: number;
  name: string;
}

/** ارقام فارسی/عربی را به لاتین تبدیل می‌کند تا «۴۶» و «46» یکسان دیده شوند. */
function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

const LETTER_RANK: Record<string, number> = {
  XXS: 5,
  XS: 10,
  S: 20,
  SMALL: 20,
  M: 30,
  MEDIUM: 30,
  L: 40,
  LARGE: 40,
  XL: 50,
  X_LARGE: 50,
  XXL: 60,
  '2XL': 60,
  XXXL: 70,
  '3XL': 70,
  '4XL': 80,
  '5XL': 90,
  '6XL': 100,
  FREE: 110,
  FREESIZE: 110,
  ONESIZE: 110,
};

function letterRank(name: string): number | null {
  const normalized = name
    .trim()
    .toUpperCase()
    .replace(/[\s\-_.]+/g, '');

  return LETTER_RANK[normalized] ?? null;
}

function numericValue(name: string): number | null {
  const normalized = normalizeDigits(name).trim();

  // فقط عدد صحیح (مثل ۴۶ / 46)؛ «سایز ۴۶» یا «۴۶/۴۸» در این دسته نیست.
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * ترتیب گزینه‌های سایز بر اساس خود نام سایز (نه id دیتابیس):
 *
 * ۱) سایزهای عددی صعودی (۴۰، ۴۲، ۴۴، ۴۶ …)
 * ۲) سایزهای حروفی به ترتیب متعارف (XS, S, M, L, XL, XXL, 3XL …)
 * ۳) بقیه بر اساس مقایسهٔ فارسی، تا هیچ گزینه‌ای حذف نشود.
 *
 * این تابع خالص است و روی همان گزینه‌های واقعی برگشتی از سرور اجرا می‌شود؛
 * بنابراین صفحهٔ «همه محصولات» اجتماع سایزها را مرتب نشان می‌دهد و صفحهٔ یک
 * دسته فقط سایزهای همان دسته را.
 */
export function sortSizeOptions<T extends SortableSize>(sizes: T[]): T[] {
  return [...sizes].sort((a, b) => {
    const aNumeric = numericValue(a.name);
    const bNumeric = numericValue(b.name);

    if (aNumeric !== null && bNumeric !== null) {
      if (aNumeric !== bNumeric) return aNumeric - bNumeric;
      return a.name.localeCompare(b.name, 'fa');
    }

    if (aNumeric !== null) return -1;
    if (bNumeric !== null) return 1;

    const aRank = letterRank(a.name);
    const bRank = letterRank(b.name);

    if (aRank !== null && bRank !== null) {
      if (aRank !== bRank) return aRank - bRank;
      return a.name.localeCompare(b.name, 'fa');
    }

    if (aRank !== null) return -1;
    if (bRank !== null) return 1;

    return a.name.localeCompare(b.name, 'fa');
  });
}
