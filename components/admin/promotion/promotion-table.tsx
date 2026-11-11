'use client';

import { MoreHorizontal } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { cn } from '@/lib/utils';
import { Promotion } from '@/services/features/promotions/types';

import {
  describeConfiguration,
  formatDate,
  formatNumber,
  PROMOTION_TYPE_LABELS,
  STATUS_CLASSES,
  STATUS_LABELS,
} from './utils';

interface Props {
  promotions: Promotion[];
  onEdit: (promotion: Promotion) => void;
  onToggleStatus: (promotion: Promotion) => void;
  onDelete: (promotion: Promotion) => void;
  onPreview: (promotion: Promotion) => void;
  onRedemptions: (promotion: Promotion) => void;
  busyId?: number | null;
}

export default function PromotionTable({
  promotions,
  onEdit,
  onToggleStatus,
  onDelete,
  onPreview,
  onRedemptions,
  busyId,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>نام</TableHead>
            <TableHead>نوع</TableHead>
            <TableHead>قاعده</TableHead>
            <TableHead>وضعیت</TableHead>
            <TableHead>بازه</TableHead>
            <TableHead>استفاده</TableHead>
            <TableHead className="w-16 text-center">عملیات</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {!promotions.length && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                پروموشنی ثبت نشده است.
              </TableCell>
            </TableRow>
          )}

          {promotions.map((promotion, index) => (
            <TableRow key={promotion.id}>
              <TableCell className="text-center text-xs text-muted-foreground">
                {formatNumber(index + 1)}
              </TableCell>

              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{promotion.name}</span>

                  {promotion.internalDescription && (
                    <span className="line-clamp-1 text-[11px] text-muted-foreground">
                      {promotion.internalDescription}
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell className="text-xs">
                {PROMOTION_TYPE_LABELS[promotion.type]}
              </TableCell>

              <TableCell className="text-xs">
                {describeConfiguration(promotion)}
              </TableCell>

              <TableCell>
                <span
                  className={cn(
                    'inline-block border px-2 py-0.5 text-[11px] font-medium',
                    STATUS_CLASSES[promotion.status],
                  )}
                >
                  {STATUS_LABELS[promotion.status]}
                </span>

                {!promotion.isActive && promotion.status === 'live' && (
                  <span className="ms-1 text-[10px] text-amber-700">(خاموش)</span>
                )}
              </TableCell>

              <TableCell className="text-[11px] leading-5">
                <span className="block">{formatDate(promotion.startsAt)}</span>
                <span className="block text-muted-foreground">
                  تا {formatDate(promotion.expiresAt)}
                </span>
              </TableCell>

              <TableCell className="text-[11px]">
                <span className="block">
                  {formatNumber(promotion.usage?.total ?? 0)}
                  {promotion.maxTotalUses
                    ? ` از ${formatNumber(promotion.maxTotalUses)}`
                    : ''}
                </span>

                {promotion.stackable && (
                  <span className="text-green-700">قابل ترکیب</span>
                )}
              </TableCell>

              <TableCell className="text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label="عملیات"
                    className="inline-flex size-7 items-center justify-center hover:bg-muted"
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(promotion)}>
                      ویرایش
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      disabled={busyId === promotion.id}
                      onClick={() => onToggleStatus(promotion)}
                    >
                      {promotion.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onPreview(promotion)}>
                      پیش‌نمایش
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onRedemptions(promotion)}>
                      سفارش‌های استفاده‌کننده
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(promotion)}
                    >
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
