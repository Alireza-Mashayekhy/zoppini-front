export interface CategoriesResponse {
  id: number;
  name: string;
  image: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  parentId: string;
}

export interface createCategoryDto {
  name: string;
  image: File;
  description: string;
  slug: string;
  parentId: string | null;
}
