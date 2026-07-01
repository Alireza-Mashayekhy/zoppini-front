'use client';

import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontalIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

import BlogModal from '@/components/admin/blog-modal';
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
  useAdminBlogList,
  useDeleteBlogPost,
} from '@/services/features/blog/hooks';
import { BlogPostResponse } from '@/services/features/blog/types';

export default function AdminBlogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPostResponse | null>(
    null,
  );
  const [openModal, setOpenModal] = useState(false);
  const [isDeleteModal, setDeleteModal] = useState(false);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 500);
  const deleteMutation = useDeleteBlogPost();

  const { data } = useAdminBlogList({
    all: true,
    search: debouncedSearch,
  });

  const handleEdit = (post: BlogPostResponse) => {
    setSelectedPost(post);
    setOpenModal(true);
  };

  const handleDelete = async () => {
    if (deletePostId) {
      try {
        await deleteMutation.mutateAsync({ id: deletePostId });
        toast.success('مقاله با موفقیت حذف شد.');
        queryClient.invalidateQueries({ queryKey: ['blog'] });
        setDeleteModal(false);
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <BlogModal
          selectedData={selectedPost}
          open={openModal}
          onOpenChange={open => {
            setOpenModal(open);
            if (!open) setSelectedPost(null);
          }}
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
              <TableHead>تصویر</TableHead>
              <TableHead>عنوان</TableHead>
              <TableHead>اسلاگ</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((post: BlogPostResponse) => (
              <TableRow key={post.id}>
                <TableCell className="text-center">{post.id}</TableCell>
                <TableCell>
                  {post.coverImage && (
                    <Image
                      src={
                        process.env.NEXT_PUBLIC_IMAGE_URL + post.coverImage
                      }
                      width={40}
                      height={25}
                      alt={post.title}
                      className="object-cover"
                    />
                  )}
                </TableCell>
                <TableCell>{post.title}</TableCell>
                <TableCell>{post.slug}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {post.isPublished && (
                      <Badge variant="default">منتشر شده</Badge>
                    )}
                    {post.isFeatured && (
                      <Badge variant="secondary">ویژه</Badge>
                    )}
                  </div>
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
                      <DropdownMenuItem onClick={() => handleEdit(post)}>
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDeleteModal(true);
                          setDeletePostId(post.id);
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
            <AlertDialogTitle>آیا از حذف این مقاله مطمئنید؟</AlertDialogTitle>
            <AlertDialogDescription>
              این عملیات قابل برگشت نیست
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
