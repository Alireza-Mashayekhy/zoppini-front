import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  applyAssignment,
  archiveCareGuide,
  archiveMeasurementGuide,
  archiveSizeTable,
  careGuidesList,
  clearProductOverrides,
  createCareGuide,
  createSizeTable,
  deleteCareGuide,
  deleteMeasurementGuide,
  deleteMeasurementImage,
  deleteProductOverride,
  deleteSizeTable,
  duplicateCareGuide,
  duplicateMeasurementGuide,
  duplicateSizeTable,
  getCareGuide,
  getMeasurementGuide,
  getProductGuideState,
  getSizeTable,
  guideUsage,
  measurementGuidesList,
  previewAssignment,
  rebaseProductOverride,
  reorderMeasurementImages,
  saveMeasurementGuide,
  sizeTablesList,
  updateCareGuide,
  updateMeasurementImage,
  updateProductGuideSetting,
  updateSizeTable,
  upsertProductOverride,
} from './api';
import {
  AssignGuidesDto,
  GuideType,
  UpsertCareGuideDto,
  UpsertSizeTableDto,
} from './type';

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

// ============================================================
// لیست‌ها
// ============================================================

export const useSizeTables = (query: {
  page?: number;
  limit?: number;
  search?: string;
  all?: boolean;
  includeArchived?: boolean;
}) =>
  useQuery({
    queryKey: ['product-guides', 'size-tables', { ...query }],
    queryFn: () => sizeTablesList(query),
  });

export const useCareGuides = (query: {
  page?: number;
  limit?: number;
  search?: string;
  all?: boolean;
  includeArchived?: boolean;
}) =>
  useQuery({
    queryKey: ['product-guides', 'care-guides', { ...query }],
    queryFn: () => careGuidesList(query),
  });

export const useMeasurementGuides = (query: {
  page?: number;
  limit?: number;
  search?: string;
  all?: boolean;
  includeArchived?: boolean;
}) =>
  useQuery({
    queryKey: ['product-guides', 'measurement-guides', { ...query }],
    queryFn: () => measurementGuidesList(query),
  });

export const useSizeTable = (id?: number) =>
  useQuery({
    queryKey: ['product-guides', 'size-table', id],
    queryFn: () => getSizeTable(id!),
    enabled: Boolean(id),
  });

export const useCareGuide = (id?: number) =>
  useQuery({
    queryKey: ['product-guides', 'care-guide', id],
    queryFn: () => getCareGuide(id!),
    enabled: Boolean(id),
  });

export const useMeasurementGuide = (id?: number) =>
  useQuery({
    queryKey: ['product-guides', 'measurement-guide', id],
    queryFn: () => getMeasurementGuide(id!),
    enabled: Boolean(id),
  });

export const useGuideUsage = (type: GuideType, id?: number) =>
  useQuery({
    queryKey: ['product-guides', 'usage', type, id],
    queryFn: () => guideUsage(type, id!),
    enabled: Boolean(id),
  });

export const useProductGuideState = (productId?: number) =>
  useQuery({
    queryKey: ['product-guides', 'product', productId],
    queryFn: () => getProductGuideState(productId!),
    enabled: Boolean(productId),
  });

// ============================================================
// ابزار ساخت/ویرایش
// ============================================================

export function useGuideMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['product-guides'] });
  };

  const withSuccess =
    <T>(successMessage: string, onDone?: (result: T) => void) =>
    (result: T) => {
      invalidate();
      toast.success(successMessage);
      onDone?.(result);
    };

  const withError =
    (fallback: string, onError?: (error: unknown) => void) =>
    (error: unknown) => {
      if (onError) onError(error);
      else toast.error(errorMessage(error, fallback));
    };

  return {
    invalidate,

    /** جدول سایزبندی */
    saveSizeTable: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id?: number;
        payload: UpsertSizeTableDto;
      }) => (id ? updateSizeTable(id, payload) : createSizeTable(payload)),
      onSuccess: (result: any, variables: any) => {
        invalidate();

        const warnings: string[] = result?.warnings ?? [];

        if (warnings.length) {
          toast.warning(warnings.join(' '));
        } else {
          toast.success(
            variables?.id
              ? 'جدول سایزبندی ذخیره شد.'
              : 'جدول سایزبندی ساخته شد.',
          );
        }
      },
      onError: (error: unknown) =>
        toast.error(errorMessage(error, 'خطا در ذخیره جدول سایزبندی')),
    }),

    duplicateSizeTable: useMutation({
      mutationFn: ({ id, name }: { id: number; name?: string }) =>
        duplicateSizeTable(id, name),
      onSuccess: withSuccess('نسخه کپی ساخته شد.'),
      onError: withError('خطا در ساخت کپی'),
    }),

    archiveSizeTable: useMutation({
      mutationFn: ({ id, isArchived }: { id: number; isArchived: boolean }) =>
        archiveSizeTable(id, isArchived),
      onSuccess: withSuccess('وضعیت بایگانی جدول سایزبندی تغییر کرد.'),
      onError: withError('خطا در بایگانی'),
    }),

    deleteSizeTable: useMutation({
      mutationFn: ({
        id,
        replaceWithId,
        force,
      }: {
        id: number;
        replaceWithId?: number;
        force?: boolean;
      }) => deleteSizeTable(id, { replaceWithId, force }),
      onSuccess: withSuccess('جدول سایزبندی حذف شد.'),
      onError: withError('خطا در حذف جدول سایزبندی'),
    }),

    /** راهنمای شست‌وشو */
    saveCareGuide: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id?: number;
        payload: UpsertCareGuideDto;
      }) => (id ? updateCareGuide(id, payload) : createCareGuide(payload)),
      onSuccess: (result: any, variables: any) => {
        invalidate();

        const warnings: string[] = result?.warnings ?? [];

        if (warnings.length) toast.warning(warnings.join(' '));
        else
          toast.success(
            variables?.id
              ? 'راهنمای شست‌وشو ذخیره شد.'
              : 'راهنمای شست‌وشو ساخته شد.',
          );
      },
      onError: (error: unknown) =>
        toast.error(errorMessage(error, 'خطا در ذخیره راهنمای شست‌وشو')),
    }),

    duplicateCareGuide: useMutation({
      mutationFn: ({ id, name }: { id: number; name?: string }) =>
        duplicateCareGuide(id, name),
      onSuccess: withSuccess('نسخه کپی ساخته شد.'),
      onError: withError('خطا در ساخت کپی'),
    }),

    archiveCareGuide: useMutation({
      mutationFn: ({ id, isArchived }: { id: number; isArchived: boolean }) =>
        archiveCareGuide(id, isArchived),
      onSuccess: withSuccess('وضعیت بایگانی راهنمای شست‌وشو تغییر کرد.'),
      onError: withError('خطا در بایگانی'),
    }),

    deleteCareGuide: useMutation({
      mutationFn: ({
        id,
        replaceWithId,
        force,
      }: {
        id: number;
        replaceWithId?: number;
        force?: boolean;
      }) => deleteCareGuide(id, { replaceWithId, force }),
      onSuccess: withSuccess('راهنمای شست‌وشو حذف شد.'),
      onError: withError('خطا در حذف راهنمای شست‌وشو'),
    }),

    /** تصاویر اندازه‌گیری */
    saveMeasurementGuide: useMutation({
      mutationFn: ({ id, formData }: { id?: number; formData: FormData }) =>
        saveMeasurementGuide(formData, id),
      onSuccess: (_result, variables) => {
        invalidate();

        toast.success(
          variables?.id
            ? 'راهنمای تصویری ذخیره شد.'
            : 'راهنمای تصویری ساخته شد.',
        );
      },
      onError: withError('خطا در ذخیره راهنمای تصویری'),
    }),

    duplicateMeasurementGuide: useMutation({
      mutationFn: ({ id, name }: { id: number; name?: string }) =>
        duplicateMeasurementGuide(id, name),
      onSuccess: withSuccess('نسخه کپی ساخته شد.'),
      onError: withError('خطا در ساخت کپی'),
    }),

    archiveMeasurementGuide: useMutation({
      mutationFn: ({ id, isArchived }: { id: number; isArchived: boolean }) =>
        archiveMeasurementGuide(id, isArchived),
      onSuccess: withSuccess('وضعیت بایگانی راهنمای تصویری تغییر کرد.'),
      onError: withError('خطا در بایگانی'),
    }),

    deleteMeasurementGuide: useMutation({
      mutationFn: ({
        id,
        replaceWithId,
        force,
      }: {
        id: number;
        replaceWithId?: number;
        force?: boolean;
      }) => deleteMeasurementGuide(id, { replaceWithId, force }),
      onSuccess: withSuccess('راهنمای تصویری حذف شد.'),
      onError: withError('خطا در حذف راهنمای تصویری'),
    }),

    deleteMeasurementImage: useMutation({
      mutationFn: ({
        guideId,
        imageId,
      }: {
        guideId: number;
        imageId: number;
      }) => deleteMeasurementImage(guideId, imageId),
      onSuccess: withSuccess('تصویر حذف شد.'),
      onError: withError('خطا در حذف تصویر'),
    }),

    updateMeasurementImage: useMutation({
      mutationFn: ({
        guideId,
        imageId,
        caption,
      }: {
        guideId: number;
        imageId: number;
        caption?: string | null;
      }) => updateMeasurementImage(guideId, imageId, { caption }),
      onSuccess: withSuccess('تصویر ذخیره شد.'),
      onError: withError('خطا در ذخیره تصویر'),
    }),

    reorderMeasurementImages: useMutation({
      mutationFn: ({
        guideId,
        imageIds,
      }: {
        guideId: number;
        imageIds: number[];
      }) => reorderMeasurementImages(guideId, imageIds),
      onSuccess: withSuccess('ترتیب تصاویر ذخیره شد.'),
      onError: withError('خطا در ذخیره ترتیب'),
    }),
  };
}

// ============================================================
// اختصاص گروهی
// ============================================================

export const useAssignmentPreview = () =>
  useMutation({
    mutationFn: (payload: AssignGuidesDto) => previewAssignment(payload),
    onError: (error: unknown) =>
      toast.error(errorMessage(error, 'خطا در پیش‌نمایش اختصاص راهنما')),
  });

export function useApplyAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignGuidesDto) => applyAssignment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-guides'] });

      toast.success('راهنما با موفقیت اختصاص داده شد.');
    },
    onError: (error: unknown) =>
      toast.error(errorMessage(error, 'خطا در اختصاص راهنما')),
  });
}

// ============================================================
// راهنمای محصول
// ============================================================

export function useProductGuideMutations() {
  const queryClient = useQueryClient();

  const refresh = (productId: number, result: any) => {
    queryClient.invalidateQueries({ queryKey: ['product-guides'] });

    if (result?.data) {
      queryClient.setQueryData(
        ['product-guides', 'product', productId],
        result,
      );
    }
  };

  return {
    updateSetting: useMutation({
      mutationFn: ({ productId, payload }: any) =>
        updateProductGuideSetting(productId, payload),
      onSuccess: (result, variables: any) => {
        refresh(variables.productId, result);
        toast.success('تنظیم راهنمای محصول ذخیره شد.');
      },
      onError: (error: unknown) =>
        toast.error(errorMessage(error, 'خطا در ذخیره تنظیمات راهنما')),
    }),

    saveOverride: useMutation({
      mutationFn: ({
        productId,
        payload,
      }: {
        productId: number;
        payload: any;
      }) => upsertProductOverride(productId, payload),
      onSuccess: (result, variables) => {
        refresh(variables.productId, result);
        toast.success('تغییر اختصاصی این محصول ذخیره شد.');
      },
      onError: (error: unknown) =>
        toast.error(errorMessage(error, 'خطا در ذخیره تغییر اختصاصی')),
    }),

    removeOverride: useMutation({
      mutationFn: ({
        productId,
        overrideId,
      }: {
        productId: number;
        overrideId: number;
      }) => deleteProductOverride(productId, overrideId),
      onSuccess: (result, variables) => {
        refresh(variables.productId, result);
        toast.success('به راهنمای اصلی برگشت.');
      },
      onError: (error: unknown) =>
        toast.error(errorMessage(error, 'خطا در بازگشت به راهنمای اصلی')),
    }),

    rebaseOverride: useMutation({
      mutationFn: ({
        productId,
        overrideId,
      }: {
        productId: number;
        overrideId: number;
      }) => rebaseProductOverride(productId, overrideId),
      onSuccess: (result, variables) => {
        refresh(variables.productId, result);
        toast.success('تغییر اختصاصی روی راهنمای جدید اعمال شد.');
      },
      onError: (error: unknown) =>
        toast.error(errorMessage(error, 'خطا در بازبینی تغییر اختصاصی')),
    }),

    clearOverrides: useMutation({
      mutationFn: ({
        productId,
        onlyPending,
      }: {
        productId: number;
        onlyPending?: boolean;
      }) => clearProductOverrides(productId, onlyPending),
      onSuccess: (result, variables) => {
        refresh(variables.productId, result);
        toast.success('تغییرهای اختصاصی پاک شد.');
      },
      onError: (error: unknown) =>
        toast.error(errorMessage(error, 'خطا در پاک‌کردن تغییرهای اختصاصی')),
    }),
  };
}
