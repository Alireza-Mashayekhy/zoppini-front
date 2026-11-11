/** Next route params can be percent-encoded; the API needs exactly one encoded segment. */
export function normalizeCategorySlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    // A literal '%' in an already decoded slug is valid category data.
    return slug;
  }
}

export function categorySlugSegment(slug: string): string {
  return encodeURIComponent(normalizeCategorySlug(slug));
}
