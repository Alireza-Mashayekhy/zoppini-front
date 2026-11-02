import {
  SizeTableResponse,
  UpsertSizeTableDto,
} from '@/services/features/product-guides/type';

/**
 * منطق خالص ادیتور جدول سایزبندی (بدون React) تا مستقل تست شود.
 *
 * نکتهٔ مهم قرارداد داده: پاسخ سرور برای هر ردیف `cells` به‌صورت
 * `{ columnId, value }[]` می‌فرستد (همان چیزی که موتور resolve محصول می‌خواند)
 * و نسخهٔ ادمین ممکن است `values` موقعیتی هم داشته باشد. این ماژول هر دو
 * شکل را می‌پذیرد، ولی `cells` را ترجیح می‌دهد چون وابسته به جابه‌جایی
 * اندیس ستون‌ها نیست. نسخهٔ قدیمی فرم فقط `values?.[index]` را می‌خواند؛
 * چون سرور `values` نمی‌فرستاد، همهٔ سلول‌ها خالی لود می‌شدند و با اولین
 * ذخیره مقادیر بقیهٔ سایز‌ها پاک می‌شد.
 */

export type ColumnDraft = { key: string; id?: number; label: string };
export type RowDraft = {
  key: string;
  id?: number;
  label: string;
  values: string[];
};

export interface SizeTableDraft {
  name: string;
  unit: string;
  notes: string;
  columns: ColumnDraft[];
  rows: RowDraft[];
}

let keyCounter = 0;
const nextKey = (prefix: string) => `${prefix}-${++keyCounter}`;

const DEFAULT_COLUMN_LABELS = ['S', 'M', 'L', 'XL'];
const DEFAULT_ROW_LABELS = ['عرض سینه', 'قد آستین'];

export function createEmptyDraft(): SizeTableDraft {
  const columns = DEFAULT_COLUMN_LABELS.map(label => ({
    key: nextKey('col'),
    label,
  }));

  return {
    name: '',
    unit: 'سانتیمتر',
    notes: '',
    columns,
    rows: DEFAULT_ROW_LABELS.map(label => ({
      key: nextKey('row'),
      label,
      values: columns.map(() => ''),
    })),
  };
}

/** طول آرایهٔ مقادیر هر ردیف همیشه برابر تعداد ستون‌ها نگه داشته می‌شود. */
export function syncValues(draft: SizeTableDraft): SizeTableDraft {
  const length = draft.columns.length;

  return {
    ...draft,
    rows: draft.rows.map(row => ({
      ...row,
      values: Array.from({ length }, (_, index) => row.values[index] ?? ''),
    })),
  };
}

/**
 * کلید مقداردهی اولیهٔ فرم. فقط به وضعیت بازبودن، شناسهٔ جدول و شناسهٔ
 * دادهٔ لودشده وابسته است؛ تغییر هویت شیء پاسخ (refetch پس‌زمینه‌ای)
 * نباید ویرایش‌های ذخیره‌نشدهٔ ادمین را پاک کند.
 */
export const loadKeyFor = ({
  open,
  tableId,
  dataId,
}: {
  open: boolean;
  tableId?: number | null;
  dataId?: number;
}) => `${open ? 'open' : 'closed'}:${tableId ?? 'new'}:${dataId ?? ''}`;

const cellValueOf = (
  row: SizeTableResponse['rows'][number],
  column: ColumnDraft,
  index: number,
): string => {
  // سرور سلول‌ها را با شناسهٔ ستون می‌فرستد: حذف ستون‌های دیگر اینجا باعث
  // جابه‌جایی مقادیر نمی‌شود.
  if (column.id !== undefined && Array.isArray(row.cells)) {
    const cell = row.cells.find(item => item.columnId === column.id);

    return cell?.value == null ? '' : String(cell.value);
  }

  const value = row.values?.[index];

  return value == null ? '' : String(value);
};

export function toDrafts(table: SizeTableResponse): SizeTableDraft {
  const columns: ColumnDraft[] = (table.columns ?? []).map(column => ({
    key: `col-${column.id}`,
    id: column.id,
    label: column.label ?? '',
  }));

  const rows: RowDraft[] = (table.rows ?? []).map(row => ({
    key: `row-${row.id}`,
    id: row.id,
    label: row.label ?? '',
    values: columns.map((column, index) =>
      cellValueOf(row, column, index),
    ),
  }));

  return syncValues({
    name: table.name ?? '',
    unit: table.unit ?? 'سانتیمتر',
    notes: table.notes ?? '',
    columns,
    rows,
  });
}

export const addColumn = (draft: SizeTableDraft): SizeTableDraft => ({
  ...draft,
  columns: [...draft.columns, { key: nextKey('col'), label: '' }],
  rows: draft.rows.map(row => ({ ...row, values: [...row.values, ''] })),
});

/** حذف یک سایز: ستون و خانهٔ متناظرش در تکتک ردیف‌ها با هم حذف می‌شوند. */
export const removeColumn = (
  draft: SizeTableDraft,
  index: number,
): SizeTableDraft => {
  if (draft.columns.length <= 1) return draft;
  if (index < 0 || index >= draft.columns.length) return draft;

  return syncValues({
    ...draft,
    columns: draft.columns.filter((_, position) => position !== index),
    rows: draft.rows.map(row => ({
      ...row,
      values: row.values.filter((_, position) => position !== index),
    })),
  });
};

export const updateColumn = (
  draft: SizeTableDraft,
  index: number,
  label: string,
): SizeTableDraft => ({
  ...draft,
  columns: draft.columns.map((column, position) =>
    position === index ? { ...column, label } : column,
  ),
});

export const addRow = (draft: SizeTableDraft): SizeTableDraft => ({
  ...draft,
  rows: [
    ...draft.rows,
    {
      key: nextKey('row'),
      label: '',
      values: draft.columns.map(() => ''),
    },
  ],
});

export const removeRow = (
  draft: SizeTableDraft,
  index: number,
): SizeTableDraft => {
  if (draft.rows.length <= 1) return draft;
  if (index < 0 || index >= draft.rows.length) return draft;

  return {
    ...draft,
    rows: draft.rows.filter((_, position) => position !== index),
  };
};

export const updateRowLabel = (
  draft: SizeTableDraft,
  index: number,
  label: string,
): SizeTableDraft => ({
  ...draft,
  rows: draft.rows.map((row, position) =>
    position === index ? { ...row, label } : row,
  ),
});

export const updateCell = (
  draft: SizeTableDraft,
  rowIndex: number,
  columnIndex: number,
  value: string,
): SizeTableDraft => ({
  ...draft,
  rows: draft.rows.map((row, position) =>
    position === rowIndex
      ? {
          ...row,
          values: row.values.map((cell, index) =>
            index === columnIndex ? value : cell,
          ),
        }
      : row,
  ),
});

export type PayloadResult =
  | { payload: UpsertSizeTableDto; error?: never }
  | { payload?: never; error: string };

export function buildPayload(draft: SizeTableDraft): PayloadResult {
  if (!draft.name.trim()) {
    return { error: 'نام جدول سایزبندی را وارد کنید.' };
  }

  const columns = draft.columns.map(column => ({
    id: column.id,
    label: column.label.trim(),
  }));

  if (columns.some(column => !column.label)) {
    return { error: 'برچسب همه سایز‌ها را وارد کنید.' };
  }

  const rows = draft.rows.map(row => ({
    id: row.id,
    label: row.label.trim(),
    values: draft.columns.map((_, index) =>
      String(row.values[index] ?? '').trim(),
    ),
  }));

  if (rows.some(row => !row.label)) {
    return { error: 'نام همه مشخصه‌های اندازه‌گیری را وارد کنید.' };
  }

  return {
    payload: {
      name: draft.name.trim(),
      unit: draft.unit.trim() || 'سانتیمتر',
      notes: draft.notes.trim() || null,
      columns,
      rows,
    },
  };
}
