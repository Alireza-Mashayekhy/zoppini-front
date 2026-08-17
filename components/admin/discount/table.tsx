'use client';

import { MoreHorizontalIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Discount, DiscountType } from '@/services/features/discounts/types';

interface Props {
  discounts: Discount[];
  onEdit: (discount: Discount) => void;
  onDelete: (discount: Discount) => void;
}

export default function DiscountTable({ discounts, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">#</TableHead>

            <TableHead>کد تخفیف</TableHead>

            <TableHead>نوع</TableHead>

            <TableHead>مقدار</TableHead>

            <TableHead>حداقل سفارش</TableHead>

            <TableHead>سقف تخفیف</TableHead>

            <TableHead>محدوده</TableHead>

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
                {/* ID */}

                <TableCell className="text-center">{discount.id}</TableCell>

                {/* Code */}

                <TableCell>
                  <div className="font-mono font-semibold" dir="ltr">
                    {discount.code}
                  </div>
                </TableCell>

                {/* Type */}

                <TableCell>
                  {discount.type === DiscountType.PERCENTAGE
                    ? 'درصدی'
                    : 'مبلغ ثابت'}
                </TableCell>

                {/* Value */}

                <TableCell>
                  {discount.type === DiscountType.PERCENTAGE
                    ? `${formatNumber(discount.value)}٪`
                    : formatPrice(discount.value)}
                </TableCell>

                {/* Min order */}

                <TableCell>
                  {discount.minOrderAmount != null
                    ? formatPrice(discount.minOrderAmount)
                    : 'بدون محدودیت'}
                </TableCell>

                {/* Max discount */}

                <TableCell>
                  {discount.type === DiscountType.PERCENTAGE &&
                  discount.maxDiscountAmount != null
                    ? formatPrice(discount.maxDiscountAmount)
                    : '---'}
                </TableCell>

                {/* Scope */}

                <TableCell>
                  <Scope
                    usersCount={discount.users?.length ?? 0}
                    productsCount={discount.products?.length ?? 0}
                    categoriesCount={discount.categories?.length ?? 0}
                  />
                </TableCell>

                {/* Date */}

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

                {/* Status */}

                <TableCell>
                  <StatusBadge discount={discount} />
                </TableCell>

                {/* Actions */}

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon className="size-4" />

                        <span className="sr-only">عملیات</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(discount)}>
                        ویرایش
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(discount)}
                      >
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* =========================================================
 * Scope
 * ======================================================= */

function Scope({
  usersCount,
  productsCount,
  categoriesCount,
}: {
  usersCount: number;
  productsCount: number;
  categoriesCount: number;
}) {
  const hasUsers = usersCount > 0;
  const hasProducts = productsCount > 0;
  const hasCategories = categoriesCount > 0;

  if (!hasUsers && !hasProducts && !hasCategories) {
    return <span className="text-sm text-muted-foreground">همه</span>;
  }

  return (
    <div className="space-y-1 text-xs">
      {hasUsers && <div>{usersCount} کاربر</div>}

      {hasProducts && <div>{productsCount} محصول</div>}

      {hasCategories && <div>{categoriesCount} دسته</div>}
    </div>
  );
}

/* =========================================================
 * Status
 * ======================================================= */

function StatusBadge({ discount }: { discount: Discount }) {
  const now = new Date();

  const startsAt = new Date(discount.startsAt);
  const expiresAt = new Date(discount.expiresAt);

  let label = 'فعال';
  let className = 'bg-green-100 text-green-700';

  if (!discount.isActive) {
    label = 'غیرفعال';
    className = 'bg-gray-100 text-gray-600';
  } else if (now < startsAt) {
    label = 'شروع نشده';
    className = 'bg-yellow-100 text-yellow-700';
  } else if (now > expiresAt) {
    label = 'منقضی شده';
    className = 'bg-red-100 text-red-700';
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

/* =========================================================
 * Helpers
 * ======================================================= */

function formatNumber(value: number) {
  return new Intl.NumberFormat('fa-IR').format(Number(value));
}

function formatPrice(value: number) {
  return `${formatNumber(value)} تومان`;
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}
