'use client';

import { ArrowDown, ArrowUp, ListChecks, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { CareIconPicker } from '@/components/shared/care-icon';
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
  useCareGuide,
  useGuideMutations,
  useGuideUsage,
} from '@/services/features/product-guides/hooks';

type InstructionDraft = { id?: number; text: string; iconKey: string | null };

export default function CareGuideModal({
  open,
  onOpenChange,
  guideId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guideId?: number | null;
}) {
  const isEdit = Boolean(guideId);

  const { data, isLoading } = useCareGuide(guideId ?? undefined);

  const { data: usage } = useGuideUsage('care-guide', guideId ?? undefined);

  const { saveCareGuide } = useGuideMutations();

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [instructions, setInstructions] = useState<InstructionDraft[]>([
    { text: '', iconKey: null },
  ]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (!guideId) {
      setName('');
      setNotes('');
      setInstructions([{ text: '', iconKey: null }]);

      return;
    }

    if (!data?.data) return;

    setName(data.data.name);
    setNotes(data.data.notes ?? '');
    setInstructions(
      data.data.instructions.map(instruction => ({
        id: instruction.id,
        text: instruction.text,
        iconKey: instruction.iconKey ?? null,
      })),
    );
  }, [open, guideId, data]);

  const dependents = usage?.data;

  const totalProducts = dependents?.totalProducts ?? 0;
  const totalCategories = dependents?.categories.length ?? 0;

  const updateInstruction = (
    index: number,
    patch: Partial<InstructionDraft>,
  ) => {
    setInstructions(previous =>
      previous.map((instruction, position) =>
        position === index ? { ...instruction, ...patch } : instruction,
      ),
    );
  };

  const addInstruction = () => {
    setInstructions(previous => [...previous, { text: '', iconKey: null }]);
  };

  const removeInstruction = (index: number) => {
    setInstructions(previous =>
      previous.filter((_, position) => position !== index),
    );
  };

  const moveInstruction = (index: number, direction: -1 | 1) => {
    setInstructions(previous => {
      const target = index + direction;

      if (target < 0 || target >= previous.length) return previous;

      const next = [...previous];

      [next[index], next[target]] = [next[target], next[index]];

      return next;
    });
  };

  const buildPayload = () => {
    if (!name.trim()) {
      toast.error('نام راهنمای شست‌وشو را وارد کنید.');

      return null;
    }

    const cleaned = instructions
      .map(instruction => ({
        id: instruction.id,
        text: instruction.text.trim(),
        iconKey: instruction.iconKey,
      }))
      .filter(instruction => instruction.text);

    if (!cleaned.length) {
      toast.error('حداقل یک دستور شست‌وشو وارد کنید.');

      return null;
    }

    return {
      name: name.trim(),
      notes: notes.trim() || null,
      instructions: cleaned,
    };
  };

  const submit = async () => {
    const payload = buildPayload();

    if (!payload) return;

    try {
      await saveCareGuide.mutateAsync({ id: guideId ?? undefined, payload });

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
        <DialogContent className="flex max-h-[92vh] max-w-3xl! flex-col gap-4 overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'ویرایش راهنمای شست‌وشو' : 'راهنمای شست‌وشو جدید'}
            </DialogTitle>
          </DialogHeader>

          {isEdit && isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              در حال بارگذاری...
            </div>
          ) : (
            <div className="flex-1 space-y-5 overflow-y-auto pl-1">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">نام راهنما</label>

                <Input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="مثال: شست‌وشوی پیراهن کلاسیک"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">توضیحات (اختیاری)</label>

                <Textarea
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  rows={2}
                />
              </div>

              {isEdit && (totalProducts > 0 || totalCategories > 0) && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                  این راهنما به {totalCategories} دسته و {totalProducts} محصول
                  متصل است؛ تغییرات روی همه آن‌ها اعمال می‌شود و متن‌هایی که
                  برای یک محصول اختصاصی تغییر کرده‌اند حفظ می‌شوند.
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ListChecks className="size-4" />
                    دستورهای شست‌وشو
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addInstruction}
                  >
                    <Plus className="size-4" />
                    افزودن دستور
                  </Button>
                </div>

                {instructions.map((instruction, index) => (
                  <div
                    key={instruction.id ?? `instruction-${index}`}
                    className="space-y-2 rounded-lg border p-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-2.5 w-5 shrink-0 text-center text-xs text-muted-foreground">
                        {index + 1}
                      </span>

                      <Textarea
                        value={instruction.text}
                        onChange={event =>
                          updateInstruction(index, { text: event.target.value })
                        }
                        rows={2}
                        placeholder="مثال: با آب سرد و برنامه ملایم بشویید."
                        className="flex-1"
                      />

                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveInstruction(index, -1)}
                          disabled={index === 0}
                          className="rounded p-1 text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                          aria-label="جابه‌جایی به بالا"
                        >
                          <ArrowUp className="size-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveInstruction(index, 1)}
                          disabled={index === instructions.length - 1}
                          className="rounded p-1 text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                          aria-label="جابه‌جایی به پایین"
                        >
                          <ArrowDown className="size-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeInstruction(index)}
                          className="rounded p-1 text-muted-foreground transition hover:bg-red-50 hover:text-red-500"
                          aria-label="حذف دستور"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pr-7">
                      <div className="mb-1 text-xs text-muted-foreground">
                        علامت شست‌وشو (اختیاری)
                      </div>

                      <CareIconPicker
                        value={instruction.iconKey}
                        onChange={iconKey =>
                          updateInstruction(index, { iconKey })
                        }
                      />
                    </div>
                  </div>
                ))}
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
              loading={saveCareGuide.isPending}
            >
              {isEdit ? 'ذخیره راهنما' : 'ساخت راهنما'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ذخیره تغییرات راهنمای مشترک</AlertDialogTitle>

            <AlertDialogDescription className="leading-7">
              این راهنما به <b>{totalCategories} دسته</b> و{' '}
              <b>{totalProducts} محصول</b> متصل است. تغییر متن دستورها روی همه
              آن‌ها اعمال می‌شود.
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
