'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontalIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import ProductCreateModal from '@/components/admin/product/create-modal';
import FormProvider from '@/components/form/form-provider';
import RHFMultiSelect from '@/components/form/rhf-multiselect';
import RHFSelect from '@/components/form/rhf-select';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import { useAdminCategoriesList } from '@/services/features/categories/hooks';
import {
  useAdminColorsList,
  useAdminSizeList,
  useRahkaranProducsList,
} from '@/services/features/products/hooks';
import {
  ColorResponse,
  ProductsResponse,
  RahkaranProductsResponse,
  SizeResponse,
} from '@/services/features/products/type';

type VariantInitialData = {
  colorId: string;
  sizeId: string;
  price: number;
  stock: number;
  sku: string;
};

type VariantFormValues = {
  colorId: string;
  sizeId: string[];
};

type ProductFromRahkaran = {
  productCode: string;
  title: string;
  slug: string;
  image: string;
  description: string;
  careInstructionsHtml: string;
  variants: VariantInitialData[];
  suggestedProducts: [];
  categories: [];
  comments: [];
  colorImages: [];
  sameColorProducts: [];
};

export default function Products() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // انتخاب رنگ و سایز
  const [openVariant, setOpenVariant] = useState(false);

  // مودال ایجاد محصول
  const [openModal, setOpenModal] = useState(false);

  // محصول انتخاب شده از راهکاران
  const [selectedRahkaranProduct, setSelectedRahkaranProduct] =
    useState<RahkaranProductsResponse | null>(null);

  // دیتایی که قرار است به ProductCreateModal برود
  const [selectedProduct, setSelectedProduct] = useState<
    ProductFromRahkaran | ProductsResponse | null
  >(null);

  const { data: categoriesList } = useAdminCategoriesList({
    all: true,
  });

  const { data: colorsData } = useAdminColorsList();
  const { data: sizeData } = useAdminSizeList();

  const debouncedSearch = useDebounce(search, 500);

  const { data: productsList } = useRahkaranProducsList({
    search: debouncedSearch,
    page,
  });

  const colorItems =
    colorsData?.data?.map((color: ColorResponse) => ({
      text: color.name,
      value: String(color.id),
    })) ?? [];

  const sizeItems =
    sizeData?.data?.map((size: SizeResponse) => ({
      text: size.name,
      value: String(size.id),
    })) ?? [];

  /*
   * مرحله اول:
   * کاربر روی "افزودن به محصولات" می‌زند.
   *
   * هنوز ProductCreateModal باز نمی‌شود.
   * اول رنگ و سایز را می‌گیریم.
   */
  const handleAdd = (product: RahkaranProductsResponse) => {
    setSelectedRahkaranProduct(product);
    setOpenVariant(true);
  };

  const schema = z.object({
    colorId: z.string().min(1, 'انتخاب رنگ الزامی است'),
    sizeId: z.array(z.string()).min(1, 'حداقل یک سایز را انتخاب کنید'),
  });

  const methods = useForm<VariantFormValues>({
    defaultValues: {
      colorId: '',
      sizeId: [],
    },
    resolver: zodResolver(schema),
  });

  const { reset } = methods;

  /*
   * مرحله دوم:
   * بعد از انتخاب رنگ و سایز
   *
   * محصول اولیه ساخته می‌شود و سپس ProductCreateModal باز می‌شود.
   */
  const onVariantSubmit = (data: VariantFormValues) => {
    if (!selectedRahkaranProduct) return;

    const variants: VariantInitialData[] = data.sizeId.map(sizeId => ({
      colorId: data.colorId,
      sizeId,
      price: Number(selectedRahkaranProduct.fee) || 0,
      stock: Number(selectedRahkaranProduct.unitRef) || 0,
      sku: selectedRahkaranProduct.productNumber || '',
    }));

    const newProduct: ProductFromRahkaran = {
      productCode: String(selectedRahkaranProduct.productId),
      title: selectedRahkaranProduct.productName,
      slug: '',
      image: '',
      description: '',
      careInstructionsHtml: '',
      variants,
      suggestedProducts: [],
      categories: [],
      comments: [],
      colorImages: [],
      sameColorProducts: [],
    };

    setSelectedProduct(newProduct);

    // اول Dialog انتخاب رنگ و سایز بسته شود
    setOpenVariant(false);

    // بعد Modal ایجاد محصول باز شود
    setOpenModal(true);

    reset();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="جستجو"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-96 bg-white"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-sm bg-white">
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">آیدی</TableHead>
              <TableHead>نام محصول</TableHead>
              <TableHead>کد محصول</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {productsList?.data.map((product: RahkaranProductsResponse) => (
              <TableRow key={product.productId}>
                <TableCell className="text-center">
                  {product.productId}
                </TableCell>

                <TableCell>{product.productName}</TableCell>

                <TableCell>{product.productNumber}</TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon />

                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAdd(product)}>
                        افزودن به محصولات
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* ================================================== */}
        {/* انتخاب رنگ و سایز */}
        {/* ================================================== */}

        <Dialog
          open={openVariant}
          onOpenChange={open => {
            setOpenVariant(open);

            if (!open) {
              reset();
            }
          }}
        >
          <DialogContent dir="rtl" className="max-w-xl">
            <DialogHeader>
              <DialogTitle>انتخاب رنگ و سایز</DialogTitle>
            </DialogHeader>

            {selectedRahkaranProduct && (
              <div className="mb-4 rounded-lg bg-muted/50 p-4">
                <div className="font-medium">
                  {selectedRahkaranProduct.productName}
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  کد محصول: {selectedRahkaranProduct.productNumber}
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  قیمت:{' '}
                  {Number(selectedRahkaranProduct.fee).toLocaleString('fa-IR')}
                </div>
              </div>
            )}

            <FormProvider methods={methods} onSubmit={onVariantSubmit}>
              <div className="grid grid-cols-1 gap-5">
                <RHFSelect
                  name="colorId"
                  label="رنگ"
                  items={colorItems}
                  placeholder="انتخاب رنگ..."
                  className="w-full"
                />

                <RHFMultiSelect name="sizeId" label="سایز" items={sizeItems} />

                <Button type="submit" size="lg" className="w-full">
                  ادامه و افزودن محصول
                </Button>
              </div>
            </FormProvider>
          </DialogContent>
        </Dialog>

        {/* ================================================== */}
        {/* Modal اصلی ایجاد محصول */}
        {/* ================================================== */}

        <ProductCreateModal
          categories={categoriesList?.data || []}
          selectedData={selectedProduct}
          isDefaultValue={true}
          open={openModal}
          onOpenChange={open => {
            setOpenModal(open);

            if (!open) {
              setSelectedProduct(null);
              setSelectedRahkaranProduct(null);
            }
          }}
          colorsData={colorsData?.data || []}
          sizeData={sizeData?.data || []}
        />
      </div>
    </div>
  );
}
