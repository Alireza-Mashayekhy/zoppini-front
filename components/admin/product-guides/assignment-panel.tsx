'use client';

import { AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ProductMultiSelect } from '@/components/admin/product-multi-select';
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
import { useAdminCategoriesList } from '@/services/features/categories/hooks';
import {
  useApplyAssignment,
  useAssignmentPreview,
} from '@/services/features/product-guides/hooks';
import {
  useCareGuides,
  useMeasurementGuides,
  useSizeTables,
} from '@/services/features/product-guides/hooks';
import { GuideType } from '@/services/features/product-guides/type';

const NO_CHANGE = 'no-change';
const CLEAR = 'clear';

const TYPE_LABELS: Record<GuideType, string> = {
  'size-table': 'جدول سایزبندی',
  'care-guide': 'راهنمای شست‌وشو',
  'measurement-guide': 'تصاویر روش اندازه‌گیری',
};

export default function AssignmentPanel() {
  const [search, setSearch] = useState('');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);

  const [sizeTableId, setSizeTableId] = useState<string>(NO_CHANGE);
  const [careGuideId, setCareGuideId] = useState<string>(NO_CHANGE);
  const [measurementGuideId, setMeasurementGuideId] =
    useState<string>(NO_CHANGE);

  const { data: categoriesData } = useAdminCategoriesList({ all: true });
  const { data: sizeTables } = useSizeTables({ all: true });
  const { data: careGuides } = useCareGuides({ all: true });
  const { data: measurementGuides } = useMeasurementGuides({ all: true });

  const previewMutation = useAssignmentPreview();
  const applyMutation = useApplyAssignment();

  const categories = useMemo(() => {
    const items = categoriesData?.data ?? [];

    if (!search.trim()) return items;

    return items.filter(category =>
      category.name.toLowerCase().includes(search.trim().toLowerCase()),
    );
  }, [categoriesData, search]);

  const hasSelection = categoryIds.length > 0 || productIds.length > 0;

  const hasGuideSelection = [sizeTableId, careGuideId, measurementGuideId].some(
    value => value !== NO_CHANGE,
  );

  const buildPayload = () => {
    const parse = (value: string) =>
      value === NO_CHANGE ? undefined : value === CLEAR ? null : Number(value);

    return {
      categoryIds,
      productIds: productIds.map(Number),
      sizeTableId: parse(sizeTableId),
      careGuideId: parse(careGuideId),
      measurementGuideId: parse(measurementGuideId),
    };
  };

  const runPreview = async () => {
    if (!hasSelection) {
      toast.error('حداقل یک دسته یا یک محصول انتخاب کنید.');

      return;
    }

    if (!hasGuideSelection) {
      toast.error('حداقل برای یکی از بخش‌ها راهنما انتخاب کنید.');

      return;
    }

    try {
      await previewMutation.mutateAsync(buildPayload());
    } catch {
      /** پیام خطا در هوک نمایش داده می‌شود */
    }
  };

  const apply = async () => {
    try {
      await applyMutation.mutateAsync(buildPayload());

      previewMutation.reset();
    } catch {
      /** پیام خطا در هوک نمایش داده می‌شود */
    }
  };

  const preview = previewMutation.data?.data;

  const guideSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: { id: number; name: string }[],
  ) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-white">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value={NO_CHANGE}>بدون تغییر</SelectItem>
          <SelectItem value={CLEAR}>پاک‌کردن راهنمای این بخش</SelectItem>

          {options.map(option => (
            <SelectItem key={option.id} value={String(option.id)}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* انتخاب دسته‌ها */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">۱. انتخاب دسته‌های کالا</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <Input
            placeholder="جستجوی دسته..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="bg-white"
          />

          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border bg-white p-2">
            {categories.map(category => {
              const checked = categoryIds.includes(category.id);

              return (
                <label
                  key={category.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition',
                    checked ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setCategoryIds(previous =>
                        checked
                          ? previous.filter(id => id !== category.id)
                          : [...previous, category.id],
                      )
                    }
                  />

                  <span className="flex-1">{category.name}</span>
                </label>
              );
            })}

            {!categories.length && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                دسته‌ای پیدا نشد
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            محصولاتی که بعداً به این دسته‌ها اضافه شوند هم خودکار همین راهنما را
            دریافت می‌کنند.
          </p>
        </CardContent>
      </Card>

      {/* انتخاب محصولات */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            ۲. انتخاب چند محصول (اختیاری)
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <ProductMultiSelect
            value={productIds}
            onValueChange={setProductIds}
          />

          <p className="text-xs text-muted-foreground leading-6">
            انتخاب مستقیم در محصول بر راهنمای دسته اولویت دارد؛ اگر بعداً
            بخواهید محصول دوباره از دسته تبعیت کند، گزینه «پاک‌کردن» را انتخاب
            کنید.
          </p>

          {/* انتخاب راهنماها */}
          <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-1">
            {guideSelect(
              TYPE_LABELS['size-table'],
              sizeTableId,
              setSizeTableId,
              sizeTables?.data ?? [],
            )}

            {guideSelect(
              TYPE_LABELS['care-guide'],
              careGuideId,
              setCareGuideId,
              careGuides?.data ?? [],
            )}

            {guideSelect(
              TYPE_LABELS['measurement-guide'],
              measurementGuideId,
              setMeasurementGuideId,
              measurementGuides?.data ?? [],
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              onClick={runPreview}
              loading={previewMutation.isPending}
            >
              <Users className="size-4" />
              پیش‌نمایش تغییرات
            </Button>

            {preview && (
              <Button
                type="button"
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={apply}
                loading={applyMutation.isPending}
              >
                <CheckCircle2 className="size-4" />
                اعمال تغییرات
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* نتیجه پیش‌نمایش */}
      {preview && (
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">نتیجه پیش‌نمایش</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-white p-3">
                <div className="text-xs text-muted-foreground">
                  دسته‌های انتخاب‌شده
                </div>

                <div className="mt-1 text-xl font-bold">
                  {preview.selectedCategoryCount}
                </div>
              </div>

              <div className="rounded-lg border bg-white p-3">
                <div className="text-xs text-muted-foreground">
                  محصولات انتخاب‌شده
                </div>

                <div className="mt-1 text-xl font-bold">
                  {preview.selectedProductCount}
                </div>
              </div>

              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <div className="text-xs text-muted-foreground">
                  کل محصولات مشمول
                </div>

                <div className="mt-1 text-xl font-bold text-primary">
                  {preview.affectedProductCount}
                </div>
              </div>
            </div>

            {Boolean(preview.categories.length) && (
              <div className="space-y-2">
                <div className="font-medium">دسته‌های انتخاب‌شده:</div>

                <div className="flex flex-wrap gap-2">
                  {preview.categories.map(category => (
                    <span
                      key={category.id}
                      className="rounded-full bg-muted px-3 py-1 text-xs"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Boolean(preview.affectedProducts.length) && (
              <div className="space-y-2">
                <div className="font-medium">
                  محصولات مشمول ({preview.affectedProductCount}):
                </div>

                <div className="max-h-40 overflow-y-auto rounded-lg border bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2 text-right">محصول</th>
                        <th className="p-2 text-center">تعداد دسته</th>
                        <th className="p-2 text-center">تغییر اختصاصی</th>
                      </tr>
                    </thead>

                    <tbody>
                      {preview.affectedProducts.map(product => (
                        <tr key={product.id} className="border-t">
                          <td className="p-2">{product.title}</td>
                          <td className="p-2 text-center">
                            {product.categoryCount}
                          </td>
                          <td className="p-2 text-center">
                            {product.overrideCount || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {Boolean(preview.conflicts.length) && (
              <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="size-4" />
                  تعارض راهنما در {preview.conflicts.length} مورد
                </div>

                <p className="text-xs leading-6">
                  این محصولات عضو چند دسته با راهنماهای متفاوت هستند؛ سیستم
                  تصادفی یکی را انتخاب نمی‌کند. برای هر محصول، راهنمای درست را
                  در بخش «راهنمای محصول» انتخاب کنید.
                </p>

                <div className="space-y-1 text-xs">
                  {preview.conflicts.slice(0, 10).map(conflict => (
                    <div key={`${conflict.productId}-${conflict.type}`}>
                      {conflict.productTitle} — {TYPE_LABELS[conflict.type]} (
                      {conflict.categories
                        .map(category => category.name)
                        .join(' ، ')}
                      )
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Boolean(preview.explicitChoices.length) && (
              <p className="text-xs text-muted-foreground leading-6">
                {preview.explicitChoices.length} مورد انتخاب مستقیم برای محصول
                وجود دارد که بر راهنمای دسته اولویت دارد و با این تغییر عوض
                نمی‌شود.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
