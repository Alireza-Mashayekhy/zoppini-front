'use client';

import { Download, MoreHorizontalIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';

import CustomPagination from '@/components/shared/custom-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import { toPersianDate } from '@/lib/utils';
import {
  useDeleteVisit,
  useVisitStats,
  useVisitsList,
} from '@/services/features/visits/hooks';
import { VisitResponse } from '@/services/features/visits/type';

const PAGE_LABELS: Record<string, string> = {
  'landing-opening': 'لندینگ افتتاحیه',
  gamification: 'گیمیفیکیشن',
};

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'دسکتاپ',
  mobile: 'موبایل',
  tablet: 'تبلت',
  unknown: 'نامشخص',
};

const deviceBadgeClass: Record<string, string> = {
  desktop: 'bg-blue-100 text-blue-800',
  mobile: 'bg-green-100 text-green-800',
  tablet: 'bg-purple-100 text-purple-800',
  unknown: 'bg-gray-100 text-gray-800',
};

export default function VisitsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pageFilter, setPageFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');

  const [selectedVisit, setSelectedVisit] = useState<VisitResponse | null>(
    null,
  );
  const [openModal, setOpenModal] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useVisitsList({
    search: debouncedSearch,
    page,
    pageFilter: pageFilter === 'all' ? undefined : pageFilter,
    deviceType: deviceFilter === 'all' ? undefined : deviceFilter,
  });

  const { data: stats } = useVisitStats();

  const deleteMutation = useDeleteVisit();

  const handleInfo = (visit: VisitResponse) => {
    setSelectedVisit(visit);
    setOpenModal(true);
  };

  const handleDelete = (visit: VisitResponse) => {
    if (confirm('این رکورد بازدید حذف شود؟')) {
      deleteMutation.mutate(visit.id);
    }
  };

  const handleExport = () => {
    if (!data?.data?.length) return;

    const headers = [
      'id',
      'ip',
      'page',
      'path',
      'deviceType',
      'os',
      'browser',
      'screen',
      'language',
      'userId',
      'guestId',
      'referrer',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'createdAt',
    ];

    const rows = data.data.map(visit => [
      visit.id,
      visit.ip ?? '',
      visit.page,
      visit.path ?? '',
      visit.deviceType ?? '',
      visit.os ?? '',
      visit.browser ?? '',
      visit.screen ?? '',
      visit.language ?? '',
      visit.userId ?? '',
      visit.guestId ?? '',
      visit.referrer ?? '',
      visit.utmSource ?? '',
      visit.utmMedium ?? '',
      visit.utmCampaign ?? '',
      visit.createdAt,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row =>
        row
          .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visits-page-${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatIp = (ip: string | null) => ip || '-';

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">کل بازدیدها</div>
          <div className="mt-1 text-3xl font-bold">
            {stats?.data?.total ?? 0}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">بازدید امروز</div>
          <div className="mt-1 text-3xl font-bold">
            {stats?.data?.today ?? 0}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">آی‌پی یکتا</div>
          <div className="mt-1 text-3xl font-bold">
            {stats?.data?.uniqueIps ?? 0}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="جستجو (آی‌پی، مرورگر، OS...)"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-64 bg-white"
          />

          <Select
            value={pageFilter}
            onValueChange={value => {
              setPageFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="همه صفحات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه صفحات</SelectItem>
              <SelectItem value="landing-opening">لندینگ افتتاحیه</SelectItem>
              <SelectItem value="gamification">گیمیفیکیشن</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={deviceFilter}
            onValueChange={value => {
              setDeviceFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36 bg-white">
              <SelectValue placeholder="همه دستگاه‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه دستگاه‌ها</SelectItem>
              <SelectItem value="desktop">دسکتاپ</SelectItem>
              <SelectItem value="mobile">موبایل</SelectItem>
              <SelectItem value="tablet">تبلت</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={handleExport}
          disabled={!data?.data?.length}
          className="bg-white"
        >
          <Download className="size-4" />
          خروجی CSV
        </Button>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">آیدی</TableHead>
              <TableHead>آی‌پی</TableHead>
              <TableHead>صفحه</TableHead>
              <TableHead>دستگاه</TableHead>
              <TableHead>سیستم‌عامل</TableHead>
              <TableHead>مرورگر</TableHead>
              <TableHead>تاریخ ورود</TableHead>
              <TableHead className="w-16 text-center">عملیات</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  در حال بارگذاری...
                </TableCell>
              </TableRow>
            )}

            {data?.data?.map((visit: VisitResponse) => (
              <TableRow key={visit.id}>
                <TableCell className="text-center font-medium">
                  {visit.id}
                </TableCell>

                <TableCell dir="ltr" className="text-right font-mono text-xs">
                  {formatIp(visit.ip)}
                </TableCell>

                <TableCell>
                  {PAGE_LABELS[visit.page] ?? visit.page}
                </TableCell>

                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      deviceBadgeClass[visit.deviceType ?? 'unknown'] ??
                      deviceBadgeClass.unknown
                    }
                  >
                    {DEVICE_LABELS[visit.deviceType ?? 'unknown'] ??
                      visit.deviceType}
                  </Badge>
                </TableCell>

                <TableCell dir="ltr" className="text-right text-xs">
                  {visit.os || '-'}
                </TableCell>

                <TableCell dir="ltr" className="text-right text-xs">
                  {visit.browser || '-'}
                </TableCell>

                <TableCell className="text-xs">
                  {toPersianDate(visit.createdAt)}
                </TableCell>

                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon className="size-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleInfo(visit)}>
                        جزئیات
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleDelete(visit)}
                        className="text-red-600"
                      >
                        <Trash2 className="size-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && !data?.data?.length && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  موردی پیدا نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={8}>
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

      {/* DETAIL MODAL */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-right text-lg">
              جزئیات بازدید #{selectedVisit?.id}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { label: 'آی‌پی', value: selectedVisit?.ip, ltr: true },
              {
                label: 'صفحه',
                value: selectedVisit
                  ? (PAGE_LABELS[selectedVisit.page] ?? selectedVisit.page)
                  : '',
                ltr: false,
              },
              {
                label: 'نوع دستگاه',
                value: selectedVisit
                  ? (DEVICE_LABELS[selectedVisit.deviceType ?? 'unknown'] ??
                    selectedVisit.deviceType)
                  : '',
              },
              {
                label: 'سیستم‌عامل',
                value: selectedVisit?.os,
                ltr: true,
              },
              {
                label: 'مرورگر',
                value: selectedVisit?.browser,
                ltr: true,
              },
              {
                label: 'ابعاد صفحه',
                value: selectedVisit?.screen,
                ltr: true,
              },
              {
                label: 'زبان مرورگر',
                value: selectedVisit?.language,
                ltr: true,
              },
              {
                label: 'شناسه کاربر',
                value: selectedVisit?.userId
                  ? String(selectedVisit.userId)
                  : '-',
                ltr: true,
              },
              {
                label: 'شناسه مهمان',
                value: selectedVisit?.guestId,
                ltr: true,
              },
              {
                label: 'تاریخ ورود',
                value: selectedVisit
                  ? toPersianDate(selectedVisit.createdAt)
                  : '',
                ltr: false,
              },
              {
                label: 'مسیر',
                value: selectedVisit?.path,
                ltr: true,
              },
              {
                label: 'مرجع (Referrer)',
                value: selectedVisit?.referrer || '-',
                ltr: true,
              },
              {
                label: 'UTM Source',
                value: selectedVisit?.utmSource || '-',
                ltr: true,
              },
              {
                label: 'UTM Medium',
                value: selectedVisit?.utmMedium || '-',
                ltr: true,
              },
              {
                label: 'UTM Campaign',
                value: selectedVisit?.utmCampaign || '-',
                ltr: true,
              },
              {
                label: 'User-Agent',
                value: selectedVisit?.userAgent,
                ltr: true,
              },
            ].map(item => (
              <div
                key={item.label}
                className={
                  item.label === 'User-Agent' ? 'col-span-2' : undefined
                }
              >
                <div className="mb-1 text-xs text-muted-foreground">
                  {item.label}
                </div>
                <div
                  dir={item.ltr ? 'ltr' : undefined}
                  className="break-all text-right font-medium"
                  style={{ textAlign: item.ltr ? 'left' : undefined }}
                >
                  {item.value || '-'}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
