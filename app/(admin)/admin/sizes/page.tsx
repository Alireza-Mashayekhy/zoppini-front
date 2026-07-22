'use client';

import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontalIcon } from 'lucide-react';
import { useState } from 'react';

import SizeModal from '@/components/admin/size-modal';
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
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useAdminSizeList,
  useDeleteSize,
} from '@/services/features/products/hooks';
import { SizeResponse } from '@/services/features/products/type';

export default function SizesPage() {
  const [search, setSearch] = useState('');
  const [selectedSize, setSelectedSize] = useState<SizeResponse | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [isDeleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 500);

  const { data } = useAdminSizeList({
    search: debouncedSearch,
    all: true,
  });

  const deleteMutation = useDeleteSize();

  const handleEdit = (size: SizeResponse) => {
    setSelectedSize(size);
    setOpenModal(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteMutation.mutateAsync(deleteId);
        setDeleteModal(false);
        queryClient.invalidateQueries({ queryKey: ['sizes'] });
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Input
            placeholder="جستجو..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
            }}
            className="bg-white w-72"
          />
        </div>
        <div className="text-sm text-gray-500">
          تعداد: {data?.data?.length || 0}
        </div>
      </div>

      <div className="bg-white rounded-sm overflow-hidden">
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">آیدی</TableHead>
              <TableHead>نام</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((size: SizeResponse) => (
              <TableRow key={size.id}>
                <TableCell className="text-center">{size.id}</TableCell>
                <TableCell>{size.name}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon />
                        <span className="sr-only">باز کردن منو</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(size)}>
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDeleteModal(true);
                          setDeleteId(size.id);
                        }}
                        variant="destructive"
                      >
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {data?.data?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-gray-500"
                >
                  سایزی یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SizeModal
        selectedData={selectedSize}
        open={openModal}
        onOpenChange={open => {
          setOpenModal(open);
          if (!open) setSelectedSize(null);
        }}
      />

      <AlertDialog open={isDeleteModal} onOpenChange={setDeleteModal}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>آیا از حذف این سایز مطمئنید؟</AlertDialogTitle>
            <AlertDialogDescription>
              این عملیات قابل برگشت نیست.
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
