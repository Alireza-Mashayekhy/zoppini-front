import type { CategoriesResponse } from '@/services/features/categories/types';

export type CategoryNode = CategoriesResponse & { children: CategoryNode[] };

export function makeCategoryTree(
  categories: CategoriesResponse[],
): CategoryNode[] {
  const ids = new Set(categories.map(category => category.id));
  const byParent = new Map<number | null, CategoriesResponse[]>();

  for (const category of categories) {
    const parentId =
      category.parentId == null ? null : Number(category.parentId);
    // A missing or self-referencing parent should not hide the category.
    const effectiveParent =
      parentId === null || parentId === category.id || !ids.has(parentId)
        ? null
        : parentId;
    const siblings = byParent.get(effectiveParent) ?? [];
    siblings.push(category);
    byParent.set(effectiveParent, siblings);
  }

  const build = (
    parentId: number | null,
    ancestors: Set<number>,
  ): CategoryNode[] =>
    (byParent.get(parentId) ?? [])
      .filter(category => !ancestors.has(category.id))
      .map(category => ({
        ...category,
        children: build(category.id, new Set(ancestors).add(category.id)),
      }));

  return build(null, new Set());
}
