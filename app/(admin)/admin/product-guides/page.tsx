'use client';

import {
  Archive,
  Copy,
  MoreHorizontalIcon,
  Pencil,
  Plus,
  Search,
} from 'lucide-react';
import { useState } from 'react';

import AssignmentPanel from '@/components/admin/product-guides/assignment-panel';
import CareGuideModal from '@/components/admin/product-guides/care-guide-modal';
import GuideDeleteDialog from '@/components/admin/product-guides/guide-delete-dialog';
import MeasurementGuideModal from '@/components/admin/product-guides/measurement-guide-modal';
import ProductGuideEditor from '@/components/admin/product-guides/product-guide-editor';
import SizeTableModal from '@/components/admin/product-guides/size-table-modal';
import CustomPagination from '@/components/shared/custom-pagination';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/use-debounce';
import { toPersianDate } from '@/lib/utils';
import {
  useCareGuides,
  useGuideMutations,
  useMeasurementGuides,
  useSizeTables,
} from '@/services/features/product-guides/hooks';
import { GuideType } from '@/services/features/product-guides/type';

const PAGE_LIMIT = 10;

/**
 * «راهنمای محصولات»
 *
 * سه قسمت: جدول‌های سایزبندی، راهنماهای شست‌وشو و تصاویر روش اندازه‌گیری.
 * در هر قسمت ساخت، مشاهده، ویرایش، ساخت کپی و حذف/بایگانی وجود دارد؛
 * به‌همراه اختصاص راهنما به دسته‌ها و محصولات و ویرایش راهنمای یک محصول.
 */
export default function ProductGuidesPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    type: GuideType;
    id: number;
    name: string;
  } | null>(null);

  /** صفحه‌بندی و جستجوی هر تب */
  const [sizeQuery, setSizeQuery] = useState({ page: 1, search: '' });
  const [careQuery, setCareQuery] = useState({ page: 1, search: '' });
  const [measurementQuery, setMeasurementQuery] = useState({
    page: 1,
    search: '',
  });

  const debouncedSizeSearch = useDebounce(sizeQuery.search, 500);
  const debouncedCareSearch = useDebounce(careQuery.search, 500);
  const debouncedMeasurementSearch = useDebounce(measurementQuery.search, 500);

  const { data: sizeTables, isLoading: sizeLoading } = useSizeTables({
    page: sizeQuery.page,
    search: debouncedSizeSearch,
    limit: PAGE_LIMIT,
    includeArchived: showArchived,
  });

  const { data: careGuides, isLoading: careLoading } = useCareGuides({
    page: careQuery.page,
    search: debouncedCareSearch,
    limit: PAGE_LIMIT,
    includeArchived: showArchived,
  });

  const { data: measurementGuides, isLoading: measurementLoading } =
    useMeasurementGuides({
      page: measurementQuery.page,
      search: debouncedMeasurementSearch,
      limit: PAGE_LIMIT,
      includeArchived: showArchived,
    });

  const { data: allSizeTables } = useSizeTables({ all: true });
  const { data: allCareGuides } = useCareGuides({ all: true });
  const { data: allMeasurementGuides } = useMeasurementGuides({ all: true });

  const mutations = useGuideMutations();

  /** مودال‌های ویرایش */
  const [sizeTableModal, setSizeTableModal] = useState<{
    open: boolean;
    id?: number | null;
  }>({ open: false });

  const [careModal, setCareModal] = useState<{
    open: boolean;
    id?: number | null;
  }>({ open: false });

  const [measurementModal, setMeasurementModal] = useState<{
    open: boolean;
    id?: number | null;
  }>({ open: false });

  const deleteOptions = (type: GuideType) => {
    if (type === 'size-table') return allSizeTables?.data ?? [];
    if (type === 'care-guide') return allCareGuides?.data ?? [];

    return allMeasurementGuides?.data ?? [];
  };

  const confirmArchive = async (type: GuideType, id: number) => {
    if (type === 'size-table') {
      await mutations.archiveSizeTable.mutateAsync({ id, isArchived: true });

      return;
    }

    if (type === 'care-guide') {
      await mutations.archiveCareGuide.mutateAsync({ id, isArchived: true });

      return;
    }

    await mutations.archiveMeasurementGuide.mutateAsync({
      id,
      isArchived: true,
    });
  };

  const confirmDuplicate = async (type: GuideType, id: number) => {
    if (type === 'size-table') {
      await mutations.duplicateSizeTable.mutateAsync({ id });

      return;
    }

    if (type === 'care-guide') {
      await mutations.duplicateCareGuide.mutateAsync({ id });

      return;
    }

    await mutations.duplicateMeasurementGuide.mutateAsync({ id });
  };

  const rowActions = (type: GuideType, id: number, name: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontalIcon className="size-4" />
          <span className="sr-only">عملیات</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            if (type === 'size-table') setSizeTableModal({ open: true, id });

            if (type === 'care-guide') setCareModal({ open: true, id });

            if (type === 'measurement-guide') {
              setMeasurementModal({ open: true, id });
            }
          }}
        >
          <Pencil className="size-4" />
          ویرایش
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => void confirmDuplicate(type, id)}>
          <Copy className="size-4" />
          ساخت کپی
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => void confirmArchive(type, id)}>
          <Archive className="size-4" />
          بایگانی
        </DropdownMenuItem>

        <DropdownMenuItem
          variant="destructive"
          onClick={() => setPendingDelete({ type, id, name })}
        >
          حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const emptyRow = (colSpan: number) => (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-28 text-center text-muted-foreground"
      >
        موردی پیدا نشد
      </TableCell>
    </TableRow>
  );

  const tableFooter = (
    totalPages: number,
    page: number,
    onPageChange: (page: number) => void,
  ) => (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={5}>
          <CustomPagination
            totalPages={totalPages}
            currentPage={page}
            onPageChange={onPageChange}
          />
        </TableCell>
      </TableRow>
    </TableFooter>
  );

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <Tabs defaultValue="size-tables" className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="bg-white">
            <TabsTrigger value="size-tables">جدول‌های سایزبندی</TabsTrigger>
            <TabsTrigger value="care-guides">راهنماهای شست‌وشو</TabsTrigger>
            <TabsTrigger value="measurement-guides">
              تصاویر روش اندازه‌گیری
            </TabsTrigger>
            <TabsTrigger value="assignments">
              اختصاص به دسته و محصول
            </TabsTrigger>
            <TabsTrigger value="product">راهنمای محصول</TabsTrigger>
          </TabsList>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={event => setShowArchived(event.target.checked)}
            />
            نمایش موارد بایگانی‌شده
          </label>
        </div>

        {/* ==================== جدول‌های سایزبندی ==================== */}

        <TabsContent value="size-tables" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder="جستجوی جدول..."
                value={sizeQuery.search}
                onChange={event => {
                  setSizeQuery({ page: 1, search: event.target.value });
                }}
                className="bg-white pr-9"
              />
            </div>

            <Button onClick={() => setSizeTableModal({ open: true, id: null })}>
              <Plus className="size-4" />
              جدول سایزبندی جدید
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام جدول</TableHead>
                  <TableHead className="w-28 text-center">واحد</TableHead>
                  <TableHead className="w-24 text-center">سایزها</TableHead>
                  <TableHead className="w-28 text-center">مشخصه‌ها</TableHead>
                  <TableHead className="w-32 text-center">
                    آخرین ویرایش
                  </TableHead>
                  <TableHead className="w-16 text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sizeLoading && emptyRow(6)}

                {!sizeLoading &&
                  sizeTables?.data?.map(table => (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {table.name}

                          {table.isArchived && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              بایگانی
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        {table.unit}
                      </TableCell>
                      <TableCell className="text-center">
                        {table.columnCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {table.rowCount}
                      </TableCell>

                      <TableCell className="text-center text-xs text-muted-foreground">
                        {toPersianDate(table.updatedAt)}
                      </TableCell>

                      <TableCell className="text-center">
                        {rowActions('size-table', table.id, table.name)}
                      </TableCell>
                    </TableRow>
                  ))}

                {!sizeLoading && !sizeTables?.data?.length && emptyRow(6)}
              </TableBody>

              {tableFooter(
                sizeTables?.pagination?.totalPages ?? 1,
                sizeQuery.page,
                page => setSizeQuery(previous => ({ ...previous, page })),
              )}
            </Table>
          </div>
        </TabsContent>

        {/* ==================== راهنماهای شست‌وشو ==================== */}

        <TabsContent value="care-guides" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder="جستجوی راهنما..."
                value={careQuery.search}
                onChange={event => {
                  setCareQuery({ page: 1, search: event.target.value });
                }}
                className="bg-white pr-9"
              />
            </div>

            <Button onClick={() => setCareModal({ open: true, id: null })}>
              <Plus className="size-4" />
              راهنمای شست‌وشو جدید
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام راهنما</TableHead>
                  <TableHead className="w-32 text-center">
                    تعداد دستورها
                  </TableHead>
                  <TableHead className="w-32 text-center">
                    آخرین ویرایش
                  </TableHead>
                  <TableHead className="w-16 text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {careLoading && emptyRow(4)}

                {!careLoading &&
                  careGuides?.data?.map(guide => (
                    <TableRow key={guide.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {guide.name}

                          {guide.isArchived && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              بایگانی
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        {guide.instructionCount}
                      </TableCell>

                      <TableCell className="text-center text-xs text-muted-foreground">
                        {toPersianDate(guide.updatedAt)}
                      </TableCell>

                      <TableCell className="text-center">
                        {rowActions('care-guide', guide.id, guide.name)}
                      </TableCell>
                    </TableRow>
                  ))}

                {!careLoading && !careGuides?.data?.length && emptyRow(4)}
              </TableBody>

              {tableFooter(
                careGuides?.pagination?.totalPages ?? 1,
                careQuery.page,
                page => setCareQuery(previous => ({ ...previous, page })),
              )}
            </Table>
          </div>
        </TabsContent>

        {/* ==================== تصاویر روش اندازه‌گیری ==================== */}

        <TabsContent value="measurement-guides" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder="جستجوی راهنما..."
                value={measurementQuery.search}
                onChange={event => {
                  setMeasurementQuery({ page: 1, search: event.target.value });
                }}
                className="bg-white pr-9"
              />
            </div>

            <Button
              onClick={() => setMeasurementModal({ open: true, id: null })}
            >
              <Plus className="size-4" />
              تصاویر جدید
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام راهنما</TableHead>
                  <TableHead className="w-28 text-center">
                    تعداد تصاویر
                  </TableHead>
                  <TableHead className="w-32 text-center">
                    آخرین ویرایش
                  </TableHead>
                  <TableHead className="w-16 text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {measurementLoading && emptyRow(4)}

                {!measurementLoading &&
                  measurementGuides?.data?.map(guide => (
                    <TableRow key={guide.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {guide.name}

                          {guide.isArchived && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              بایگانی
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        {guide.imageCount}
                      </TableCell>

                      <TableCell className="text-center text-xs text-muted-foreground">
                        {toPersianDate(guide.updatedAt)}
                      </TableCell>

                      <TableCell className="text-center">
                        {rowActions('measurement-guide', guide.id, guide.name)}
                      </TableCell>
                    </TableRow>
                  ))}

                {!measurementLoading &&
                  !measurementGuides?.data?.length &&
                  emptyRow(4)}
              </TableBody>

              {tableFooter(
                measurementGuides?.pagination?.totalPages ?? 1,
                measurementQuery.page,
                page =>
                  setMeasurementQuery(previous => ({ ...previous, page })),
              )}
            </Table>
          </div>
        </TabsContent>

        {/* ==================== اختصاص ==================== */}

        <TabsContent value="assignments" className="mt-4">
          <AssignmentPanel />
        </TabsContent>

        {/* ==================== راهنمای محصول ==================== */}

        <TabsContent value="product" className="mt-4">
          <ProductGuideEditor />
        </TabsContent>
      </Tabs>

      {/* مودال‌ها */}
      <SizeTableModal
        open={sizeTableModal.open}
        onOpenChange={open =>
          setSizeTableModal(previous => ({ ...previous, open }))
        }
        tableId={sizeTableModal.id}
      />

      <CareGuideModal
        open={careModal.open}
        onOpenChange={open => setCareModal(previous => ({ ...previous, open }))}
        guideId={careModal.id}
      />

      <MeasurementGuideModal
        open={measurementModal.open}
        onOpenChange={open =>
          setMeasurementModal(previous => ({ ...previous, open }))
        }
        guideId={measurementModal.id}
      />

      <GuideDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={open => !open && setPendingDelete(null)}
        type={pendingDelete?.type ?? 'size-table'}
        guide={
          pendingDelete
            ? { id: pendingDelete.id, name: pendingDelete.name }
            : null
        }
        options={deleteOptions(pendingDelete?.type ?? 'size-table')}
      />
    </div>
  );
}
