export interface BlogAuthorResponse {
  id: number;
  fullName: string;
}

export interface BlogPostResponse {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  authorId: number | null;
  author: BlogAuthorResponse | null;
}

export interface createBlogPostDto {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image?: File;
  isPublished: boolean;
  isFeatured: boolean;
}
