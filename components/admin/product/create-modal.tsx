// components/admin/product/create-modal.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2Icon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import RHFBooleanSegment from '@/components/form/rhf-boolean-segment';
import { RHFImageUploader } from '@/components/form/rhf-image-uploader';
import RHFInput from '@/components/form/rhf-input';
import RHFMultiSelect from '@/components/form/rhf-multiselect';
import RHFPriceInput from '@/components/form/rhf-price-input';
import RHFSelect from '@/components/form/rhf-select'; // <-- اضافه شد
import { RHFTextEditor } from '@/components/form/rhf-text-editor';
import RHFTextArea from '@/components/form/rhf-textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PendingVariant, resolveIncomingVariant } from '@/lib/rahkaran-variant';
import { normalizeSku } from '@/lib/sku';
import { formatPrice } from '@/lib/utils';
import { CategoriesResponse } from '@/services/features/categories/types';
import {
  useCreateProduct,
  useEditProduct,
} from '@/services/features/products/hooks';
import {
  ColorResponse,
  createProductDto,
  IncomingVariantFromRahkaran,
  InitialProductData,
  ProductsResponse,
  SizeResponse,
} from '@/services/features/products/type';

import FormProvider from '../../form/form-provider';
import { Button } from '../../ui/button';
import ProductGuideEditor from '../product-guides/product-guide-editor';
import CreateColorModal from './create-color-modal';
import CreateSizeModal from './create-size-modal';

const SHOW_SKU = true;

// ==================== نوع جدید برای فرم ====================
type FormValues = Omit<
  createProductDto,
  'colorId' | 'indexable' | 'followable'
> & {
  colorId: string; // در فرم به صورت رشته (تک‌انتخاب)
  indexable: boolean;
  followable: boolean;
};

function isInitialProductData(
  data: ProductsResponse | InitialProductData,
): data is InitialProductData {
  return data.variants.some(
    variant => 'colorId' in variant && 'sizeId' in variant,
  );
}

export default function ProductCreateModal({
  categories,
  selectedData,
  open,
  onOpenChange,
  colorsData,
  sizeData,
  isDefaultValue,
  incomingVariant,
}: {
  categories: CategoriesResponse[];
  selectedData: ProductsResponse | InitialProductData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colorsData: ColorResponse[];
  sizeData: SizeResponse[];
  isDefaultValue?: boolean;
  /**
   * کالای انتخاب‌شده از راهکاران
   *
   * وقتی ادمین در لیست محصولات راهکاران روی «افزودن به محصولات» می‌زند،
   * محصول مقصد و این کالا به مودال پاس داده می‌شوند تا کالا به‌عنوان
   * یک واریانت جدید به همان محصول اضافه شود (یا اگر از قبل وصل بود،
   * قیمت و موجودی همان واریانت به‌روزرسانی شود).
   */
  incomingVariant?: IncomingVariantFromRahkaran | null;
}) {
  const [isCreateColorOpen, setCreateColorModal] = useState(false);
  const [isCreateSizeOpen, setCreateSizeModal] = useState(false);
  const [variants, setVariants] = useState<
    {
      id?: number;
      colorId: string;
      sizeId: string;
      price: number;
      stock: number;
      sku?: string;
    }[]
  >([]);
  /** واریانت‌هایی که از راهکاران آمده‌اند و هنوز ذخیره نشده‌اند */
  const [pendingVariants, setPendingVariants] = useState<PendingVariant[]>([]);

  /** اگر کالای راهکاران از قبل به همین محصول وصل بود، سایز آن را نگه می‌داریم */
  const [linkedIncoming, setLinkedIncoming] = useState<{
    sizeId: string;
    variantId?: number;
  } | null>(null);

  const variantDataMapRef = useRef<
    Map<string, { price: number; stock: number; sku: string }>
  >(new Map());
  const queryClient = useQueryClient();
  const createProductMutation = useCreateProduct();
  const editProductMutation = useEditProduct();

  const colorItems = colorsData.map(color => ({
    text: color?.name,
    value: String(color?.id),
  }));
  const sizeItems = sizeData.map(size => ({
    text: size?.name,
    value: String(size?.id),
  }));
  const categoryItems = categories.map(cat => ({
    text: cat.name,
    value: String(cat.id),
  }));

  const isEdit = !!selectedData && !isDefaultValue;

  // ==================== شمای اعتبارسنجی ====================
  const schema = z.object({
    title: z.string().nonempty('این فیلد اجباری است'),
    image: selectedData
      ? z.any().optional()
      : z
          .instanceof(File, { message: 'عکس دسته بندی اجباری است' })
          .refine(file => file.size <= 5 * 1024 * 1024, 'حداکثر حجم 5MB')
          .refine(
            file => ['image/webp'].includes(file.type),
            'فقط فرمت‌ webp مجازند',
          ),
    description: z.string().nonempty('این فیلد اجباری است'),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    indexable: z.boolean(),
    followable: z.boolean(),
    careInstructionsHtml: z.string().nonempty('این فیلد اجباری است'),
    slug: z.string().nonempty('این فیلد اجباری است'),
    productCode: z.string().nonempty('این فیلد اجباری است'),
    categories: z.array(z.string()).nonempty('این فیلد اجباری است'),
    colorId: z.string().nonempty('این فیلد اجباری است'),
    sizeId: z.array(z.string()).nonempty('این فیلد اجباری است'),
  });

  // ==================== استفاده از useForm با نوع جدید ====================
  const methods = useForm<FormValues>({
    defaultValues: {
      title: '',
      image: undefined,
      description: '',
      metaTitle: '',
      metaDescription: '',
      indexable: true,
      followable: true,
      careInstructionsHtml: '',
      slug: '',
      productCode: '',
      categories: [],
      colorId: '',
      sizeId: [],
    },
    resolver: zodResolver(schema),
  });

  const {
    reset,
    setValue,
    formState: { errors },
    watch,
  } = methods;

  const colorId = watch('colorId');
  const sizeId = watch('sizeId');
  const variantsRef = useRef(variants);

  useEffect(() => {
    variantsRef.current = variants;
  }, [variants]);

  useEffect(() => {
    const map = variantDataMapRef.current;
    for (const v of variants) {
      const key = `${v.colorId}|${v.sizeId}`;
      map.set(key, {
        price: v.price,
        stock: v.stock,
        sku: v.sku || '',
      });
    }
  }, [variants]);

  useEffect(() => {
    if (!colorId || !sizeId.length) {
      setVariants([]);
      return;
    }

    const currentVariants = variantsRef.current;

    const newVariants = sizeId.map(size => {
      // اول variant فعلی با همین سایز را پیدا کن
      // مهم نیست رنگ قبلی چه بوده
      const existing = currentVariants.find(variant => variant.sizeId === size);

      return {
        // چون رنگ عوض شده، id قبلی را نباید نگه داریم
        id: existing?.id,

        colorId,
        sizeId: size,

        // اطلاعات قبلی حفظ می‌شوند
        price: existing?.price ?? 0,
        stock: existing?.stock ?? 0,
        sku: existing?.sku ?? '',
      };
    });

    setVariants(newVariants);
  }, [colorId, sizeId]);

  // ==================== مقداردهی اولیه در حالت ویرایش ====================
  useEffect(() => {
    if (!selectedData) {
      reset({
        title: '',
        image: undefined,
        description: '',
        metaTitle: '',
        metaDescription: '',
        indexable: true,
        followable: true,
        careInstructionsHtml: '',
        slug: '',
        productCode: '',
        categories: [],
        colorId: '',
        sizeId: [],
      });

      setVariants([]);
      setPendingVariants([]);
      setLinkedIncoming(null);
      return;
    }

    // =========================================
    // محصولی که از راهکاران آمده
    // =========================================
    if (isDefaultValue) {
      if (!isInitialProductData(selectedData)) {
        console.error('Invalid InitialProductData:', selectedData);
        return;
      }

      const initialVariants = selectedData.variants.map(v => ({
        colorId: String(v.colorId),
        sizeId: String(v.sizeId),
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
        sku: v.sku || '',
      }));

      const firstVariant = initialVariants[0];

      reset({
        title: selectedData.title || '',
        image: undefined,
        description: selectedData.description || '',
        metaTitle: '',
        metaDescription: '',
        indexable: true,
        followable: true,
        careInstructionsHtml: selectedData.careInstructionsHtml || '',
        slug: selectedData.slug || '',
        productCode: String(selectedData.productCode || ''),
        categories: selectedData.categories?.map(c => String(c.id)) || [],
        colorId: firstVariant?.colorId || '',
        sizeId: initialVariants.map(v => v.sizeId),
      });

      setVariants(initialVariants);

      return;
    }

    // =========================================
    // Edit محصول موجود در دیتابیس
    // =========================================

    const product = selectedData as ProductsResponse;

    const productVariants = product.variants || [];

    const uniqueColorIds = [
      ...new Set(productVariants.map(v => String(v.color?.id)).filter(Boolean)),
    ];

    const uniqueSizeIds = [
      ...new Set(productVariants.map(v => String(v.size?.id)).filter(Boolean)),
    ];

    reset({
      title: product.title || '',
      image: undefined,
      description: product.description || '',
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      indexable: product.indexable ?? true,
      followable: product.followable ?? true,
      careInstructionsHtml: product.careInstructionsHtml || '',
      slug: product.slug || '',
      productCode: String(product.productCode || ''),
      categories: product.categories?.map(c => String(c.id)) || [],
      colorId: uniqueColorIds[0] || '',
      sizeId: uniqueSizeIds,
    });

    const existingVariants = productVariants.map(v => ({
      id: v.id,
      colorId: String(v.color.id),
      sizeId: String(v.size.id),
      price: Number(v.price) || 0,
      stock: Number(v.stock) || 0,
      sku: v.sku || '',
    }));

    setVariants(existingVariants);

    // =========================================
    // کالای انتخاب‌شده از راهکاران
    // =========================================

    /*
     * اگر همین کد کالا از قبل روی یکی از واریانت‌های این محصول نشسته باشد،
     * واریانت جدیدی ساخته نمی‌شود؛ فقط قیمت و موجودی همان واریانت
     * با مقادیر راهکاران به‌روزرسانی می‌شود.
     *
     * اگر کد جدید باشد، به‌عنوان یک واریانت در انتظار اضافه می‌شود
     * و رنگ آن همان رنگ محصول است؛ سایز را ادمین انتخاب می‌کند.
     */
    const resolution = resolveIncomingVariant(
      existingVariants,
      incomingVariant,
    );

    setVariants(resolution.variants);
    setPendingVariants(resolution.pendingVariants);
    setLinkedIncoming(resolution.linked);
  }, [selectedData, isDefaultValue, incomingVariant, reset]);
  // ==================== ارسال فرم ====================
  const onSubmit = async (data: FormValues) => {
    try {
      const {
        title,
        description,
        metaTitle,
        metaDescription,
        indexable,
        followable,
        careInstructionsHtml,
        slug,
        productCode,
        categories,
      } = data;

      // =========================================
      // اعتبارسنجی واریانت‌های در انتظار (کالای راهکاران)
      // =========================================

      if (pendingVariants.length > 0) {
        const missingSize = pendingVariants.some(variant => !variant.sizeId);

        if (missingSize) {
          toast.error('سایز کالای راهکاران را انتخاب کنید');

          return;
        }

        const usedSizes = new Set(
          variants.map(variant => String(variant.sizeId)),
        );

        const duplicatedSize = pendingVariants.some(variant => {
          const isDuplicate = usedSizes.has(String(variant.sizeId));

          usedSizes.add(String(variant.sizeId));

          return isDuplicate;
        });

        if (duplicatedSize) {
          toast.error(
            'این سایز قبلاً برای همین محصول ثبت شده است؛ سایز دیگری انتخاب کنید',
          );

          return;
        }
      }

      // ساخت payload واریانت‌ها
      const variantsPayload = [
        ...variants.map(v => ({
          id: v.id,
          colorId: Number(v.colorId),
          sizeId: Number(v.sizeId),
          price: Number(v.price),
          stock: Number(v.stock) || 0,
          sku: v.sku || '',
        })),

        // واریانت‌های جدیدی که از راهکاران آمده‌اند (بدون id)
        ...pendingVariants.map(v => ({
          id: undefined,
          colorId: Number(colorId),
          sizeId: Number(v.sizeId),
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          sku: v.sku || '',
        })),
      ];

      const hasInvalid = variantsPayload.some(
        v =>
          isNaN(v.colorId) ||
          isNaN(v.sizeId) ||
          v.colorId <= 0 ||
          v.sizeId <= 0,
      );
      if (hasInvalid) {
        toast.error('مقادیر رنگ یا سایز نامعتبر است');
        return;
      }

      // SKU در دیتابیس یکتاست؛ قبل از ارسال، تکراری بودن آن را بررسی می‌کنیم
      const skus = variantsPayload
        .map(v => normalizeSku(v.sku))
        .filter(Boolean);

      if (new Set(skus).size !== skus.length) {
        toast.error(
          'این کد کالا (SKU) برای واریانت دیگری از همین محصول ثبت شده است',
        );

        return;
      }

      const formData = new FormData();
      formData.append('productCode', productCode);
      formData.append('title', title);
      formData.append('slug', slug);
      formData.append('description', description || '');
      formData.append('metaTitle', metaTitle || '');
      formData.append('metaDescription', metaDescription || '');
      formData.append('indexable', (indexable ?? true).toString());
      formData.append('followable', (followable ?? true).toString());
      formData.append('careInstructionsHtml', careInstructionsHtml || '');
      formData.append('categoryIds', JSON.stringify(categories.map(Number)));
      formData.append('variants', JSON.stringify(variantsPayload));

      if (data.image instanceof File) {
        formData.append('file', data.image);
      }

      if (isEdit) {
        if (!selectedData || !('id' in selectedData)) {
          toast.error('اطلاعات محصول برای ویرایش معتبر نیست');
          return;
        }

        await editProductMutation.mutateAsync({
          id: selectedData.id,
          data: formData,
        });
      } else {
        await createProductMutation.mutateAsync(formData);
      }

      onOpenChange(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // اتصال کالای راهکاران به محصول، در لیست راهکاران هم باید تازه شود
      queryClient.invalidateQueries({ queryKey: ['product-by-sku'] });
      toast.success(isEdit ? 'محصول ویرایش شد' : 'محصول ایجاد شد');
    } catch (error) {
      console.log(error);
      toast.error('خطا در ثبت محصول');
    }
  };

  // ==================== به‌روزرسانی یک واریانت ====================
  const updateVariant = (
    index: number,
    field: 'price' | 'stock' | 'sku',
    value: any,
  ) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      [field]: field === 'price' || field === 'stock' ? Number(value) : value,
    };
    setVariants(updated);
  };

  // ==================== رندر ====================
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isDefaultValue && (
        <DialogTrigger asChild>
          <Button>افزودن</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-full! h-full! rounded-none flex flex-col gap-10">
        <DialogHeader className="h-fit">
          <DialogTitle>
            {incomingVariant
              ? 'افزودن کالای راهکاران به محصول'
              : isEdit
                ? 'ویرایش محصول'
                : 'افزودن محصول'}
          </DialogTitle>
        </DialogHeader>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-thin px-4">
            {/* کالای در حال افزودن از راهکاران */}
            {incomingVariant && (
              <div className="col-span-2 rounded-lg border bg-muted/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      در حال افزودن از راهکاران: {incomingVariant.productName}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      کد کالا: {incomingVariant.productNumber || '—'} · قیمت:{' '}
                      {formatPrice(incomingVariant.price)} تومان · موجودی:{' '}
                      {incomingVariant.stock.toLocaleString('fa-IR')}
                    </div>
                  </div>

                  <Badge variant={linkedIncoming ? 'secondary' : 'outline'}>
                    {linkedIncoming
                      ? 'قبلاً به این محصول وصل بود'
                      : 'واریانت جدید'}
                  </Badge>
                </div>

                {!incomingVariant.productNumber && (
                  <p className="mt-2 text-xs text-destructive">
                    این کالا در راهکاران کد کالا (بارکد) ندارد؛ بدون آن، قیمت و
                    موجودی این واریانت به‌صورت خودکار با راهکاران Sync نمی‌شود.
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  {linkedIncoming
                    ? `این کالا از قبل روی سایز «${
                        sizeData.find(
                          size => String(size.id) === linkedIncoming.sizeId,
                        )?.name ?? '—'
                      }» نشسته است؛ قیمت و موجودی آن با مقادیر راهکاران به‌روزرسانی شد. می‌توانید قبل از ذخیره ویرایش کنید.`
                    : 'سایز این کالا را در بخش «کالای در حال افزودن از راهکاران» مشخص کنید؛ بعد از ذخیره، به واریانت‌های محصول اضافه می‌شود.'}
                </p>
              </div>
            )}

            <RHFInput name="title" label="نام محصول" />
            <RHFInput name="productCode" label="کد محصول" />
            <RHFInput name="slug" label="اسلاگ" />

            {/* استفاده از RHFSelect به جای select معمولی */}
            <div className="flex gap-2 items-end">
              <RHFSelect
                name="colorId"
                label="رنگ"
                items={colorItems}
                placeholder="انتخاب رنگ..."
                className="w-full"
              />
              <CreateColorModal
                open={isCreateColorOpen}
                onOpenChange={setCreateColorModal}
              />
            </div>

            {/* انتخاب سایز (چندانتخابی) */}
            <div className="flex gap-2 items-end">
              <RHFMultiSelect name="sizeId" label="سایز" items={sizeItems} />
              <CreateSizeModal
                open={isCreateSizeOpen}
                onOpenChange={setCreateSizeModal}
              />
            </div>

            {/* دسته‌بندی‌ها */}
            <RHFMultiSelect
              name="categories"
              label="دسته بندی ها"
              items={categoryItems}
            />

            {/* ========================================= */}
            {/* واریانت‌های در انتظار (از راهکاران) */}
            {/* ========================================= */}

            {pendingVariants.length > 0 && (
              <div className="col-span-2 mt-4 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    کالای در حال افزودن از راهکاران
                  </h3>

                  <Badge variant="outline">حداکثر یک سایز</Badge>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  این کالا با همین کد (SKU) به محصول وصل می‌شود؛ بعد از آن، قیمت
                  و موجودی آن در هر Sync از راهکاران به‌روز می‌شود.
                </p>

                {!colorId && (
                  <p className="mt-2 text-xs text-destructive">
                    این محصول هنوز رنگ ندارد؛ ابتدا رنگ محصول را از فیلد «رنگ»
                    انتخاب کنید.
                  </p>
                )}

                <div className="mt-3 overflow-hidden rounded-md border bg-background">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-right">رنگ</th>
                        <th className="p-2 text-right">سایز</th>
                        <th className="p-2 text-right">قیمت</th>
                        <th className="p-2 text-right">موجودی</th>
                        <th className="p-2 text-right">کد محصول (SKU)</th>
                        <th className="p-2" />
                      </tr>
                    </thead>

                    <tbody>
                      {pendingVariants.map((variant, index) => {
                        const colorName = colorsData.find(
                          color => String(color.id) === colorId,
                        )?.name;

                        return (
                          <tr key={index} className="border-t">
                            <td className="p-2">
                              {colorName || (
                                <span className="text-xs text-muted-foreground">
                                  هم‌رنگ محصول
                                </span>
                              )}
                            </td>

                            <td className="p-2">
                              <Select
                                value={variant.sizeId || undefined}
                                onValueChange={value =>
                                  setPendingVariants(current =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, sizeId: value }
                                        : item,
                                    ),
                                  )
                                }
                              >
                                <SelectTrigger className="w-full min-w-32">
                                  <SelectValue placeholder="انتخاب سایز..." />
                                </SelectTrigger>

                                <SelectContent>
                                  {sizeItems.map(item => (
                                    <SelectItem
                                      key={item.value}
                                      value={item.value}
                                      disabled={variants.some(
                                        existing =>
                                          existing.sizeId === item.value,
                                      )}
                                    >
                                      {item.text || item.value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>

                            <td className="p-2">
                              <Input
                                type="number"
                                className="w-28"
                                value={variant.price}
                                onChange={event =>
                                  setPendingVariants(current =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            price: Number(event.target.value),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            </td>

                            <td className="p-2">
                              <Input
                                type="number"
                                className="w-24"
                                value={variant.stock}
                                onChange={event =>
                                  setPendingVariants(current =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            stock: Number(event.target.value),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            </td>

                            <td className="p-2">
                              <Input
                                className="w-36"
                                value={variant.sku}
                                onChange={event =>
                                  setPendingVariants(current =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, sku: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            </td>

                            <td className="p-2 text-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon-sm"
                                onClick={() =>
                                  setPendingVariants(current =>
                                    current.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                  )
                                }
                              >
                                <Trash2Icon />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  اگر این کالا نباید به این محصول اضافه شود، سطر را حذف کنید؛
                  محصول بدون تغییر ذخیره می‌شود.
                </p>
              </div>
            )}

            {/* جدول واریانت‌ها */}
            {variants.length > 0 && (
              <div className="col-span-2 mt-4 border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-right">رنگ</th>
                      <th className="p-2 text-right">سایز</th>
                      <th className="p-2 text-right">قیمت</th>
                      <th className="p-2 text-right">موجودی</th>
                      {SHOW_SKU && (
                        <th className="p-2 text-right">کد محصول (SKU)</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, index) => {
                      const colorName = colorsData.find(
                        c => String(c.id) === variant.colorId,
                      )?.name;
                      const sizeName = sizeData.find(
                        s => String(s.id) === variant.sizeId,
                      )?.name;
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-2">{colorName}</td>
                          <td className="p-2">{sizeName}</td>
                          <td className="p-2">
                            <RHFPriceInput
                              name={`variant-price-${index}`}
                              label=""
                              className="w-32"
                              value={variant.price}
                              onChange={val =>
                                updateVariant(index, 'price', val)
                              }
                            />
                          </td>
                          <td className="p-2">
                            <RHFInput
                              name={`variant-stock-${index}`}
                              type="number"
                              label=""
                              className="w-24"
                              value={variant.stock}
                              onChange={e =>
                                updateVariant(
                                  index,
                                  'stock',
                                  Number(e.target.value),
                                )
                              }
                            />
                          </td>
                          {SHOW_SKU && (
                            <td className="p-2">
                              <RHFInput
                                name={`variant-sku-${index}`}
                                label=""
                                className="w-32"
                                value={variant.sku}
                                onChange={e =>
                                  updateVariant(index, 'sku', e.target.value)
                                }
                              />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="col-span-2">
              <RHFTextEditor name="description" label="توضیحات" />
            </div>
            <div className="col-span-2">
              <RHFTextEditor name="careInstructionsHtml" label="نحوه شستشو" />
            </div>

            {isEdit &&
              selectedData &&
              'id' in selectedData &&
              selectedData.id && (
                <div className="col-span-2 mt-4 border-t pt-6">
                  <h3 className="mb-4 text-lg font-semibold">راهنمای محصول</h3>

                  <ProductGuideEditor productId={Number(selectedData.id)} />
                </div>
              )}

            <div className="col-span-2 mt-4 rounded-lg border p-4">
              <h3 className="mb-1 text-lg font-semibold">تنظیمات سئو</h3>
              <p className="mb-4 text-xs text-muted-foreground">
                این مقادیر در عنوان، توضیحات متا و دستور ربات‌های صفحه‌ی همین
                محصول در نتایج گوگل استفاده می‌شوند. اگر متا تایتل یا متا
                دیسکریپشن خالی بمانند، نام و توضیحات محصول به‌صورت خودکار
                استفاده می‌شود.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <RHFInput
                    label="متا تایتل"
                    name="metaTitle"
                    placeholder="مثال: خرید کت شلوار مردانه اسپرت - زوپینی"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(watch('metaTitle') || '').length} کاراکتر (پیشنهاد: حداکثر
                    ۶۰ کاراکتر)
                  </p>
                </div>

                <div className="col-span-2">
                  <RHFTextArea
                    label="متا دیسکریپشن"
                    name="metaDescription"
                    rows={3}
                    placeholder="توضیح کوتاه و جذاب درباره‌ی این محصول"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(watch('metaDescription') || '').length} کاراکتر (پیشنهاد:
                    حداکثر ۱۶۰ کاراکتر)
                  </p>
                </div>

                <div className="col-span-2 space-y-4 rounded-lg border p-4">
                  <div>
                    <h4 className="text-sm font-semibold">
                      دسترسی موتورهای جستجو
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      مشخص کنید این محصول در گوگل ایندکس شود و لینک‌هایش دنبال
                      شوند یا نه. محصول ایندکس‌نشده از نقشه‌ی سایت هم حذف
                      می‌شود.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <RHFBooleanSegment
                      name="indexable"
                      label="ایندکس"
                      yesLabel="ایندکس شود"
                      noLabel="ایندکس نشود"
                    />
                    <RHFBooleanSegment
                      name="followable"
                      label="فالو"
                      yesLabel="فالو شود"
                      noLabel="فالو نشود"
                    />
                  </div>
                </div>
              </div>
            </div>

            <RHFImageUploader
              name="image"
              label="تصویر محصول"
              setValue={setValue}
              error={errors.image}
              maxSize={5 * 1024 * 1024}
              accept="image/webp"
              aspectRatio={1}
              className="col-span-2"
              defaultValue={
                selectedData?.image
                  ? process.env.NEXT_PUBLIC_IMAGE_URL + selectedData.image
                  : null
              }
            />
            <Button
              type="submit"
              loading={
                createProductMutation.isPending || editProductMutation.isPending
              }
              size="lg"
              className="w-full col-span-2"
            >
              {incomingVariant
                ? 'ذخیره و افزودن کالای راهکاران'
                : isEdit
                  ? 'ویرایش محصول'
                  : 'ثبت محصول'}
            </Button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
