'use client';

import { RefreshCcw, Wallet } from 'lucide-react';
import { useState } from 'react';

import CustomPagination from '@/components/shared/custom-pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatPrice, toPersianDateTime } from '@/lib/utils';
import { useWalletTransactions } from '@/services/features/wallet/hooks';
import {
  WALLET_TRANSACTION_TYPES,
  type WalletTransaction,
  type WalletTransactionType,
  walletTransactionTypeLabels,
} from '@/services/features/wallet/type';

const typeBadgeStyles: Record<WalletTransactionType, string> = {
  charge: 'bg-green-100 text-green-700',
  purchase: 'bg-blue-100 text-blue-700',
  refund: 'bg-amber-100 text-amber-700',
  reversal: 'bg-purple-100 text-purple-700',
  adjustment: 'bg-gray-100 text-gray-600',
};

const FILTERS: (WalletTransactionType | '')[] = [
  '',
  ...WALLET_TRANSACTION_TYPES,
];

/**
 * تاریخچه تراکنش‌های کیف پول با فیلتر نوع و صفحه‌بندی
 */
export default function WalletTransactions() {
  const [type, setType] = useState<WalletTransactionType | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } =
    useWalletTransactions({
      page,
      limit: 10,
      type: type || undefined,
    });

  const handleFilterChange = (value: WalletTransactionType | '') => {
    setType(value);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-white p-10 text-center">
        <Wallet className="h-10 w-10 text-gray-300" strokeWidth={1} />
        <p className="text-sm text-gray-500">تاریخچه تراکنش‌ها دریافت نشد</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          loading={isFetching}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  const transactions = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      {/* هدر + فیلتر */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-light tracking-wide">تاریخچه تراکنش‌ها</h2>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(value => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => handleFilterChange(value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition-colors',
                type === value
                  ? 'border-gray-800 bg-gray-800 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400',
              )}
            >
              {value ? walletTransactionTypeLabels[value] : 'همه'}
            </button>
          ))}
        </div>
      </div>

      {/* جدول */}
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <Table dir="rtl">
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="text-sm font-medium">تاریخ</TableHead>
              <TableHead className="text-sm font-medium">شرح</TableHead>
              <TableHead className="text-sm font-medium">نوع</TableHead>
              <TableHead className="text-sm font-medium">مبلغ</TableHead>
              <TableHead className="text-sm font-medium">
                مانده بعد از تراکنش
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-sm text-gray-500"
                >
                  هیچ تراکنشی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              transactions.map(transaction => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* صفحه‌بندی */}
      {pagination && pagination.totalPages > 1 && (
        <div className={cn(isFetching && 'pointer-events-none opacity-60')}>
          <CustomPagination
            totalPages={pagination.totalPages}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

/* ========================================= */
/* ردیف تراکنش */
/* ========================================= */

function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const isCredit = transaction.direction === 'credit';

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-sm text-gray-600">
        {toPersianDateTime(transaction.createdAt)}
      </TableCell>

      <TableCell className="text-sm">
        <p className="font-medium text-gray-800">{transaction.description}</p>
        <p className="mt-0.5 text-xs text-gray-400" dir="ltr">
          {transaction.transactionKey}
        </p>
      </TableCell>

      <TableCell>
        <span
          className={cn(
            'inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
            typeBadgeStyles[transaction.type] ?? typeBadgeStyles.adjustment,
          )}
        >
          {walletTransactionTypeLabels[transaction.type] ?? transaction.type}
        </span>
      </TableCell>

      <TableCell
        className={cn(
          'whitespace-nowrap text-sm font-semibold',
          isCredit ? 'text-green-600' : 'text-gray-900',
        )}
      >
        {isCredit ? '+' : '-'} {formatPrice(transaction.amount)}{' '}
        <span className="text-xs font-normal text-gray-500">تومان</span>
      </TableCell>

      <TableCell className="whitespace-nowrap text-sm text-gray-600">
        {formatPrice(transaction.balanceAfter)}{' '}
        <span className="text-xs text-gray-400">تومان</span>
      </TableCell>
    </TableRow>
  );
}
