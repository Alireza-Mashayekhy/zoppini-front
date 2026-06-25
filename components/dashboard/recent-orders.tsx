import { cn } from '@/lib/utils';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

const orders = [
  {
    id: 1,
    product: 'کت و شلوار مجلسی',
    price: 12_500_000,
    status: 'ارسال شده',
  },
  {
    id: 2,
    product: 'تی‌شرت مردانه',
    price: 1_200_000,
    status: 'در انتظار پرداخت',
  },
  { id: 3, product: 'شلوار کتان', price: 2_800_000, status: 'تحویل شده' },
  { id: 4, product: 'کفش چرم', price: 4_500_000, status: 'در حال آماده‌سازی' },
];

const statusStyles: Record<string, string> = {
  'ارسال شده': 'text-[#D4A373] bg-[#FBF7F0] border border-[#D4A373]',
  'در انتظار پرداخت': 'text-[#8A8580] bg-[#F5F0EB]',
  'تحویل شده': 'text-[#1A1A1A] bg-[#E8DCCC]',
  'در حال آماده‌سازی': 'text-[#D4A373] bg-[#FBF7F0] border border-[#D4A373]',
};

export function RecentOrders() {
  return (
    <Table dir="rtl">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">آیدی</TableHead>
          <TableHead>قیمت</TableHead>
          <TableHead className="text-left">وضعیت</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((ord: any) => (
          <TableRow key={ord.id}>
            <TableCell className="text-center">{ord.id}</TableCell>
            <TableCell>{ord.price}</TableCell>
            <TableCell align="left">
              <span
                className={cn(
                  'text-xs px-3 py-1 rounded-full',
                  statusStyles[ord.status] || 'text-[#8A8580] bg-[#F5F0EB]',
                )}
              >
                {ord.status}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
