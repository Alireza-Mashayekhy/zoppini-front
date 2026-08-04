// app/admin/featured/page.tsx
'use client';

import { Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

import { ProductSearchSelect } from '@/components/admin/product-search-select';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import {
  useCreateFeaturedProduct,
  useDeleteFeaturedProduct,
  useFeaturedProducts,
} from '@/services/features/products/hooks';
import { ProductsResponse } from '@/services/features/products/type';

export default function FeaturedManagement() {
  const { data: featuredItems, isLoading: isLoadingFeatured } =
    useFeaturedProducts({
      all: true,
    });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] =
    useState<ProductsResponse | null>(null);

  // State برای AlertDialog حذف
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const createMutation = useCreateFeaturedProduct();
  const deleteMutation = useDeleteFeaturedProduct();

  const handleAdd = async () => {
    if (!selectedProductId) {
      toast.error('لطفاً محصول را انتخاب کنید');
      return;
    }

    const colorId = selectedProductId?.variants?.[0]?.color?.id;

    if (!colorId) {
      toast.error('برای این محصول رنگی یافت نشد');
      return;
    }

    await createMutation.mutateAsync({
      productId: Number(selectedProductId?.id),
      colorId,
    });

    setSelectedProductId(null);
    setIsDialogOpen(false);
  };

  // باز کردن دیالوگ حذف
  const handleDeleteClick = (id: number) => {
    setDeleteTargetId(id);
    setIsDeleteDialogOpen(true);
  };

  // تأیید حذف
  const confirmDelete = async () => {
    if (deleteTargetId === null) return;
    await deleteMutation.mutate(deleteTargetId);
    setIsDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  if (isLoadingFeatured) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-wide">محصولات ویژه</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="dark" className="gap-2">
              <Plus className="w-4 h-4" />
              افزودن محصول ویژه
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>افزودن محصول ویژه</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">محصول</label>
                <ProductSearchSelect
                  value={selectedProductId?.id.toString() || ''}
                  onValueChange={setSelectedProductId}
                  placeholder="انتخاب محصول..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                انصراف
              </Button>
              <Button
                variant="dark"
                onClick={handleAdd}
                loading={createMutation.isPending}
                disabled={!selectedProductId}
              >
                افزودن
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {featuredItems?.data && featuredItems?.data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          هیچ محصول ویژه‌ای انتخاب نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {featuredItems?.data?.map(item => {
            const colorImage = item.product.colorImages?.find(
              img => img?.color?.id === item?.colorId,
            );
            const image = colorImage?.url;

            // واریانت مربوط به رنگ
            const variant = item.product.variants?.find(
              v => v?.colorId === item?.colorId,
            );
            const price = variant?.price || 0;

            return (
              <div
                key={item.id}
                className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={process.env.NEXT_PUBLIC_IMAGE_URL + (image || '')}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span
                      className="inline-block w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: item.color.hexCode }}
                      title={item.color.name}
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteClick(item.id)}
                    className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium line-clamp-2">
                    {item.product.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    کد: {item.product.productCode} | {item.color.name}
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    {formatPrice(price)} تومان
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AlertDialog برای تأیید حذف */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              آیا از حذف این آیتم مطمئن هستید؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              این عملیات غیرقابل برگشت است و آیتم از لیست محصولات ویژه حذف خواهد
              شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'در حال حذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
