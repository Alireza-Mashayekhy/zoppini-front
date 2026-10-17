type CsvCell = string | number | boolean | null | undefined | Date;

/** escaping برای سلول‌های CSV (UI + گیومه داخلی) */
function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) {
    return '""';
  }

  const raw = value instanceof Date ? value.toISOString() : String(value);

  return `"${raw.replace(/"/g, '""')}"`;
}

/** ساخت محتوای CSV از هدرها و ردیف‌ها */
export function buildCsv(headers: string[], rows: CsvCell[][]): string {
  return [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(',')),
  ].join('\n');
}

/**
 * دانلود فایل CSV در مرورگر.
 * BOM ابتدای فایل باعث می‌شود اکسل فارسی را درست تشخیص دهد.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: CsvCell[][],
): void {
  const csv = buildCsv(headers, rows);

  const blob = new Blob(['\ufeff' + csv], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** نام فایل خروجی با در نظر گرفتن بازه تاریخ (مثلا visits-2026-01-01_2026-01-31.csv) */
export function csvFilename(base: string, from?: string, to?: string): string {
  const range = [from, to].filter(Boolean).join('_');

  return `${base}${range ? `-${range}` : '-all'}.csv`;
}
