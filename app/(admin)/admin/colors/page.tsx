'use client';

import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontalIcon } from 'lucide-react';
import { useState } from 'react';

import ColorModal from '@/components/admin/color-modal';
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
  useAdminColorsList,
  useDeleteColor,
} from '@/services/features/products/hooks';
import { ColorResponse } from '@/services/features/products/type';

export default function ColorsPage() {
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState<ColorResponse | null>(
    null,
  );
  const [openModal, setOpenModal] = useState(false);
  const [isDeleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 500);

  const { data } = useAdminColorsList({
    search: debouncedSearch,
    all: true,
  });

  const deleteMutation = useDeleteColor();

  const handleEdit = (color: ColorResponse) => {
    setSelectedColor(color);
    setOpenModal(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteMutation.mutateAsync(deleteId);
        setDeleteModal(false);
        queryClient.invalidateQueries({ queryKey: ['colors'] });
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
              <TableHead>کد هگز</TableHead>
              <TableHead>پیش‌نمایش</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((color: ColorResponse) => (
              <TableRow key={color.id}>
                <TableCell className="text-center">{color.id}</TableCell>
                <TableCell>{color.name}</TableCell>
                <TableCell className="font-mono">{color.hexCode}</TableCell>
                <TableCell>
                  <div
                    className="w-8 h-8 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.hexCode }}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon />
                        <span className="sr-only">باز کردن منو</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(color)}>
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDeleteModal(true);
                          setDeleteId(color.id);
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
                  colSpan={5}
                  className="text-center py-8 text-gray-500"
                >
                  رنگی یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ColorModal
        selectedData={selectedColor}
        open={openModal}
        onOpenChange={open => {
          setOpenModal(open);
          if (!open) setSelectedColor(null);
        }}
      />

      <AlertDialog open={isDeleteModal} onOpenChange={setDeleteModal}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>آیا از حذف این رنگ مطمئنید؟</AlertDialogTitle>
            <AlertDialogDescription>
              این عملیات قابل برگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
