'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import BlogCard from '@/components/shared/blog-card';
import CustomPagination from '@/components/shared/custom-pagination';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { ApiListResponse } from '@/services/api/types';
import { useBlogList } from '@/services/features/blog/hooks';
import { BlogPostResponse } from '@/services/features/blog/types';

interface BlogListProps {
  initialData: ApiListResponse<BlogPostResponse>;
  initialParams: { page?: number; search?: string };
}

export default function BlogList({ initialData, initialParams }: BlogListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(initialParams.page ?? 1);
  const [search, setSearch] = useState(initialParams.search ?? '');
  const debouncedSearch = useDebounce(search, 500);

  const { data } = useBlogList({
    page,
    search: debouncedSearch || undefined,
  });

  const posts = data?.data ?? initialData.data;
  const pagination = data?.pagination ?? initialData.pagination;

  const updateUrl = (newPage: number, newSearch: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) params.set('page', String(newPage));
    else params.delete('page');
    if (newSearch) params.set('search', newSearch);
    else params.delete('search');
    router.replace(`/blog?${params.toString()}`);
  };

  /**
   * آدرسِ واقعیِ هر صفحه برای لینک‌های صفحه‌بندی.
   *
   * قبل از این تغییر، دکمه‌های صفحه‌بندی فقط `onClick` داشتند و هیچ `<a href>`
   * تولید نمی‌کردند؛ بنابراین خزنده نمی‌توانست صفحات ۲ به بعد وبلاگ را کشف کند
   * و مقالاتِ قدیمی‌تر فقط از طریق نقشه سایت پیدا می‌شدند. حالا هر دکمه یک لینک
   * واقعی با پارامترهای جاری (page و search) است و در عین حال کلیکِ آن همچنان
   * سمت کلاینت و بدون بارگذاری مجدد انجام می‌شود.
   */
  const hrefForPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) params.set('page', String(newPage));
    else params.delete('page');

    const query = params.toString();

    return query ? `/blog?${query}` : '/blog';
  };

  return (
    <div className="flex flex-col gap-8">
      <Input
        placeholder="جستجو در مقالات..."
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setPage(1);
          updateUrl(1, e.target.value);
        }}
        className="max-w-md bg-white"
      />

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-20">
          مقاله‌ای یافت نشد
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
          {posts.map(post => (
            <BlogCard
              key={post.id}
              title={post.title}
              excerpt={post.excerpt}
              coverImage={post.coverImage}
              slug={post.slug}
              publishedAt={post.publishedAt}
            />
          ))}
        </div>
      )}

      <CustomPagination
        totalPages={pagination?.totalPages ?? 1}
        currentPage={page}
        hrefForPage={hrefForPage}
        onPageChange={newPage => {
          setPage(newPage);
          updateUrl(newPage, debouncedSearch);
        }}
      />
    </div>
  );
}
