'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Discount, DiscountType } from '@/services/features/discounts/types';

import DiscountRowActions from './row-actions';
import DiscountStatusBadge from './status-badge';
import { formatDate, formatNumber, formatPrice } from './utils';

interface Props {
  discounts: Discount[];
  onEdit: (discount: Discount) => void;
  onDelete: (discount: Discount) => void;
}

export default function SaleTable({ discounts, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">#</TableHead>

            <TableHead>عنوان</TableHead>

            <TableHead>مقدار تخفیف</TableHead>

            <TableHead>سقف تخفیف</TableHead>

            <TableHead>شامل</TableHead>

            <TableHead>بازه فروش</TableHead>

            <TableHead>وضعیت</TableHead>

            <TableHead className="w-20">عملیات</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {discounts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-32 text-center text-muted-foreground"
              >
                فروش ویژه‌ای پیدا نشد
              </TableCell>
            </TableRow>
          ) : (
            discounts.map(discount => (
              <TableRow key={discount.id}>
                <TableCell className="text-center">{discount.id}</TableCell>

                <TableCell>
                  <div className="font-semibold">
                    {discount.title ||
                      discount.code ||
                      `فروش ویژه ${discount.id}`}
                  </div>
                </TableCell>

                <TableCell>
                  {discount.type === DiscountType.PERCENTAGE
                    ? `${formatNumber(discount.value)}٪`
                    : formatPrice(discount.value)}
                </TableCell>

                <TableCell>
                  {discount.type === DiscountType.PERCENTAGE &&
                  discount.maxDiscountAmount != null
                    ? formatPrice(discount.maxDiscountAmount)
                    : '---'}
                </TableCell>

                <TableCell>
                  <div className="space-y-1 text-xs">
                    {(discount.productsCount ?? 0) > 0 && (
                      <div>{formatNumber(discount.productsCount!)} محصول</div>
                    )}

                    {(discount.categoriesCount ?? 0) > 0 && (
                      <div>
                        {formatNumber(discount.categoriesCount!)} دسته‌بندی
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1 text-xs">
                    <div>
                      از:{' '}
                      <span className="font-medium">
                        {formatDate(discount.startsAt)}
                      </span>
                    </div>

                    <div>
                      تا:{' '}
                      <span className="font-medium">
                        {formatDate(discount.expiresAt)}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <DiscountStatusBadge discount={discount} />
                </TableCell>

                <TableCell>
                  <DiscountRowActions
                    onEdit={() => onEdit(discount)}
                    onDelete={() => onDelete(discount)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
