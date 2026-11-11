import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  categorySlugSegment,
  normalizeCategorySlug,
} from '../lib/category-slug';

for (const slug of ['پوشاک', 'پیراهن-مردانه', 'special?#%', 'shirt']) {
  test(`category slug ${slug} is encoded exactly once`, () => {
    assert.equal(categorySlugSegment(slug), encodeURIComponent(slug));
    assert.equal(
      categorySlugSegment(encodeURIComponent(slug)),
      encodeURIComponent(slug),
    );
    assert.equal(normalizeCategorySlug(encodeURIComponent(slug)), slug);
  });
}
