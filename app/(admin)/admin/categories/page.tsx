'use client';

import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontalIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

import CategoriesModal from '@/components/admin/categories-modal';
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
  useCategoriesList,
  useDeleteCategory,
} from '@/services/features/categories/hooks';
import { CategoriesResponse } from '@/services/features/categories/types';

export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoriesResponse | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [isDeleteModal, setDeleteModal] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const debouncedSearch = useDebounce(search, 500);

  const deleteMutation = useDeleteCategory();

  const { data } = useCategoriesList({
    all: true,
    search: debouncedSearch,
  });

  const handleEdit = (cat: CategoriesResponse) => {
    setSelectedCategory(cat);
    setOpenModal(true);
  };

  const deleteCategory = async () => {
    if (deleteCatId) {
      try {
        await deleteMutation.mutateAsync({ id: deleteCatId });
        toast.success('دسته بندی با موفقیت حذف شد.');
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        setDeleteModal(false);
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <CategoriesModal
          categories={data?.data || []}
          selectedData={selectedCategory}
          open={openModal}
          onOpenChange={setOpenModal}
        />
        <Input
          placeholder="جستجو"
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
              <TableHead>عکس</TableHead>
              <TableHead>نام دسته بندی</TableHead>
              <TableHead>اسلاگ</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((cat: CategoriesResponse) => (
              <TableRow key={cat.id}>
                <TableCell className="text-center">{cat.id}</TableCell>
                <TableCell>
                  <Image
                    src={process.env.NEXT_PUBLIC_IMAGE_URL + cat.image}
                    width={30}
                    height={30}
                    alt={cat.name}
                  />
                </TableCell>
                <TableCell>{cat.name}</TableCell>
                <TableCell>{cat.slug}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(cat)}>
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDeleteModal(true);
                          setDeleteCatId(cat.id);
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
      <AlertDialog open={isDeleteModal} onOpenChange={setDeleteModal}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              آیا از حذف این دسته بندی مطمئنید؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              این عملیات قابل برگشت نیست
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteCategory()}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
