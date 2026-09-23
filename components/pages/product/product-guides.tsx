'use client';

import { Ruler, Sparkles } from 'lucide-react';
import Image from 'next/image';

import { CareIcon } from '@/components/shared/care-icon';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ProductGuidesForCustomer } from '@/services/features/product-guides/type';

const toPersianNum = (input: string | number) => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  return String(input).replace(/\d/g, digit => persianDigits[Number(digit)]);
};

/** مقدار خالی به معنی «اندازه وارد نشده» است و به‌صورت خط تیره نمایش داده می‌شود */
const displayValue = (value?: string | null) =>
  value === null || value === undefined || value === ''
    ? '—'
    : toPersianNum(value);

/**
 * جدول سایزبندی مشتری
 *
 * جدول بزرگ داخل محدوده خودش اسکرول می‌شود تا عرض کل صفحه به‌هم نریزد.
 */
export function SizeTable({
  sizeTable,
}: {
  sizeTable: NonNullable<ProductGuidesForCustomer['sizeTable']>;
}) {
  return (
    <div className="space-y-3">
      {sizeTable.notes && (
        <p className="text-xs leading-6 text-muted-foreground">
          {sizeTable.notes}
        </p>
      )}

      <div className="w-full overflow-x-auto overscroll-x-contain rounded-lg border">
        <table className="w-full min-w-max border-collapse text-center text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="sticky right-0 z-1 min-w-32 border-l bg-muted/60 p-2.5 text-right font-medium">
                مشخصه (سانتی‌متر)
              </th>

              {sizeTable.columns.map(column => (
                <th key={column.id} className="min-w-20 p-2.5 font-medium">
                  {toPersianNum(column.label)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sizeTable.rows.map(row => (
              <tr key={row.id} className="border-t">
                <td className="sticky right-0 z-1 border-l bg-background p-2.5 text-right text-muted-foreground">
                  {row.label}
                </td>

                {sizeTable.columns.map(column => {
                  const value = row.values.find(
                    item => item.columnId === column.id,
                  )?.value;

                  return (
                    <td key={column.id} className="p-2.5 tabular-nums">
                      {displayValue(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        واحد اندازه‌گیری: {sizeTable.unit}
      </p>
    </div>
  );
}

export function MeasurementImages({
  measurementGuide,
}: {
  measurementGuide: NonNullable<ProductGuidesForCustomer['measurementGuide']>;
}) {
  const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_URL ?? '';

  return (
    <div className="space-y-3">
      {measurementGuide.notes && (
        <p className="text-xs leading-6 text-muted-foreground">
          {measurementGuide.notes}
        </p>
      )}

      <div className="grid gap-4">
        {measurementGuide.images.map(image => (
          <figure key={image.id} className="space-y-2 w-full">
            <div className="overflow-hidden rounded-lg w-[70%] aspect-square mx-auto relative">
              {}
              <Image
                src={`${imageBaseUrl}${image.file}`}
                alt={image.caption ?? 'روش اندازه‌گیری'}
                fill
                objectFit="cover"
                loading="lazy"
              />
            </div>

            {image.caption && (
              <figcaption className="text-center text-xs text-muted-foreground">
                {image.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

/** راهنمای شست‌وشو برای شیت «نحوه شستشو» */
export function CareGuideView({
  careGuide,
}: {
  careGuide: NonNullable<ProductGuidesForCustomer['careGuide']>;
}) {
  return (
    <div className="space-y-4">
      {careGuide.notes && (
        <p className="text-xs leading-6 text-muted-foreground">
          {careGuide.notes}
        </p>
      )}

      <ul className="space-y-3">
        {careGuide.instructions.map(instruction => (
          <li
            key={instruction.id}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <CareIcon iconKey={instruction.iconKey} />

            <span className="flex-1 text-sm leading-7">{instruction.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * دکمه «راهنمای سایز» صفحه محصول
 *
 * محتوای نمایش‌داده‌شده نتیجه نهایی راهنمای مشترک به‌همراه تغییرات اختصاصی
 * همین محصول است. بخش‌های بدون اطلاعات نمایش داده نمی‌شوند.
 */
export default function ProductGuidesSheet({
  guides,
  className,
}: {
  guides?: ProductGuidesForCustomer | null;
  className?: string;
}) {
  const hasSizeTable = Boolean(guides?.sizeTable);
  const hasMeasurement = Boolean(guides?.measurementGuide?.images.length);
  const hasCare = Boolean(guides?.careGuide);

  console.log(guides);
  if (!hasSizeTable && !hasMeasurement) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" className={cn(className)}>
          راهنمای محصول
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-full! max-w-[560px]! flex-col gap-0"
      >
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-right text-base">
            <Ruler className="size-4" />
            راهنمای محصول
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Tabs defaultValue={hasSizeTable ? 'table' : 'measurement'}>
            <TabsList className="mb-4 bg-muted">
              {hasSizeTable && (
                <TabsTrigger value="table">جدول سایزبندی</TabsTrigger>
              )}

              {hasMeasurement && (
                <TabsTrigger value="measurement">روش اندازه‌گیری</TabsTrigger>
              )}

              {hasCare && (
                <TabsTrigger value="careInstructions">نحوه شستشو</TabsTrigger>
              )}
            </TabsList>

            {hasSizeTable && guides?.sizeTable && (
              <TabsContent value="table">
                <SizeTable sizeTable={guides.sizeTable} />
              </TabsContent>
            )}

            {hasMeasurement && guides?.measurementGuide && (
              <TabsContent value="measurement">
                <MeasurementImages measurementGuide={guides.measurementGuide} />
              </TabsContent>
            )}

            {hasCare && guides?.careGuide && (
              <TabsContent value="careInstructions">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <h2 className="text-base font-semibold">
                      {guides.careGuide.name}
                    </h2>
                    <p className="text-xs leading-6 text-muted-foreground">
                      برای حفظ کیفیت و دوام محصول، دستورهای زیر را رعایت کنید.
                    </p>
                  </div>
                  {/* دستورالعمل‌ها */}
                  {guides.careGuide.instructions?.length > 0 && (
                    <div className="space-y-2.5">
                      {guides.careGuide.instructions.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 rounded-xl border bg-background p-3.5"
                        >
                          {/* شماره */}
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                            {toPersianNum(idx + 1)}
                          </div>
                          {/* متن */}
                          <p className="pt-0.5 text-sm leading-7 text-foreground">
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* نکات */}
                  {guides.careGuide.notes && (
                    <div className="rounded-xl bg-muted/50 p-3.5">
                      <p className="text-xs leading-6 text-muted-foreground">
                        {guides.careGuide.notes}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>

          <p className="mt-6 flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-[11px] leading-6 text-muted-foreground">
            <Sparkles className="size-3.5 shrink-0" />
            این راهنما مخصوص همین محصول است؛ اگر اندازه‌ای وارد نشده باشد با «—»
            نمایش داده می‌شود.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
