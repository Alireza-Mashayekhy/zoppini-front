import Link from 'next/link';

import ProductCard from '@/components/shared/product-card';
import {
  ProductsResponse,
  SearchSuggestionsResponse,
} from '@/services/features/products/type';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestionsResponse | null;
  /** عنوان بخش‌ها (برای صفحه‌ی محصولات کمی بزرگ‌تر نمایش داده می‌شود) */
  className?: string;
  /** تعداد ستون‌های گرید محصولات */
  gridClassName?: string;
}

const DEFAULT_GRID =
  'grid gap-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 items-stretch';

function SuggestionGroup({
  title,
  description,
  products,
  gridClassName,
}: {
  title: string;
  description?: string;
  products: ProductsResponse[];
  gridClassName: string;
}) {
  if (!products.length) {
    return null;
  }

  return (
    <section className="w-full">
      <div className="mb-4 text-right">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        ) : null}
      </div>

      <div className={gridClassName}>
        {products.map(product => (
          <ProductCard
            key={product.id}
            image={product.image}
            title={product.title}
            price={product.variants?.[0]?.price || 0}
            slug={product.slug}
            discount={product.discount}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * بخش «پیشنهادها» برای وقتی که جست‌وجو نتیجه‌ای نداشته است:
 * نزدیک‌ترین محصولات، دسته‌بندی‌های مرتبط و در نهایت پیشنهادهای عمومی.
 */
export default function SearchSuggestions({
  suggestions,
  className = '',
  gridClassName = DEFAULT_GRID,
}: SearchSuggestionsProps) {
  if (!suggestions) {
    return null;
  }

  const { related, popular, categories } = suggestions;

  const hasAnything =
    related?.length > 0 || popular?.length > 0 || categories?.length > 0;

  if (!hasAnything) {
    return null;
  }

  return (
    <div className={`w-full space-y-10 ${className}`}>
      {categories?.length > 0 && (
        <section className="w-full">
          <h3 className="mb-3 text-right text-base font-semibold text-gray-800">
            دسته‌بندی‌های مرتبط
          </h3>

          <div className="flex flex-wrap gap-2 justify-start">
            {categories.map(category => (
              <Link
                key={category.id}
                href={`/product-category/${category.slug}`}
                className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm text-gray-700 transition-colors hover:border-primary hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <SuggestionGroup
        title="نزدیک‌ترین نتایج"
        description="محصولاتی که نزدیک‌ترین عنوان را به عبارت شما دارند"
        products={related ?? []}
        gridClassName={gridClassName}
      />

      <SuggestionGroup
        title="پیشنهاد ما"
        description="محصولات تازه‌ی فروشگاه که ممکن است بخواهید"
        products={popular ?? []}
        gridClassName={gridClassName}
      />
    </div>
  );
}
