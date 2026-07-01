import { Suspense } from 'react';

import BlogList from '@/components/pages/blog/blog-list';
import { getBlogPosts } from '@/services/features/blog/server.api';

interface BlogPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const queryParams = {
    page: params.page ? Number(params.page) : 1,
    search: params.search,
    limit: 12,
  };

  const blogData = await getBlogPosts(queryParams);

  return (
    <div className="pt-[52px] custom-container py-10">
      <h1 className="text-3xl font-light my-10">مقالات</h1>
      <Suspense>
        <BlogList initialData={blogData} initialParams={queryParams} />
      </Suspense>
    </div>
  );
}
