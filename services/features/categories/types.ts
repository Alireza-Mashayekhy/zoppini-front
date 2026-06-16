export interface CategoriesResponse {
  id: number;
  name: string;
  image: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  parentId: string;
  isInHeroSection: boolean;
  isInHome: boolean;
}

export interface createCategoryDto {
  id?: string;
  name: string;
  image: File;
  description: string;
  slug: string;
  parentId: string | null;
  isInHeroSection: boolean;
  isInHome: boolean;
}
