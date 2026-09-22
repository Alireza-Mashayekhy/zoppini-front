export type GuideType = 'size-table' | 'care-guide' | 'measurement-guide';

export type GuideMode = 'inherit' | 'custom' | 'hidden';

export type GuideOverrideAction =
  'cell-value' | 'set-text' | 'hide' | 'replace-image';

// ============================================================
// جدول سایزبندی
// ============================================================

export interface SizeTableColumnDto {
  id?: number;
  label: string;
}

export interface SizeTableRowDto {
  id?: number;
  label: string;
  /** مقدار هر خانه به ترتیب ستون‌ها — خالی یعنی «اندازه وارد نشده» */
  values: (string | null)[];
}

export interface SizeTableResponse {
  id: number;
  name: string;
  unit: string;
  notes?: string | null;
  isArchived?: boolean;
  columns: SizeTableColumnDto[];
  rows: SizeTableRowDto[];
}

export interface UpsertSizeTableDto {
  name: string;
  unit?: string;
  notes?: string | null;
  columns: { id?: number; label: string }[];
  rows: { id?: number; label: string; values?: (string | null)[] }[];
}

export interface SizeTableListItem {
  id: number;
  name: string;
  unit: string;
  notes?: string | null;
  isArchived: boolean;
  columnCount: number;
  rowCount: number;
  updatedAt: string;
}

// ============================================================
// راهنمای شست‌وشو
// ============================================================

export interface CareInstructionResponse {
  id: number;
  text: string;
  iconKey?: string | null;
}

export interface CareGuideResponse {
  id: number;
  name: string;
  notes?: string | null;
  isArchived?: boolean;
  instructions: CareInstructionResponse[];
}

export interface UpsertCareGuideDto {
  name: string;
  notes?: string | null;
  instructions: { id?: number; text: string; iconKey?: string | null }[];
}

export interface CareGuideListItem {
  id: number;
  name: string;
  notes?: string | null;
  isArchived: boolean;
  instructionCount: number;
  updatedAt: string;
}

// ============================================================
// تصاویر روش اندازه‌گیری
// ============================================================

export interface MeasurementImageResponse {
  id: number;
  file: string;
  caption?: string | null;
  order?: number;
}

export interface MeasurementGuideResponse {
  id: number;
  name: string;
  notes?: string | null;
  isArchived?: boolean;
  images: MeasurementImageResponse[];
}

export interface MeasurementGuideListItem {
  id: number;
  name: string;
  notes?: string | null;
  isArchived: boolean;
  imageCount: number;
  updatedAt: string;
}

// ============================================================
// کاربرد راهنما
// ============================================================

export interface GuideUsage {
  type: GuideType;
  guideId: number;
  categories: { settingId: number; id: number; name: string }[];
  directProducts: {
    settingId: number;
    id: number;
    title: string;
    categories: { id: number; name: string }[];
  }[];
  productsByCategory: { id: number; title: string }[];
  totalProducts: number;
  overrides: {
    productCount: number;
    overrideCount: number;
    items: { id: number; title: string; count: number }[];
  };
}

export interface Dependents {
  categories: number;
  products: number;
  overridingProducts?: number;
}

// ============================================================
// اختصاص
// ============================================================

export interface AssignGuidesDto {
  categoryIds?: number[];
  productIds?: number[];
  /** null یعنی پاک‌کردن راهنمای این بخش، undefined یعنی بدون تغییر */
  sizeTableId?: number | null;
  careGuideId?: number | null;
  measurementGuideId?: number | null;
}

export interface AssignmentConflict {
  productId: number;
  productTitle: string;
  type: GuideType;
  guideIds: number[];
  categories: { id: number; name: string; guideId: number }[];
}

export interface AssignmentPreview {
  categories: {
    id: number;
    name: string;
    current: {
      sizeTableId: number | null;
      careGuideId: number | null;
      measurementGuideId: number | null;
    } | null;
  }[];
  directProducts: { id: number; title: string; categoryCount: number }[];
  selectedCategoryCount: number;
  selectedProductCount: number;
  affectedProductCount: number;
  affectedProducts: {
    id: number;
    title: string;
    categoryCount: number;
    overrideCount: number;
  }[];
  conflicts: AssignmentConflict[];
  explicitChoices: {
    productId: number;
    productTitle: string;
    type: GuideType;
  }[];
}

// ============================================================
// وضعیت راهنمای محصول
// ============================================================

export interface ResolvedSizeTable {
  id: number;
  name: string;
  unit: string;
  notes?: string | null;
  columns: { id: number; label: string; overridden?: boolean }[];
  rows: {
    id: number;
    label: string;
    overridden?: boolean;
    values: { columnId: number; value: string | null; overridden?: boolean }[];
  }[];
}

export interface ResolvedCareGuide {
  id: number;
  name: string;
  notes?: string | null;
  instructions: {
    id: number;
    text: string;
    iconKey?: string | null;
    overridden?: boolean;
  }[];
}

export interface ResolvedMeasurementGuide {
  id: number;
  name: string;
  notes?: string | null;
  images: {
    id: number;
    file: string;
    caption?: string | null;
    overridden?: boolean;
  }[];
}

export interface PendingOverrideReview {
  id: number;
  type: GuideType;
  action: GuideOverrideAction;
  targetKey: string;
  value: string | null;
  baseGuideId: number | null;
  currentGuideId: number | null;
  label: string;
}

export interface GuideConflict {
  type: GuideType;
  guideIds: number[];
  categories: { categoryId: number; categoryName?: string; guideId: number }[];
}

export interface ResolvedProductGuides {
  sizeTable: ResolvedSizeTable | null;
  careGuide: ResolvedCareGuide | null;
  measurementGuide: ResolvedMeasurementGuide | null;
  hidden: GuideType[];
  conflicts: GuideConflict[];
  pendingReview: PendingOverrideReview[];
  staleOverrides: PendingOverrideReview[];
  archivedGuides: GuideType[];
}

export interface ProductGuideState {
  product: {
    id: number;
    title: string;
    slug: string;
    categories: { id: number; name: string }[];
  };
  setting: {
    sizeTableMode: GuideMode;
    sizeTableId: number | null;
    careGuideMode: GuideMode;
    careGuideId: number | null;
    measurementGuideMode: GuideMode;
    measurementGuideId: number | null;
  } | null;
  overrides: {
    id: number;
    guideType: GuideType;
    action: GuideOverrideAction;
    targetKey: string;
    value: string | null;
    baseGuideId: number | null;
  }[];
  resolved: ResolvedProductGuides;
}

export interface ProductGuidesForCustomer {
  sizeTable: ResolvedSizeTable | null;
  careGuide: ResolvedCareGuide | null;
  measurementGuide: ResolvedMeasurementGuide | null;
}

/** شناسه علامت‌های شست‌وشو که در پنل قابل انتخاب است */
export const CARE_ICON_KEYS = [
  'wash-30',
  'wash-hand',
  'wash-cold',
  'no-wash',
  'no-bleach',
  'iron-low',
  'no-iron',
  'dry-flat',
  'no-tumble',
  'dry-clean',
] as const;

export type CareIconKey = (typeof CARE_ICON_KEYS)[number];
