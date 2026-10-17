'use client';

import { ChevronDown, RefreshCcw, Wallet } from 'lucide-react';
import { Fragment, useState } from 'react';

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
import {
  useClubWallets,
  useClubWalletTransactions,
} from '@/services/features/club/hooks';
import {
  ClubWallet,
  pickField,
  rialToToman,
} from '@/services/features/club/type';

/**
 * جدول تراکنش‌های یک کیف پول باشگاه
 * (فیلدهای DTO مستند نشده‌اند؛ مقادیر به‌صورت منعطف خوانده می‌شوند)
 */
function WalletTransactions({ walletId }: { walletId: number }) {
  const { data, isLoading, isError, refetch, isFetching } =
    useClubWalletTransactions(walletId);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm text-gray-500">تراکنش‌ها دریافت نشد</p>
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

  if (transactions.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-gray-500">
        تراکنشی برای این کیف پول ثبت نشده است
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border-t border-border bg-gray-50">
      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            <TableHead>تاریخ</TableHead>
            <TableHead>شرح</TableHead>
            <TableHead className="text-left">مبلغ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map(transaction => {
            const isoDate = pickField<string>(transaction, [
              'Date',
              'CreateDate',
              'TransactionDate',
            ]);

            const persianDate = pickField<string>(transaction, ['PersianDate']);

            const dateLabel = isoDate
              ? toPersianDateTime(isoDate) || isoDate
              : (persianDate ?? '—');

            const description =
              pickField<string>(transaction, [
                'Description',
                'Title',
                'TypeName',
                'TransactionType',
                'Comment',
              ]) ?? '—';

            const amount = pickField<number | string>(transaction, [
              'Amount',
              'Price',
              'Value',
              'Credit',
              'FinalPrice',
            ]);

            return (
              <TableRow key={transaction.Id}>
                <TableCell className="text-xs text-gray-500">
                  {dateLabel}
                </TableCell>
                <TableCell className="text-sm">{description}</TableCell>
                <TableCell className="text-left text-sm">
                  {amount != null
                    ? `${formatPrice(rialToToman(Number(amount) || 0))} تومان`
                    : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * لیست کیف پول‌های کاربر در باشگاه دایاتک
 * با امکان مشاهده تراکنش‌های هر کیف پول
 */
export default function ClubWallets() {
  const [openWalletId, setOpenWalletId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useClubWallets();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-white p-10 text-center">
        <Wallet className="h-10 w-10 text-gray-300" strokeWidth={1} />
        <p className="text-sm text-gray-500">اطلاعات کیف پول‌ها دریافت نشد</p>
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

  const wallets = data.data;

  if (wallets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-10 text-center">
        <Wallet className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1} />
        <p className="mt-3 text-sm text-gray-500">
          هنوز کیف پولی برای شما در باشگاه مشتریان ثبت نشده است
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-light tracking-wide">کیف پول‌های باشگاه</h2>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead>کیف پول</TableHead>
              <TableHead>شعبه</TableHead>
              <TableHead className="text-left">موجودی</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallets.map((wallet: ClubWallet) => (
              <Fragment key={wallet.Id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() =>
                    setOpenWalletId(openWalletId === wallet.Id ? null : wallet.Id)
                  }
                >
                  <TableCell className="text-sm">
                    کیف پول #{wallet.WalletId ?? wallet.Id}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {wallet.OfficeId != null ? `شعبه ${wallet.OfficeId}` : '—'}
                  </TableCell>
                  <TableCell className="text-left text-sm font-medium">
                    {formatPrice(rialToToman(wallet.AvailableCredit))} تومان
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-800"
                    >
                      تراکنش‌ها
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 transition-transform duration-200',
                          openWalletId === wallet.Id && 'rotate-180',
                        )}
                        strokeWidth={1.5}
                      />
                    </button>
                  </TableCell>
                </TableRow>

                {openWalletId === wallet.Id && (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <WalletTransactions walletId={wallet.Id} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
