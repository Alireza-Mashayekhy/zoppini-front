'use client';

import { ExternalLink, MoreHorizontalIcon, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import CustomPagination from '@/components/shared/custom-pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
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
import { useDebounce } from '@/hooks/use-debounce';
import {
  useAdminPageSeoList,
  useDeletePageSeo,
} from '@/services/features/seo/hooks';
import { PageSeoResponse } from '@/services/features/seo/types';

import PageSeoModal from './page-seo-modal';

export default function PageSeoList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedPage, setSelectedPage] = useState<PageSeoResponse | null>(
    null,
  );
  const [openModal, setOpenModal] = useState(false);
  const [isDeleteModal, setDeleteModal] = useState(false);
  const [deletePageId, setDeletePageId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(search, 500);
  const deleteMutation = useDeletePageSeo();

  const { data, isLoading } = useAdminPageSeoList({
    search: debouncedSearch,
    limit: 15,
    page,
  });

  const handleEdit = (pageSeo: PageSeoResponse) => {
    setSelectedPage(pageSeo);
    setOpenModal(true);
  };

  const handleDelete = async () => {
    if (!deletePageId) return;

    try {
      await deleteMutation.mutateAsync(deletePageId);
      toast.success('صفحه حذف شد');
      setDeleteModal(false);
      setDeletePageId(null);
    } catch {
      toast.error('حذف صفحه ناموفق بود');
    }
  };

  const pages = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Button
          variant="dark"
          size="lg"
          onClick={() => {
            setSelectedPage(null);
            setOpenModal(true);
          }}
        >
          <Plus className="size-4" />
          افزودن صفحه
        </Button>

        <Input
          placeholder="جستجو بر اساس نام یا مسیر صفحه"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="bg-white w-96"
        />
      </div>

      <div className="bg-white rounded-sm overflow-hidden">
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">آیدی</TableHead>
              <TableHead>صفحه</TableHead>
              <TableHead>متا تایتل</TableHead>
              <TableHead>متا دیسکریپشن</TableHead>
              <TableHead>دستور ربات‌ها</TableHead>
              <TableHead>ریدایرکت</TableHead>
              <TableHead>افزودن دستی به sitemap</TableHead>
              <TableHead>آخرین ویرایش</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pages.map(pageSeo => (
              <TableRow key={pageSeo.id}>
                <TableCell className="text-center">{pageSeo.id}</TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span>{pageSeo.label || pageSeo.path}</span>
                    <Link
                      href={pageSeo.path}
                      target="_blank"
                      dir="ltr"
                      className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      {pageSeo.path}
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                </TableCell>

                <TableCell className="max-w-xs">
                  <span className="line-clamp-2 text-sm">
                    {pageSeo.metaTitle || (
                      <span className="text-muted-foreground">
                        — (پیش‌فرض صفحه)
                      </span>
                    )}
                  </span>
                </TableCell>

                <TableCell className="max-w-xs">
                  <span className="line-clamp-2 text-sm">
                    {pageSeo.metaDescription || (
                      <span className="text-muted-foreground">
                        — (پیش‌فرض صفحه)
                      </span>
                    )}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={pageSeo.indexable ? 'default' : 'destructive'}>
                      {pageSeo.indexable ? 'index' : 'noindex'}
                    </Badge>
                    <Badge variant={pageSeo.followable ? 'secondary' : 'outline'}>
                      {pageSeo.followable ? 'follow' : 'nofollow'}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell className="max-w-48">
                  {pageSeo.redirectTo ? (
                    <span dir="ltr" className="block truncate text-xs text-amber-700">
                      {pageSeo.redirectTo}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell>
                  {pageSeo.includeInPageSitemap ? (
                    <Badge variant="secondary">در page-sitemap.xml</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {new Date(pageSeo.updatedAt).toLocaleDateString('fa-IR')}
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(pageSeo)}>
                        ویرایش تنظیمات
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setDeletePageId(pageSeo.id);
                          setDeleteModal(true);
                        }}
                      >
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={9}>
                {isLoading ? (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    در حال بارگذاری...
                  </p>
                ) : pages.length === 0 ? (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    صفحه‌ای یافت نشد
                  </p>
                ) : (
                  <CustomPagination
                    totalPages={data?.pagination?.totalPages ?? 1}
                    currentPage={page}
                    onPageChange={setPage}
                  />
                )}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <PageSeoModal
        key={selectedPage?.id ?? 'new-page-seo'}
        selectedData={selectedPage}
        open={openModal}
        onOpenChange={open => {
          setOpenModal(open);
          if (!open) setSelectedPage(null);
        }}
      />

      <AlertDialog open={isDeleteModal} onOpenChange={setDeleteModal}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              آیا از حذف متای این صفحه مطمئنید؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              پس از حذف، متای پیش‌فرض خود صفحه نمایش داده می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
