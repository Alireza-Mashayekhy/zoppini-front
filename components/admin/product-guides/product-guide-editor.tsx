'use client';

import {
  AlertTriangle,
  EyeOff,
  RotateCcw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { ProductSearchSelect } from '@/components/admin/product-search-select';
import { CareIcon } from '@/components/shared/care-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  useCareGuides,
  useMeasurementGuides,
  useProductGuideMutations,
  useProductGuideState,
  useSizeTables,
} from '@/services/features/product-guides/hooks';
import {
  GuideMode,
  GuideType,
  ProductGuideState,
} from '@/services/features/product-guides/type';

const TYPE_LABELS: Record<GuideType, string> = {
  'size-table': 'جدول سایزبندی',
  'care-guide': 'راهنمای شست‌وشو',
  'measurement-guide': 'تصاویر روش اندازه‌گیری',
};

const MODE_LABELS: Record<GuideMode, string> = {
  inherit: 'استفاده از راهنمای دسته محصول',
  custom: 'انتخاب یک راهنمای دیگر برای این محصول',
  hidden: 'عدم نمایش این بخش برای این محصول',
};

const valueOf = (state: ProductGuideState, type: GuideType) => {
  if (type === 'size-table') {
    return {
      mode: state.setting?.sizeTableMode ?? 'inherit',
      guideId: state.setting?.sizeTableId ?? null,
    };
  }

  if (type === 'care-guide') {
    return {
      mode: state.setting?.careGuideMode ?? 'inherit',
      guideId: state.setting?.careGuideId ?? null,
    };
  }

  return {
    mode: state.setting?.measurementGuideMode ?? 'inherit',
    guideId: state.setting?.measurementGuideId ?? null,
  };
};

/**
 * راهنمای یک محصول
 *
 * برای هر یک از سه بخش، انتخاب بین «راهنمای دسته»، «راهنمای دیگر» و «عدم نمایش»
 * وجود دارد و جزئیات راهنمای دریافتی هم فقط برای همین محصول قابل تغییر است.
 * موارد تغییرکرده با «اختصاصی این محصول» مشخص می‌شوند و دکمه «بازگشت به راهنمای
 * اصلی» آن‌ها را به مقدار راهنمای مشترک برمی‌گرداند.
 */
export default function ProductGuideEditor({
  /** اگر مقدار داده شود، این محصول انتخاب‌شده در نظر گرفته می‌شود */
  productId: controlledProductId,
}: {
  productId?: number;
} = {}) {
  const [chosenProductId, setChosenProductId] = useState<number | undefined>(
    undefined,
  );

  const productId = controlledProductId ?? chosenProductId;

  const { data, isLoading } = useProductGuideState(productId);

  const { data: sizeTables } = useSizeTables({ all: true });
  const { data: careGuides } = useCareGuides({ all: true });
  const { data: measurementGuides } = useMeasurementGuides({ all: true });

  const mutations = useProductGuideMutations();

  const [cellDrafts, setCellDrafts] = useState<Record<string, string>>({});
  const [instructionDrafts, setInstructionDrafts] = useState<
    Record<string, string>
  >({});

  const state = data?.data;

  useEffect(() => {
    setCellDrafts({});
    setInstructionDrafts({});
  }, [state?.product.id, state?.overrides.length]);

  if (!productId) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">انتخاب محصول</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <ProductSearchSelect
            value={productId ? String(productId) : ''}
            onValueChange={product =>
              setChosenProductId(product?.id ? Number(product.id) : undefined)
            }
          />

          <p className="text-xs text-muted-foreground leading-6">
            راهنمای هر محصول می‌تواند راهنمای دسته باشد، یا راهنمای دیگری که
            خودتان انتخاب می‌کنید، یا برای آن محصول نمایش داده نشود. جزئیات هر
            راهنما هم برای همین محصول قابل تغییر است و بقیه محصولات تغییری
            نمی‌کنند.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !state) {
    return (
      <div className="rounded-xl border bg-white py-10 text-center text-sm text-muted-foreground">
        در حال بارگذاری راهنمای محصول...
      </div>
    );
  }

  const { resolved, overrides } = state;

  const optionsOf = (type: GuideType) => {
    if (type === 'size-table') return sizeTables?.data ?? [];
    if (type === 'care-guide') return careGuides?.data ?? [];

    return measurementGuides?.data ?? [];
  };

  const overrideOf = (targetKey: string) =>
    overrides.find(override => override.targetKey === targetKey);

  const customizedCount = overrides.length;

  const saveOverride = async (
    guideType: GuideType,
    action: string,
    targetKey: string,
    value?: string | null,
  ) => {
    await mutations.saveOverride.mutateAsync({
      productId,
      payload: { guideType, action, targetKey, value },
    });
  };

  /** برچسب خوانا برای مورد تغییرکرده، بر اساس راهنمای دریافت‌شده */
  const labelOfOverride = (override: {
    guideType: GuideType;
    targetKey: string;
  }) => {
    const rawId = Number(override.targetKey.split(':')[1]);

    if (override.guideType === 'care-guide') {
      const instruction = state?.resolved.careGuide?.instructions.find(
        item => item.id === rawId,
      );

      return instruction?.text || `دستور شست‌وشو #${rawId}`;
    }

    if (override.guideType === 'measurement-guide') {
      const image = state?.resolved.measurementGuide?.images.find(
        item => item.id === rawId,
      );

      return image?.caption || `تصویر #${rawId}`;
    }

    return `مورد #${rawId}`;
  };

  const revert = async (overrideId: number) => {
    await mutations.removeOverride.mutateAsync({ productId, overrideId });
  };

  const setMode = async (type: GuideType, mode: GuideMode) => {
    const payload: Record<string, unknown> = {};

    if (type === 'size-table') {
      payload.sizeTableMode = mode;

      if (mode === 'custom') {
        payload.sizeTableId = valueOf(state, type).guideId ?? null;
      }
    }

    if (type === 'care-guide') {
      payload.careGuideMode = mode;

      if (mode === 'custom') {
        payload.careGuideId = valueOf(state, type).guideId ?? null;
      }
    }

    if (type === 'measurement-guide') {
      payload.measurementGuideMode = mode;

      if (mode === 'custom') {
        payload.measurementGuideId = valueOf(state, type).guideId ?? null;
      }
    }

    await mutations.updateSetting.mutateAsync({ productId, payload });
  };

  const setCustomGuide = async (type: GuideType, guideId: number) => {
    const payload: Record<string, unknown> = {};

    if (type === 'size-table') {
      payload.sizeTableMode = 'custom';
      payload.sizeTableId = guideId;
    }

    if (type === 'care-guide') {
      payload.careGuideMode = 'custom';
      payload.careGuideId = guideId;
    }

    if (type === 'measurement-guide') {
      payload.measurementGuideMode = 'custom';
      payload.measurementGuideId = guideId;
    }

    await mutations.updateSetting.mutateAsync({ productId, payload });
  };

  const renderModeControls = (type: GuideType) => {
    const { mode } = valueOf(state, type);

    return (
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={mode}
          onValueChange={value => void setMode(type, value as GuideMode)}
        >
          <SelectTrigger className="w-full max-w-md bg-white">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {(Object.keys(MODE_LABELS) as GuideMode[]).map(item => (
              <SelectItem key={item} value={item}>
                {MODE_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {mode === 'custom' && (
          <Select
            value={String(valueOf(state, type).guideId ?? '')}
            onValueChange={value => void setCustomGuide(type, Number(value))}
          >
            <SelectTrigger className="w-full max-w-xs bg-white">
              <SelectValue placeholder="انتخاب راهنما..." />
            </SelectTrigger>

            <SelectContent>
              {optionsOf(type).map(option => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  };

  const CustomBadge = ({ show }: { show: boolean }) =>
    show ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#c9a96e]/15 px-2 py-0.5 text-[10px] font-medium text-[#8a6d33]">
        <Sparkles className="size-3" />
        اختصاصی این محصول
      </span>
    ) : null;

  const renderSizeTable = () => {
    if (!resolved.sizeTable) {
      return (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          این بخش برای این محصول نمایش داده نمی‌شود.
        </div>
      );
    }

    const table = resolved.sizeTable;

    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">
          واحد: {table.unit} — {table.name}
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-max text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="min-w-40 p-2 text-right">مشخصه</th>

                {table.columns.map(column => (
                  <th key={column.id} className="min-w-28 p-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{column.label}</span>
                      <CustomBadge show={Boolean(column.overridden)} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {table.rows.map(row => (
                <tr key={row.id} className="border-t">
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{row.label}</span>
                      <CustomBadge show={Boolean(row.overridden)} />
                    </div>
                  </td>

                  {row.values.map(cell => {
                    const targetKey = `cell:${row.id}:${cell.columnId}`;

                    const override = overrideOf(targetKey);

                    const draft = cellDrafts[targetKey] ?? cell.value ?? '';

                    return (
                      <td key={cell.columnId} className="p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            value={draft}
                            inputMode="decimal"
                            onChange={event =>
                              setCellDrafts(previous => ({
                                ...previous,
                                [targetKey]: event.target.value,
                              }))
                            }
                            onBlur={() => {
                              if (draft === (cell.value ?? '')) return;

                              void saveOverride(
                                'size-table',
                                'cell-value',
                                targetKey,
                                draft,
                              );
                            }}
                            className={cn(
                              'h-8 w-20 text-center',
                              cell.overridden &&
                                'border-[#c9a96e] bg-[#c9a96e]/5',
                            )}
                            placeholder="—"
                          />

                          {override && (
                            <button
                              type="button"
                              title="بازگشت به راهنمای اصلی"
                              onClick={() => void revert(override.id)}
                              className="rounded p-1 text-muted-foreground transition hover:bg-muted"
                            >
                              <RotateCcw className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-muted-foreground">
          مقدار هر خانه را تغییر دهید و از کادر بیرون بیایید تا برای همین محصول
          ذخیره شود. مقدار خالی یعنی «اندازه وارد نشده».
        </p>
      </div>
    );
  };

  const renderCareGuide = () => {
    if (!resolved.careGuide) {
      return (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          این بخش برای این محصول نمایش داده نمی‌شود.
        </div>
      );
    }

    const hidden = overrides.filter(
      override =>
        override.guideType === 'care-guide' &&
        override.action === 'hide' &&
        override.targetKey.startsWith('instruction:'),
    );

    return (
      <div className="space-y-3">
        {resolved.careGuide.instructions.map(instruction => {
          const targetKey = `instruction:${instruction.id}`;

          const override = overrideOf(targetKey);

          const draft = instructionDrafts[targetKey] ?? instruction.text;

          return (
            <div
              key={instruction.id}
              className="space-y-2 rounded-lg border p-3"
            >
              <div className="flex items-start gap-2">
                <CareIcon iconKey={instruction.iconKey} />

                <textarea
                  value={draft}
                  rows={2}
                  onChange={event =>
                    setInstructionDrafts(previous => ({
                      ...previous,
                      [targetKey]: event.target.value,
                    }))
                  }
                  onBlur={() => {
                    if (draft === instruction.text) return;

                    void saveOverride(
                      'care-guide',
                      'set-text',
                      targetKey,
                      draft,
                    );
                  }}
                  className={cn(
                    'flex-1 rounded-md border p-2 text-sm',
                    instruction.overridden && 'border-[#c9a96e] bg-[#c9a96e]/5',
                  )}
                />

                <div className="flex flex-col items-end gap-1">
                  <CustomBadge show={Boolean(instruction.overridden)} />

                  <div className="flex items-center gap-1">
                    {override && (
                      <button
                        type="button"
                        title="بازگشت به راهنمای اصلی"
                        onClick={() => void revert(override.id)}
                        className="rounded p-1 text-muted-foreground transition hover:bg-muted"
                      >
                        <RotateCcw className="size-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      title="مخفی‌کردن این دستور برای این محصول"
                      onClick={() =>
                        void saveOverride('care-guide', 'hide', targetKey, null)
                      }
                      className="rounded p-1 text-muted-foreground transition hover:bg-red-50 hover:text-red-500"
                    >
                      <EyeOff className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {Boolean(hidden.length) && (
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <div className="text-xs font-medium text-muted-foreground">
              دستورهای مخفی‌شده برای این محصول
            </div>

            {hidden.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-muted-foreground">
                  {labelOfOverride(item)}
                </span>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void revert(item.id)}
                >
                  نمایش دوباره
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMeasurementGuide = () => {
    if (!resolved.measurementGuide) {
      return (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          این بخش برای این محصول نمایش داده نمی‌شود.
        </div>
      );
    }

    const guide = resolved.measurementGuide;

    const hidden = overrides.filter(
      override =>
        override.guideType === 'measurement-guide' &&
        override.action === 'hide' &&
        override.targetKey.startsWith('image:'),
    );

    return (
      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-3">
          {guide.images.map(image => {
            const targetKey = `image:${image.id}`;

            const override = overrideOf(targetKey);

            return (
              <div key={image.id} className="space-y-2 rounded-lg border p-2">
                <div className="relative aspect-4/3 overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL ?? ''}${image.file}`}
                    alt={image.caption ?? 'روش اندازه‌گیری'}
                    className="size-full object-contain"
                  />
                </div>

                <div className="flex items-center justify-between gap-1">
                  <CustomBadge show={Boolean(image.overridden)} />

                  <div className="flex items-center gap-1">
                    {override && (
                      <button
                        type="button"
                        title="بازگشت به راهنمای اصلی"
                        onClick={() => void revert(override.id)}
                        className="rounded p-1 text-muted-foreground transition hover:bg-muted"
                      >
                        <RotateCcw className="size-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      title="مخفی‌کردن این تصویر برای این محصول"
                      onClick={() =>
                        void saveOverride(
                          'measurement-guide',
                          'hide',
                          targetKey,
                          null,
                        )
                      }
                      className="rounded p-1 text-muted-foreground transition hover:bg-red-50 hover:text-red-500"
                    >
                      <EyeOff className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* تعویض تصویر با تصویر دیگر همین راهنما */}
                {guide.images.length > 1 && (
                  <Select
                    value={String(image.id)}
                    onValueChange={value => {
                      const replacementId = Number(value);

                      if (!replacementId || replacementId === image.id) return;

                      void saveOverride(
                        'measurement-guide',
                        'replace-image',
                        targetKey,
                        String(replacementId),
                      );
                    }}
                  >
                    <SelectTrigger className="h-8 w-full bg-white text-xs">
                      <SelectValue placeholder="تعویض تصویر..." />
                    </SelectTrigger>

                    <SelectContent>
                      {guide.images
                        .filter(item => item.id !== image.id)
                        .map(item => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.caption || `تصویر ${item.id}`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })}
        </div>

        {Boolean(hidden.length) && (
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <div className="text-xs font-medium text-muted-foreground">
              تصاویر مخفی‌شده برای این محصول
            </div>

            {hidden.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-muted-foreground">
                  {labelOfOverride(item)}
                </span>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void revert(item.id)}
                >
                  نمایش دوباره
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* انتخاب محصول */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>محصول: {state.product.title}</span>

            {!controlledProductId && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setChosenProductId(undefined)}
              >
                تغییر محصول
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">دسته‌ها:</span>

            {state.product.categories.map(category => (
              <span
                key={category.id}
                className="rounded-full bg-muted px-3 py-1"
              >
                {category.name}
              </span>
            ))}

            {!state.product.categories.length && (
              <span className="text-muted-foreground">
                این محصول در هیچ دسته‌ای نیست
              </span>
            )}
          </div>

          {/* تعارض‌ها */}
          {Boolean(resolved.conflicts.length) && (
            <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4" />
                تعارض راهنما بین دسته‌های این محصول
              </div>

              {resolved.conflicts.map(conflict => (
                <div key={conflict.type} className="leading-6">
                  {TYPE_LABELS[conflict.type]}: دسته‌ها راهنماهای متفاوتی دارند
                  (
                  {conflict.categories
                    .map(category =>
                      [category.categoryName, `#${category.categoryId}`]
                        .filter(Boolean)
                        .join(' '),
                    )
                    .join(' ، ')}
                  ) — یکی را برای این محصول انتخاب کنید.
                </div>
              ))}
            </div>
          )}

          {/* موارد نیازمند بازبینی */}
          {(resolved.pendingReview.length > 0 ||
            resolved.staleOverrides.length > 0) && (
            <div className="space-y-2 rounded-lg border border-orange-300 bg-orange-50 p-3 text-xs text-orange-900">
              <div className="flex items-center gap-2 font-medium">
                <Wand2 className="size-4" />
                تغییرهای اختصاصی نیازمند بازبینی
              </div>

              {resolved.pendingReview.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 leading-6"
                >
                  <span>
                    {TYPE_LABELS[item.type]} — {item.label}: راهنمای پایه عوض
                    شده و این تغییر روی راهنمای جدید اعمال نشده است.
                  </span>

                  <span className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void mutations.rebaseOverride.mutateAsync({
                          productId,
                          overrideId: item.id,
                        })
                      }
                    >
                      اعمال روی راهنمای جدید
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void mutations.removeOverride.mutateAsync({
                          productId,
                          overrideId: item.id,
                        })
                      }
                    >
                      حذف
                    </Button>
                  </span>
                </div>
              ))}

              {resolved.staleOverrides.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 leading-6"
                >
                  <span>
                    {TYPE_LABELS[item.type]} — {item.label}: در راهنمای فعلی
                    وجود ندارد.
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void mutations.removeOverride.mutateAsync({
                        productId,
                        overrideId: item.id,
                      })
                    }
                  >
                    حذف
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span
              className={cn(
                'rounded-full px-3 py-1',
                customizedCount
                  ? 'bg-[#c9a96e]/15 text-[#8a6d33]'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {customizedCount
                ? `${customizedCount} تغییر اختصاصی برای این محصول`
                : 'این محصول فقط راهنمای مشترک را نشان می‌دهد'}
            </span>

            {customizedCount > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  void mutations.clearOverrides.mutateAsync({ productId })
                }
              >
                <RotateCcw className="size-4" />
                بازگشت همه به راهنمای اصلی
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* سه بخش راهنما */}
      {(['size-table', 'care-guide', 'measurement-guide'] as GuideType[]).map(
        type => (
          <Card key={type} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{TYPE_LABELS[type]}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {renderModeControls(type)}

              {type === 'size-table' && renderSizeTable()}
              {type === 'care-guide' && renderCareGuide()}
              {type === 'measurement-guide' && renderMeasurementGuide()}
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}
