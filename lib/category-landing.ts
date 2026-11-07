import type { CategoriesResponse } from '@/services/features/categories/types';

/** The API has no category landing order. Use stable IDs, not homepage ordering. */
export function activeCategoryChildren(
  categories: CategoriesResponse[],
  parentId: number,
) {
  return categories
    .filter(
      child =>
        child.isActive &&
        child.id !== parentId &&
        child.parentId != null &&
        Number(child.parentId) === parentId,
    )
    .sort((a, b) => a.id - b.id);
}
