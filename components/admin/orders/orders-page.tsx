'use client';

import { RefreshCcw } from 'lucide-react';
import { useState } from 'react';

import CustomPagination from '@/components/shared/custom-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { AdminOrder } from '@/services/features/orders/admin.api';
import { useAdminOrders } from '@/services/features/orders/admin.hooks';

import CancelOrderDialog from './cancel-order-dialog';
import OrderDetailsDialog from './order-details-dialog';
import OrdersTable from './orders-table';

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 500);

  const { data, isFetching, refetch } = useAdminOrders({
    page,
    limit: 10,
    search: debouncedSearch,
  });

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openDetails = (order: AdminOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const openCancel = (order: AdminOrder) => {
    setSelectedOrder(order);
    setCancelOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">سفارشات</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت سفارش‌های کاربران
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCcw
            className={`ml-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
          />
          بروزرسانی
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="جستجو بر اساس شماره سفارش، نام یا شماره موبایل"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="w-96 bg-white"
        />
      </div>

      {/* Table */}
      <OrdersTable
        orders={data?.data ?? []}
        onView={openDetails}
        onCancel={openCancel}
      />

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <CustomPagination
          totalPages={data.pagination.totalPages}
          currentPage={page}
          onPageChange={setPage}
        />
      )}

      {/* Details */}
      <OrderDetailsDialog
        order={selectedOrder}
        open={detailsOpen}
        onOpenChange={open => {
          setDetailsOpen(open);

          if (!open) {
            setSelectedOrder(null);
          }
        }}
      />

      {/* Cancel */}
      <CancelOrderDialog
        order={selectedOrder}
        open={cancelOpen}
        onOpenChange={open => {
          setCancelOpen(open);

          if (!open) {
            setSelectedOrder(null);
          }
        }}
      />
    </div>
  );
}
