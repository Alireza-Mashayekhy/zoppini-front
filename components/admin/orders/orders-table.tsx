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
import { AdminOrder, OrderStatus } from '@/services/features/orders/admin.api';

interface Props {
  orders: AdminOrder[];
  onView: (order: AdminOrder) => void;
  onCancel: (order: AdminOrder) => void;
}

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'در انتظار',
  [OrderStatus.PAID]: 'پرداخت شده',
  [OrderStatus.SHIPPED]: 'ارسال شده',
  [OrderStatus.DELIVERED]: 'تحویل شده',
  [OrderStatus.CANCELLED]: 'لغو شده',
};

function formatPrice(value: number | string) {
  return `${new Intl.NumberFormat('fa-IR').format(Number(value))} تومان`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export default function OrdersTable({ orders, onView, onCancel }: Props) {
  return (
    <div className="bg-white rounded-sm overflow-hidden">
      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">آیدی</TableHead>
            <TableHead>شماره سفارش</TableHead>
            <TableHead>مشتری</TableHead>
            <TableHead>مبلغ نهایی</TableHead>
            <TableHead>روش ارسال</TableHead>
            <TableHead>وضعیت</TableHead>
            <TableHead>تاریخ</TableHead>
            <TableHead>عملیات</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-32 text-center text-muted-foreground"
              >
                سفارشی پیدا نشد
              </TableCell>
            </TableRow>
          ) : (
            orders.map(order => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>

                <TableCell>{order.orderNumber || `#${order.id}`}</TableCell>

                <TableCell>
                  <div>
                    <div className="font-medium">
                      {order.user?.fullName?.trim() || '---'}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {order.user?.phone || order.phone || '---'}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="font-medium">
                  {formatPrice(order.finalPrice)}
                </TableCell>

                <TableCell>{order.shippingMethod || '---'}</TableCell>

                <TableCell>
                  <span className="text-sm">
                    {statusLabels[order.status] || order.status}
                  </span>
                </TableCell>

                <TableCell>{formatDate(order.createdAt)}</TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon />
                        <span className="sr-only">باز کردن منو</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(order)}>
                        مشاهده جزئیات
                      </DropdownMenuItem>

                      {order.status !== OrderStatus.CANCELLED && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onCancel(order)}
                        >
                          لغو سفارش
                        </DropdownMenuItem>
                      )}
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
