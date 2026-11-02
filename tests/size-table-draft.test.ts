import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  addColumn,
  addRow,
  buildPayload,
  createEmptyDraft,
  loadKeyFor,
  removeColumn,
  removeRow,
  syncValues,
  toDrafts,
  updateCell,
  updateColumn,
  updateRowLabel,
} from '../components/admin/product-guides/size-table-draft';
import { SizeTableResponse } from '../services/features/product-guides/type';

const COLUMN_IDS = [11, 12, 13, 14, 15];

/** همان شکلی که سرور واقعاً برمیگرداند: cells برحسب columnId، بدون values */
const serverTable: SizeTableResponse = {
  id: 7,
  name: 'سایزبندی پیراهن کلاسیک',
  unit: 'سانتیمتر',
  notes: null,
  columns: COLUMN_IDS.map((id, index) => ({
    id,
    label: ['S', 'M', 'L', 'XL', '2XL'][index],
  })),
  rows: [
    {
      id: 21,
      label: 'عرض سینه',
      cells: COLUMN_IDS.map((columnId, index) => ({
        columnId,
        value: String(50 + index * 3),
      })),
    },
    {
      id: 22,
      label: 'قد آستین',
      cells: COLUMN_IDS.map((columnId, index) => ({
        columnId,
        value: String(60 + index),
      })),
    },
  ],
};

const assertAligned = (draft: ReturnType<typeof createEmptyDraft>) => {
  for (const row of draft.rows) {
    assert.equal(row.values.length, draft.columns.length);
  }
};

test('بازگشت باگ اصلی: مقادیر cells سرور هنگام باز کردن فرم خالی نمی‌شوند', () => {
  const draft = toDrafts(serverTable);

  assert.deepEqual(draft.rows[0].values, ['50', '53', '56', '59', '62']);
  assert.deepEqual(draft.rows[1].values, ['60', '61', '62', '63', '64']);
  assert.deepEqual(
    draft.columns.map(column => column.label),
    ['S', 'M', 'L', 'XL', '2XL'],
  );
  assertAligned(draft);
});

test('cells بر اندیس مقدم است و پاسخ قدیمیِ فقط values هم پشتیبانی می‌شود', () => {
  const withBoth: SizeTableResponse = {
    ...serverTable,
    rows: [
      {
        id: 21,
        label: 'عرض سینه',
        // عمداً یک آرایهٔ موقعیتی متفاوت: نباید بر cells غلبه کند
        values: ['1', '2', '3', '4', '5'],
        cells: serverTable.rows[0].cells,
      },
    ],
  };
  assert.deepEqual(toDrafts(withBoth).rows[0].values, [
    '50',
    '53',
    '56',
    '59',
    '62',
  ]);

  const legacy: SizeTableResponse = {
    ...serverTable,
    rows: [
      { id: 21, label: 'عرض سینه', values: ['50', '53', '56', null, '62'] },
    ],
  };
  assert.deepEqual(toDrafts(legacy).rows[0].values, [
    '50',
    '53',
    '56',
    '',
    '62',
  ]);
});

test('حذف چند سایز فقط همان‌ها را حذف می‌کند و مقادیر بقیه سر جایشان میماند', () => {
  let draft = toDrafts(serverTable);

  // حذف M (اندیس ۱) و بعد XL (که بعد از حذف اول به اندیس ۲ منتقل شده)
  draft = removeColumn(draft, 1);
  draft = removeColumn(draft, 2);

  assert.deepEqual(
    draft.columns.map(column => column.label),
    ['S', 'L', '2XL'],
  );
  assert.deepEqual(
    draft.columns.map(column => column.id),
    [11, 13, 15],
  );
  assert.deepEqual(draft.rows[0].values, ['50', '56', '62']);
  assert.deepEqual(draft.rows[1].values, ['60', '62', '64']);
  assertAligned(draft);

  const result = buildPayload(draft);
  assert.ok(result.payload, 'پیلود معتبر است');
  assert.deepEqual(result.payload.rows[0].values, ['50', '56', '62']);
  assert.deepEqual(
    result.payload.columns.map(column => column.id),
    [11, 13, 15],
  );
  assert.equal(result.payload.rows.length, 2);
});

test('افزودن/حذف سایز و ردیف، طول مقادیر هر ردیف را همیشه همگام نگه میدارد', () => {
  let draft = toDrafts(serverTable);

  draft = addColumn(draft);
  draft = updateColumn(draft, draft.columns.length - 1, '3XL');
  assert.equal(draft.columns.length, 6);
  assert.deepEqual(draft.rows[0].values[5], '');
  assertAligned(draft);

  draft = updateCell(draft, 0, 5, '۷۰');
  assert.equal(draft.rows[0].values[5], '۷۰');

  draft = removeColumn(draft, 0);
  assert.deepEqual(draft.rows[0].values, ['53', '56', '59', '62', '۷۰']);
  assertAligned(draft);

  draft = addRow(draft);
  draft = updateRowLabel(draft, draft.rows.length - 1, 'دور کمر');
  assert.deepEqual(draft.rows[2].values, ['', '', '', '', '']);
  assertAligned(draft);

  draft = removeRow(draft, 1);
  assert.deepEqual(
    draft.rows.map(row => row.label),
    ['عرض سینه', 'دور کمر'],
  );
  assertAligned(draft);
});

test('حذف نامعتبر و جدول تک‌ستونه/تک‌ردیفه تغییری ایجاد نمی‌کند', () => {
  const draft = toDrafts(serverTable);

  assert.equal(removeColumn(draft, 99), draft);
  assert.equal(removeRow(draft, -1), draft);

  const single = { ...draft, columns: [draft.columns[0]], rows: [{...draft.rows[0], values: ['50']}] };
  assert.equal(removeColumn(single, 0).columns.length, 1);
});

test('syncValues آرایه‌های کوتاه/بلند ناهماهنگ را اصلاح می‌کند', () => {
  const draft = createEmptyDraft();
  const broken = {
    ...draft,
    rows: [
      { ...draft.rows[0], values: ['1'] },
      { ...draft.rows[1], values: ['1', '2', '3', '4', '5', '6'] },
    ],
  };

  assert.deepEqual(syncValues(broken).rows.map(row => row.values), [
    ['1', '', '', ''],
    ['1', '2', '3', '4'],
  ]);
});

test('پیلود نهایی: ایدی‌ها حفظ، مقادیر trim و خطاهای اعتبارسنجی اعلام می‌شوند', () => {
  const draft = toDrafts(serverTable);
  const result = buildPayload({
    ...draft,
    name: '  سایزبندی پیراهن  ',
    notes: '  ',
    unit: ' ',
    rows: draft.rows.map(row => ({ ...row, values: row.values.map(v => ` ${v} `) })),
  });

  assert.ok(result.payload);
  assert.equal(result.payload.name, 'سایزبندی پیراهن');
  assert.equal(result.payload.unit, 'سانتیمتر');
  assert.equal(result.payload.notes, null);
  assert.deepEqual(result.payload.rows[0].values, [
    '50',
    '53',
    '56',
    '59',
    '62',
  ]);

  assert.match(buildPayload({ ...draft, name: '  ' }).error ?? '', /نام جدول/);
  assert.match(
    buildPayload(updateColumn(draft, 0, ' ')).error ?? '',
    /برچسب/,
  );
  assert.match(
    buildPayload(updateRowLabel(draft, 0, '')).error ?? '',
    /مشخصه/,
  );
});

test('refetch پس‌زمینه‌ای فرم را ریست نمی‌کند، ولی باز کردن جدول دیگر چرا', () => {
  const first = loadKeyFor({ open: true, tableId: 7, dataId: 7 });
  const refetched = loadKeyFor({ open: true, tableId: 7, dataId: 7 });

  assert.equal(first, refetched, 'تغییر هویت پاسخ با همان شناسه ریست نمی‌کند');
  assert.notEqual(
    loadKeyFor({ open: true, tableId: 8, dataId: 8 }),
    first,
    'جدول دیگر ریست می‌شود',
  );
  assert.notEqual(
    loadKeyFor({ open: true, tableId: 7 }),
    first,
    'قبل از رسیدن داده فرم خالی مقدار‌دهی می‌شود',
  );
  assert.notEqual(
    loadKeyFor({ open: false, tableId: 7, dataId: 7 }),
    first,
    'بستن و باز کردن دوباره فرم را تازه می‌کند',
  );
  assert.notEqual(
    loadKeyFor({ open: true, tableId: null }),
    first,
    'جدول تازه فرم خالی میگیرد',
  );
});

test('مودال از منطق خالص استفاده می‌کند و اثر ریست‌کنندهٔ قدیمی حذف شده است', () => {
  const source = readFileSync(
    resolve(
      __dirname,
      '../components/admin/product-guides/size-table-modal.tsx',
    ),
    'utf8',
  );

  assert.match(source, /toDrafts\(data\.data\)/);
  assert.match(source, /loadKeyFor\(/);
  assert.match(source, /buildDraftPayload\(draft\)/);
  assert.match(source, /key=\{column\.key\}/);
  assert.doesNotMatch(source, /useEffect\(/);
  assert.doesNotMatch(source, /row\.values\?\.\[index\]/);
  assert.doesNotMatch(source, /column\.id \?\? `new-/);
});
