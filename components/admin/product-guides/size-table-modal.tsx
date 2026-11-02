'use client';

import { Plus, Rows3, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useGuideMutations,
  useGuideUsage,
  useSizeTable,
} from '@/services/features/product-guides/hooks';

import type { SizeTableDraft } from './size-table-draft';
import {
  addColumn as addColumnToDraft,
  addRow as addRowToDraft,
  buildPayload as buildDraftPayload,
  createEmptyDraft,
  loadKeyFor,
  removeColumn as removeColumnFromDraft,
  removeRow as removeRowFromDraft,
  toDrafts,
  updateCell as updateCellInDraft,
  updateColumn as updateColumnInDraft,
  updateRowLabel as updateRowLabelInDraft,
} from './size-table-draft';

/**
 * ادیتور جدول سایزبندی
 *
 * جدول واقعی و قابل ویرایش است (نه عکس و نه متن داخل ادیتور توضیحات):
 * سایزها (ستون‌ها) و مشخصه‌های اندازه‌گیری (ردیف‌ها) اضافه، حذف و ویرایش
 * می‌شوند و مقدار هر خانه مستقل تغییر می‌کند.
 * خانه خالی یعنی «اندازه وارد نشده» و به‌عنوان صفر ذخیره نمی‌شود.
 */
export default function SizeTableModal({
  open,
  onOpenChange,
  tableId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId?: number | null;
}) {
  const isEdit = Boolean(tableId);

  const { data, isLoading } = useSizeTable(tableId ?? undefined);

  const { data: usage } = useGuideUsage('size-table', tableId ?? undefined);

  const { saveSizeTable } = useGuideMutations();

  const loadKey = loadKeyFor({
    open,
    tableId,
    dataId: data?.data?.id,
  });

  /**
   * الگوی مستند React برای «بازنشانی state هنگام تغییر props»: به‌جای
   * useEffect، همان هنگام render مقدار‌دهی انجام می‌شود. کلید فقط به
   * شناسهٔ جدول وابسته است، نه هویت شیء پاسخ؛ پس بارگذاری دوبارهٔ
   * پس‌زمینه‌ای (باطل شدن کش سایر جهش‌ها یا فوکوس دوبارهٔ پنجره)
   * ویرایش‌های ذخیره‌نشده را پاک نمی‌کند.
   */
  const [form, setForm] = useState<{ key: string; draft: SizeTableDraft }>(
    () => ({ key: '', draft: createEmptyDraft() }),
  );

  if (form.key !== loadKey) {
    setForm({
      key: loadKey,
      draft: tableId && data?.data ? toDrafts(data.data) : createEmptyDraft(),
    });
  }

  const draft = form.draft;
  const { name, unit, notes, columns, rows } = draft;

  const setDraft = (updater: (previous: SizeTableDraft) => SizeTableDraft) =>
    setForm(previous => ({ ...previous, draft: updater(previous.draft) }));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dependents = usage?.data;

  const totalProducts = dependents?.totalProducts ?? 0;
  const totalCategories = dependents?.categories.length ?? 0;

  const setName = (value: string) =>
    setDraft(previous => ({ ...previous, name: value }));
  const setUnit = (value: string) =>
    setDraft(previous => ({ ...previous, unit: value }));
  const setNotes = (value: string) =>
    setDraft(previous => ({ ...previous, notes: value }));

  const addColumn = () =>
    setDraft(previous => addColumnToDraft(previous));

  const updateColumn = (index: number, label: string) =>
    setDraft(previous => updateColumnInDraft(previous, index, label));

  const removeColumn = (index: number) => {
    if (columns.length <= 1) {
      toast.error('حداقل یک سایز باید در جدول باشد.');

      return;
    }

    setDraft(previous => removeColumnFromDraft(previous, index));
  };

  const addRow = () => setDraft(previous => addRowToDraft(previous));

  const updateRowLabel = (index: number, label: string) =>
    setDraft(previous => updateRowLabelInDraft(previous, index, label));

  const updateCell = (rowIndex: number, columnIndex: number, value: string) =>
    setDraft(previous =>
      updateCellInDraft(previous, rowIndex, columnIndex, value),
    );

  const removeRow = (index: number) => {
    if (rows.length <= 1) {
      toast.error('حداقل یک مشخصه اندازه‌گیری باید در جدول باشد.');

      return;
    }

    setDraft(previous => removeRowFromDraft(previous, index));
  };

  const buildPayload = () => {
    const result = buildDraftPayload(draft);

    if (result.error) {
      toast.error(result.error);

      return null;
    }

    return result.payload;
  };

  const submit = async () => {
    const payload = buildPayload();

    if (!payload) return;

    try {
      await saveSizeTable.mutateAsync({ id: tableId ?? undefined, payload });

      onOpenChange(false);
    } catch {
      /** پیام خطا در هوک نمایش داده می‌شود */
    }
  };

  const handleSaveClick = () => {
    if (!buildPayload()) return;

    if (isEdit && totalProducts > 0) {
      setConfirmOpen(true);

      return;
    }

    void submit();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] max-w-5xl! flex-col gap-4 overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'ویرایش جدول سایزبندی' : 'جدول سایزبندی جدید'}
            </DialogTitle>
          </DialogHeader>

          {isEdit && isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              در حال بارگذاری...
            </div>
          ) : (
            <div className="flex-1 space-y-5 overflow-y-auto pl-1">
              <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">نام جدول</label>

                  <Input
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="مثال: سایزبندی پیراهن کلاسیک"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    واحد اندازه‌گیری
                  </label>

                  <Input
                    value={unit}
                    onChange={event => setUnit(event.target.value)}
                    placeholder="سانتیمتر"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  توضیحات جدول (اختیاری)
                </label>

                <Textarea
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  placeholder="مثال: اندازه‌ها با تلورانس ۱ سانتی‌متر است."
                  rows={2}
                />
              </div>

              {isEdit && (totalProducts > 0 || totalCategories > 0) && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                  این جدول به {totalCategories} دسته و {totalProducts} محصول
                  متصل است. تغییرات پس از ذخیره روی همه آن‌ها اعمال می‌شود؛
                  مقادیری که برای یک محصول اختصاصی تعیین شده‌اند دست‌نخورده
                  می‌مانند.
                </div>
              )}

              {/* سایزها = ستون‌ها */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Rows3 className="size-4" />
                    سایزها (ستون‌ها)
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addColumn}
                  >
                    <Plus className="size-4" />
                    افزودن سایز
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {columns.map((column, index) => (
                    <div
                      key={column.key}
                      className="flex items-center gap-1 rounded-lg border bg-white p-1"
                    >
                      <Input
                        value={column.label}
                        onChange={event =>
                          updateColumn(index, event.target.value)
                        }
                        className="h-8 w-24 border-0 shadow-none focus-visible:ring-0"
                        placeholder="سایز"
                      />

                      <button
                        type="button"
                        onClick={() => removeColumn(index)}
                        className="rounded p-1 text-muted-foreground transition hover:bg-red-50 hover:text-red-500"
                        aria-label="حذف سایز"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* مشخصه‌ها = ردیف‌ها */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    مشخصه‌های اندازه‌گیری (ردیف‌ها)
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRow}
                  >
                    <Plus className="size-4" />
                    افزودن مشخصه
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-max text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="min-w-45 p-2 text-right font-medium">
                          مشخصه
                        </th>

                        {columns.map((column, index) => (
                          <th
                            key={`head-${column.key}`}
                            className="min-w-24 p-2 text-center font-medium"
                          >
                            {column.label || `سایز ${index + 1}`}
                          </th>
                        ))}

                        <th className="w-10 p-2" />
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <tr
                          key={row.key}
                          className="border-t"
                        >
                          <td className="p-1.5">
                            <Input
                              value={row.label}
                              onChange={event =>
                                updateRowLabel(rowIndex, event.target.value)
                              }
                              className="h-9 min-w-40"
                              placeholder="مثال: عرض سینه"
                            />
                          </td>

                          {columns.map((column, columnIndex) => (
                            <td
                              key={`cell-${column.key}`}
                              className="p-1.5"
                            >
                              <Input
                                value={row.values[columnIndex] ?? ''}
                                onChange={event =>
                                  updateCell(
                                    rowIndex,
                                    columnIndex,
                                    event.target.value,
                                  )
                                }
                                inputMode="decimal"
                                className="h-9 w-24 text-center"
                                placeholder="—"
                              />
                            </td>
                          ))}

                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(rowIndex)}
                              className="rounded p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-500"
                              aria-label="حذف مشخصه"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-muted-foreground">
                  ورود ارقام فارسی و انگلیسی و اعداد اعشاری ممکن است. خانه خالی
                  به معنی «اندازه وارد نشده» است و صفر ذخیره نمی‌شود.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>

            <Button
              type="button"
              onClick={handleSaveClick}
              loading={saveSizeTable.isPending}
            >
              {isEdit ? 'ذخیره جدول' : 'ساخت جدول'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* تأیید قبل از ذخیره راهنمای مشترک */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ذخیره تغییرات راهنمای مشترک</AlertDialogTitle>

            <AlertDialogDescription className="leading-7">
              این جدول به <b>{totalCategories} دسته</b> و{' '}
              <b>{totalProducts} محصول</b> متصل است. تغییرات روی همه آن‌ها اعمال
              می‌شود و فقط مقادیر «اختصاصی این محصول» دست‌نخورده می‌ماند.
              {Boolean(dependents?.overrides.productCount) && (
                <span className="mt-2 block text-amber-700">
                  {dependents?.overrides.productCount} محصول تغییر اختصاصی
                  دارند.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>

            <AlertDialogAction onClick={() => void submit()}>
              ذخیره می‌کنم
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
