import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import {
  AssignGuidesDto,
  AssignmentPreview,
  CareGuideListItem,
  CareGuideResponse,
  Dependents,
  GuideType,
  GuideUsage,
  MeasurementGuideListItem,
  MeasurementGuideResponse,
  ProductGuidesForCustomer,
  ProductGuideState,
  SizeTableListItem,
  SizeTableResponse,
  UpsertCareGuideDto,
  UpsertSizeTableDto,
} from './type';

type GuideMutationResponse<T> = ApiSingleResponse<T> & {
  warnings?: string[];
  dependents?: Dependents;
};

const listQuery = (query: {
  page?: number;
  search?: string;
  all?: boolean;
  limit?: number;
  includeArchived?: boolean;
}) => {
  return {
    ...query,
    includeArchived: query.includeArchived ? 'true' : undefined,
  };
};

// ============================================================
// جدول سایزبندی
// ============================================================

export async function sizeTablesList(query: {
  page?: number;
  search?: string;
  all?: boolean;
  includeArchived?: boolean;
}) {
  const { data } = await api.get<ApiListResponse<SizeTableListItem>>(
    endpoints.productGuides.sizeTables,
    { params: listQuery(query) },
  );

  return data;
}

export async function getSizeTable(id: number) {
  const { data } = await api.get<ApiSingleResponse<SizeTableResponse>>(
    endpoints.productGuides.sizeTable(id),
  );

  return data;
}

export async function createSizeTable(payload: UpsertSizeTableDto) {
  const { data } = await api.post<GuideMutationResponse<SizeTableResponse>>(
    endpoints.productGuides.sizeTables,
    payload,
  );

  return data;
}

export async function updateSizeTable(id: number, payload: UpsertSizeTableDto) {
  const { data } = await api.patch<GuideMutationResponse<SizeTableResponse>>(
    endpoints.productGuides.sizeTable(id),
    payload,
  );

  return data;
}

export async function duplicateSizeTable(id: number, name?: string) {
  const { data } = await api.post<ApiSingleResponse<{ id: number }>>(
    endpoints.productGuides.sizeTableDuplicate(id),
    { name },
  );

  return data;
}

export async function archiveSizeTable(id: number, isArchived: boolean) {
  const { data } = await api.patch(
    endpoints.productGuides.sizeTableArchive(id),
    { isArchived },
  );

  return data;
}

export async function deleteSizeTable(
  id: number,
  options: { replaceWithId?: number; force?: boolean } = {},
) {
  const { data } = await api.delete(endpoints.productGuides.sizeTable(id), {
    params: {
      replaceWithId: options.replaceWithId,
      force: options.force ? 'true' : undefined,
    },
  });

  return data;
}

// ============================================================
// راهنمای شست‌وشو
// ============================================================

export async function careGuidesList(query: {
  page?: number;
  search?: string;
  all?: boolean;
  includeArchived?: boolean;
}) {
  const { data } = await api.get<ApiListResponse<CareGuideListItem>>(
    endpoints.productGuides.careGuides,
    { params: listQuery(query) },
  );

  return data;
}

export async function getCareGuide(id: number) {
  const { data } = await api.get<ApiSingleResponse<CareGuideResponse>>(
    endpoints.productGuides.careGuide(id),
  );

  return data;
}

export async function createCareGuide(payload: UpsertCareGuideDto) {
  const { data } = await api.post<GuideMutationResponse<CareGuideResponse>>(
    endpoints.productGuides.careGuides,
    payload,
  );

  return data;
}

export async function updateCareGuide(id: number, payload: UpsertCareGuideDto) {
  const { data } = await api.patch<GuideMutationResponse<CareGuideResponse>>(
    endpoints.productGuides.careGuide(id),
    payload,
  );

  return data;
}

export async function duplicateCareGuide(id: number, name?: string) {
  const { data } = await api.post<ApiSingleResponse<{ id: number }>>(
    endpoints.productGuides.careGuideDuplicate(id),
    { name },
  );

  return data;
}

export async function archiveCareGuide(id: number, isArchived: boolean) {
  const { data } = await api.patch(
    endpoints.productGuides.careGuideArchive(id),
    { isArchived },
  );

  return data;
}

export async function deleteCareGuide(
  id: number,
  options: { replaceWithId?: number; force?: boolean } = {},
) {
  const { data } = await api.delete(endpoints.productGuides.careGuide(id), {
    params: {
      replaceWithId: options.replaceWithId,
      force: options.force ? 'true' : undefined,
    },
  });

  return data;
}

// ============================================================
// تصاویر روش اندازه‌گیری
// ============================================================

export async function measurementGuidesList(query: {
  page?: number;
  search?: string;
  all?: boolean;
  includeArchived?: boolean;
}) {
  const { data } = await api.get<ApiListResponse<MeasurementGuideListItem>>(
    endpoints.productGuides.measurementGuides,
    { params: listQuery(query) },
  );

  return data;
}

export async function getMeasurementGuide(id: number) {
  const { data } = await api.get<ApiSingleResponse<MeasurementGuideResponse>>(
    endpoints.productGuides.measurementGuide(id),
  );

  return data;
}

export async function saveMeasurementGuide(formData: FormData, id?: number) {
  const { data } = await api.request<GuideMutationResponse<{ id: number }>>({
    url: id
      ? endpoints.productGuides.measurementGuide(id)
      : endpoints.productGuides.measurementGuides,
    method: id ? 'patch' : 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
}

export async function duplicateMeasurementGuide(id: number, name?: string) {
  const { data } = await api.post<ApiSingleResponse<{ id: number }>>(
    endpoints.productGuides.measurementGuideDuplicate(id),
    { name },
  );

  return data;
}

export async function archiveMeasurementGuide(id: number, isArchived: boolean) {
  const { data } = await api.patch(
    endpoints.productGuides.measurementGuideArchive(id),
    { isArchived },
  );

  return data;
}

export async function deleteMeasurementGuide(
  id: number,
  options: { replaceWithId?: number; force?: boolean } = {},
) {
  const { data } = await api.delete(
    endpoints.productGuides.measurementGuide(id),
    {
      params: {
        replaceWithId: options.replaceWithId,
        force: options.force ? 'true' : undefined,
      },
    },
  );

  return data;
}

export async function updateMeasurementImage(
  guideId: number,
  imageId: number,
  payload: { caption?: string | null; order?: number },
) {
  const { data } = await api.patch(
    endpoints.productGuides.measurementImage(guideId, imageId),
    payload,
  );

  return data;
}

export async function reorderMeasurementImages(
  guideId: number,
  imageIds: number[],
) {
  const { data } = await api.patch(
    endpoints.productGuides.measurementImageOrder(guideId),
    { imageIds },
  );

  return data;
}

export async function deleteMeasurementImage(guideId: number, imageId: number) {
  const { data } = await api.delete(
    endpoints.productGuides.measurementImage(guideId, imageId),
  );

  return data;
}

// ============================================================
// کاربرد و اختصاص
// ============================================================

export async function guideUsage(type: GuideType, id: number) {
  const { data } = await api.get<ApiSingleResponse<GuideUsage>>(
    endpoints.productGuides.usage(type, id),
  );

  return data;
}

export async function previewAssignment(payload: AssignGuidesDto) {
  const { data } = await api.post<ApiSingleResponse<AssignmentPreview>>(
    endpoints.productGuides.assignmentPreview,
    payload,
  );

  return data;
}

export async function applyAssignment(payload: AssignGuidesDto) {
  const { data } = await api.post<ApiSingleResponse<AssignmentPreview>>(
    endpoints.productGuides.assignment,
    payload,
  );

  return data;
}

// ============================================================
// راهنمای یک محصول
// ============================================================

export async function getProductGuideState(productId: number) {
  const { data } = await api.get<ApiSingleResponse<ProductGuideState>>(
    endpoints.productGuides.productState(productId),
  );

  return data;
}

export async function updateProductGuideSetting(
  productId: number,
  payload: {
    sizeTableMode?: string;
    sizeTableId?: number | null;
    careGuideMode?: string;
    careGuideId?: number | null;
    measurementGuideMode?: string;
    measurementGuideId?: number | null;
  },
) {
  const { data } = await api.patch<ApiSingleResponse<ProductGuideState>>(
    endpoints.productGuides.productSetting(productId),
    payload,
  );

  return data;
}

export async function upsertProductOverride(
  productId: number,
  payload: {
    guideType: GuideType;
    action: string;
    targetKey: string;
    value?: string | null;
  },
) {
  const { data } = await api.post<ApiSingleResponse<ProductGuideState>>(
    endpoints.productGuides.productOverrides(productId),
    payload,
  );

  return data;
}

export async function deleteProductOverride(
  productId: number,
  overrideId: number,
) {
  const { data } = await api.delete<ApiSingleResponse<ProductGuideState>>(
    endpoints.productGuides.productOverride(productId, overrideId),
  );

  return data;
}

export async function rebaseProductOverride(
  productId: number,
  overrideId: number,
) {
  const { data } = await api.post<ApiSingleResponse<ProductGuideState>>(
    endpoints.productGuides.productOverrideRebase(productId, overrideId),
  );

  return data;
}

export async function clearProductOverrides(
  productId: number,
  onlyPending = false,
) {
  const { data } = await api.delete<ApiSingleResponse<ProductGuideState>>(
    endpoints.productGuides.productOverrides(productId),
    { params: { onlyPending: onlyPending ? 'true' : undefined } },
  );

  return data;
}

// ============================================================
// مشتری
// ============================================================

export async function getProductGuidesForCustomer(slug: string) {
  const { data } = await api.get<ApiSingleResponse<ProductGuidesForCustomer>>(
    endpoints.productGuides.publicBySlug(slug),
  );

  return data;
}
