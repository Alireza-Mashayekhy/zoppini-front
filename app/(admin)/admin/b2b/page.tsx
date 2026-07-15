// app/admin/b2b/page.tsx
'use client';

import { useState } from 'react';

import CustomPagination from '@/components/shared/custom-pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRequestList } from '@/services/features/b2b/hooks';

export default function AdminB2BPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useRequestList({ page, limit: 15 });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-light">درخواست‌های فروش سازمانی</h1>
      <div className="bg-white rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام</TableHead>
              <TableHead>سازمان</TableHead>
              <TableHead>موضوع</TableHead>
              <TableHead>تاریخ</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.fullName}</TableCell>
                <TableCell>{item.companyName}</TableCell>
                <TableCell>{item.subject}</TableCell>
                <TableCell>
                  {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                </TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm">
                    حذف
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6}>
                <CustomPagination
                  totalPages={data?.pagination?.totalPages ?? 1}
                  currentPage={page}
                  onPageChange={setPage}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
