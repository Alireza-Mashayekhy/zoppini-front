'use client';

import { MoreHorizontalIcon } from 'lucide-react';
import { useState } from 'react';

import ProductCreateModal from '@/components/admin/product/create-modal';
import SelectProductModal from '@/components/admin/product/select-product-modal';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/use-debounce';
import { useAdminCategoriesList } from '@/services/features/categories/hooks';
import {
  useAdminColorsList,
  useAdminSizeList,
  useRahkaranProducsList,
} from '@/services/features/products/hooks';
import {
  IncomingVariantFromRahkaran,
  ProductsResponse,
  RahkaranProductsResponse,
} from '@/services/features/products/type';

/*
 * تب انبارها:
 *
 * هر انبار در یک تب جداگانه نمایش داده می‌شود
 * و ستون موجودی بر اساس تب فعال تغییر می‌کند.
 */
type WarehouseTab = 'hadish' | 'retail';

const WAREHOUSE_TABS: {
  value: WarehouseTab;
  label: string;
}[] = [
  { value: 'hadish', label: 'هدیش مال' },
  { value: 'retail', label: 'خرده‌فروشی' },
];

/**
 * تبدیل کالای راهکاران به واریانتی که باید به محصول اضافه شود.
 *
 * نکته‌ی قیمت:
 * قیمت راهکاران (`fee`) به ریال است و قیمت واریانت‌های سایت به تومان
 * ذخیره می‌شود (همان تبدیلی که در Sync با راهکاران انجام می‌شود).
 */
function toIncomingVariant(
  product: RahkaranProductsResponse,
): IncomingVariantFromRahkaran {
  const stock =
    (Number(product.stockHadishMall) || 0) + (Number(product.stockRetail) || 0);

  return {
    productId: Number(product.productId),
    productName: product.productName,
    productNumber: product.productNumber || '',
    price: Math.round((Number(product.fee) || 0) / 10),
    stock,
  };
}

export default function RahkaranProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // تب فعال انبار
  const [activeWarehouse, setActiveWarehouse] =
    useState<WarehouseTab>('hadish');

  // مودال انتخاب محصول مقصد
  const [openSelectProduct, setOpenSelectProduct] = useState(false);

  // مودال ویرایش/افزودن محصول
  const [openModal, setOpenModal] = useState(false);

  // کالای انتخاب‌شده از راهکاران
  const [incomingVariant, setIncomingVariant] =
    useState<IncomingVariantFromRahkaran | null>(null);

  // محصول مقصدی که این کالا به آن اضافه می‌شود
  const [selectedProduct, setSelectedProduct] =
    useState<ProductsResponse | null>(null);

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

  /*
   * موجودی محصول در تب فعال
   */
  const getActiveWarehouseStock = (product: RahkaranProductsResponse) =>
    activeWarehouse === 'hadish'
      ? product.stockHadishMall
      : product.stockRetail;

  /*
   * مرحله اول:
   * ادمین روی «افزودن به محصولات» می‌زند.
   *
   * چون هر کالای راهکاران در واقع یک واریانت از محصولات ماست،
   * به‌جای انتخاب دستی رنگ و سایز، لیست محصولات را نشان می‌دهیم
   * تا محصول مقصد انتخاب شود.
   */
  const handleAdd = (product: RahkaranProductsResponse) => {
    setIncomingVariant(toIncomingVariant(product));
    setSelectedProduct(null);
    setOpenSelectProduct(true);
  };

  /*
   * مرحله دوم:
   * بعد از انتخاب محصول مقصد، مودال محصول باز می‌شود
   * و کالای راهکاران به‌عنوان یک واریانت داخل آن قرار می‌گیرد
   * تا ادمین اول ویرایش کند و بعد ذخیره.
   */
  const handleSelectProduct = (product: ProductsResponse) => {
    setSelectedProduct(product);
    setOpenSelectProduct(false);
    setOpenModal(true);
  };

  const closeProductModal = () => {
    setOpenModal(false);
    setSelectedProduct(null);
    setIncomingVariant(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search + تب انبارها */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="جستجو"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-96 bg-white"
        />

        <Tabs
          value={activeWarehouse}
          onValueChange={value => setActiveWarehouse(value as WarehouseTab)}
        >
          <TabsList>
            {WAREHOUSE_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-sm bg-white">
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">آیدی</TableHead>
              <TableHead>نام محصول</TableHead>
              <TableHead>کد محصول</TableHead>
              <TableHead>موجودی</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {productsList?.data.map((product: RahkaranProductsResponse) => {
              const stock = getActiveWarehouseStock(product);

              return (
                <TableRow key={product.productId}>
                  <TableCell className="text-center">
                    {product.productId}
                  </TableCell>

                  <TableCell>{product.productName}</TableCell>

                  <TableCell>{product.productNumber}</TableCell>

                  <TableCell>
                    {stock === null || stock === undefined
                      ? '—'
                      : stock.toLocaleString('fa-IR')}
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
                        <DropdownMenuItem onClick={() => handleAdd(product)}>
                          افزودن به محصولات
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ================================================== */}
      {/* انتخاب محصول مقصد */}
      {/* ================================================== */}

      <SelectProductModal
        /*
         * با تغییر کالا، مودال از نو ساخته می‌شود تا
         * جستجو و صفحه‌بندی قبلی باقی نماند.
         */
        key={incomingVariant?.productId ?? 'rahkaran-select'}
        open={openSelectProduct}
        onOpenChange={open => {
          setOpenSelectProduct(open);

          if (!open) {
            setIncomingVariant(null);
          }
        }}
        incoming={incomingVariant}
        onSelectProduct={handleSelectProduct}
      />

      {/* ================================================== */}
      {/* Modal ویرایش محصول + واریانت جدید */}
      {/* ================================================== */}

      <ProductCreateModal
        categories={categoriesList?.data || []}
        selectedData={selectedProduct}
        open={openModal}
        onOpenChange={open => {
          if (!open) {
            closeProductModal();
          }
        }}
        colorsData={colorsData?.data || []}
        sizeData={sizeData?.data || []}
        incomingVariant={incomingVariant}
      />
    </div>
  );
}
