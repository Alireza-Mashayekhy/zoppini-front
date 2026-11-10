import sanitizeHtml from 'sanitize-html';

import type { CategoriesResponse } from '@/services/features/categories/types';

/** Preserve the editor's text structure, but never trust its HTML. */
export function cleanCategoryDescription(html: string): string {
  return sanitizeHtml(html || '', {
    allowedTags: [
      'p',
      'br',
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      'b',
      'i',
      'a',
    ],
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

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
