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

export default function DiscountCodeTable({
  discounts,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">#</TableHead>

            <TableHead>کد تخفیف</TableHead>

            <TableHead>مقدار</TableHead>

            <TableHead>حداقل سفارش</TableHead>

            <TableHead>سقف تخفیف</TableHead>

            <TableHead>استفاده</TableHead>

            <TableHead>محدودیت‌ها</TableHead>

            <TableHead>اعتبار</TableHead>

            <TableHead>وضعیت</TableHead>

            <TableHead className="w-20">عملیات</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {discounts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="h-32 text-center text-muted-foreground"
              >
                کد تخفیفی پیدا نشد
              </TableCell>
            </TableRow>
          ) : (
            discounts.map(discount => (
              <TableRow key={discount.id}>
                <TableCell className="text-center">{discount.id}</TableCell>

                <TableCell>
                  <div className="font-mono font-semibold" dir="ltr">
                    {discount.code}
                  </div>
                </TableCell>

                <TableCell>
                  {discount.type === DiscountType.PERCENTAGE
                    ? `${formatNumber(discount.value)}٪`
                    : formatPrice(discount.value)}
                </TableCell>

                <TableCell>
                  {discount.minOrderAmount != null
                    ? formatPrice(discount.minOrderAmount)
                    : 'بدون محدودیت'}
                </TableCell>

                <TableCell>
                  {discount.type === DiscountType.PERCENTAGE &&
                  discount.maxDiscountAmount != null
                    ? formatPrice(discount.maxDiscountAmount)
                    : '---'}
                </TableCell>

                {/* تعداد استفاده */}

                <TableCell>
                  <div className="space-y-1 text-xs">
                    <div>
                      {formatNumber(discount.usedCount ?? 0)}
                      {discount.maxTotalUses != null
                        ? ` از ${formatNumber(discount.maxTotalUses)}`
                        : ''}{' '}
                      بار
                    </div>

                    <div className="text-muted-foreground">
                      {discount.maxUsesPerUser == null
                        ? 'هر کاربر: نامحدود'
                        : `هر کاربر: ${formatNumber(discount.maxUsesPerUser)} بار`}
                    </div>
                  </div>
                </TableCell>

                {/* محدودیت‌ها */}

                <TableCell>
                  <Restrictions discount={discount} />
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

function Restrictions({ discount }: { discount: Discount }) {
  const items: string[] = [];

  if ((discount.usersCount ?? 0) > 0) {
    items.push(`فقط ${formatNumber(discount.usersCount!)} کاربر`);
  }

  if ((discount.excludedProductsCount ?? 0) > 0) {
    items.push(`${formatNumber(discount.excludedProductsCount!)} محصول مستثنا`);
  }

  if ((discount.excludedCategoriesCount ?? 0) > 0) {
    items.push(
      `${formatNumber(discount.excludedCategoriesCount!)} دسته مستثنا`,
    );
  }

  if (discount.excludeSaleItems) {
    items.push('بدون فروش ویژه');
  }

  if (items.length === 0) {
    return <span className="text-sm text-muted-foreground">ندارد</span>;
  }

  return (
    <div className="space-y-1 text-xs">
      {items.map(item => (
        <div key={item}>{item}</div>
      ))}
    </div>
  );
}
