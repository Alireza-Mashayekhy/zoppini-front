import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { CategoriesResponse } from '../services/features/categories/types';
import {
  activeCategoryChildren,
  cleanCategoryDescription,
} from './category-landing';

function category(
  id: number,
  parentId: number | null,
  isActive = true,
): CategoriesResponse {
  return { id, parentId, isActive } as CategoriesResponse;
}

test('selects only active direct children in stable order, including string IDs from the API', () => {
  const stringParent = {
    ...category(4, 2),
    parentId: '2',
  } as unknown as CategoriesResponse;
  const input = [
    category(3, 2),
    category(2, 2),
    category(5, 2, false),
    category(6, 3),
    stringParent,
    category(1, null),
  ];
  assert.deepEqual(
    activeCategoryChildren(input, 2).map(item => item.id),
    [3, 4],
  );
});

test('sanitizes rich category text without dropping safe structure', () => {
  const result = cleanCategoryDescription(
    '<h2>عنوان</h2><p onclick="alert(1)">متن <strong>واقعی</strong><script>alert(2)</script><a href="javascript:alert(3)">لینک</a></p>',
  );
  assert.equal(
    result,
    '<h2>عنوان</h2><p>متن <strong>واقعی</strong><a>لینک</a></p>',
  );
});
