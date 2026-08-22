'use client';

import { MoreHorizontalIcon, Plus } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

import CatalogPageModal from '@/components/admin/catalog/page-modal';
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
import {
  useAdminCatalogPages,
  useDeleteCatalogPage,
} from '@/services/features/catalog/hooks';
import { CatalogPageResponse } from '@/services/features/catalog/types';

export default function CatalogAdminPage() {
  const [openModal, setOpenModal] = useState(false);

  const [selectedPage, setSelectedPage] = useState<CatalogPageResponse | null>(
    null,
  );

  const [isDeleteModal, setDeleteModal] = useState(false);

  const [deletePageId, setDeletePageId] = useState<string | null>(null);

  const { data, isLoading } = useAdminCatalogPages();

  const deleteMutation = useDeleteCatalogPage();

  const pages = data;

  const handleAdd = () => {
    setSelectedPage(null);
    setOpenModal(true);
  };

  const handleEdit = (page: CatalogPageResponse) => {
    setSelectedPage(page);
    setOpenModal(true);
  };

  const handleDelete = async () => {
    if (!deletePageId) return;

    try {
      await deleteMutation.mutateAsync(deletePageId);

      toast.success('صفحه کاتالوگ با موفقیت حذف شد.');

      setDeleteModal(false);
      setDeletePageId(null);
    } catch (error) {
      console.error(error);

      toast.error('حذف صفحه کاتالوگ با خطا مواجه شد.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div dir="rtl" className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">کاتالوگ</h1>

          <p className="text-sm text-muted-foreground">مدیریت صفحات کاتالوگ</p>
        </div>

        <Button onClick={handleAdd}>
          <Plus />
          افزودن صفحه
        </Button>
      </div>

      {/* Create / Edit Modal */}
      <CatalogPageModal
        open={openModal}
        selectedData={selectedPage}
        onOpenChange={open => {
          setOpenModal(open);

          if (!open) {
            setSelectedPage(null);
          }
        }}
      />

      {/* Table */}
      <div className="overflow-hidden rounded-sm bg-white">
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">صفحه</TableHead>

              <TableHead>تصویر</TableHead>

              <TableHead>نام فایل</TableHead>

              <TableHead className="w-20">عملیات</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  در حال دریافت صفحات...
                </TableCell>
              </TableRow>
            ) : pages?.data?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-muted-foreground"
                >
                  هنوز صفحه‌ای برای کاتالوگ وجود ندارد.
                </TableCell>
              </TableRow>
            ) : (
              pages?.data?.map(page => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">
                    {page.pageNumber}
                  </TableCell>

                  <TableCell>
                    <div className="relative size-14 overflow-hidden rounded-md border bg-muted">
                      <Image
                        src={process.env.NEXT_PUBLIC_IMAGE_URL + page.image}
                        fill
                        sizes="56px"
                        className="object-cover"
                        alt={`صفحه ${page.pageNumber}`}
                      />
                    </div>
                  </TableCell>

                  <TableCell>{page.image.split('/').pop()}</TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontalIcon />

                          <span className="sr-only">باز کردن منو</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(page)}>
                          ویرایش
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setDeletePageId(page.id);

                            setDeleteModal(true);
                          }}
                        >
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={isDeleteModal}
        onOpenChange={open => {
          setDeleteModal(open);

          if (!open) {
            setDeletePageId(null);
          }
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>آیا از حذف این صفحه مطمئنید؟</AlertDialogTitle>

            <AlertDialogDescription>
              با حذف این صفحه، صفحات بعدی یک شماره به عقب منتقل می‌شوند و این
              عملیات قابل برگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              انصراف
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? 'در حال حذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
