export interface CategoriesResponse {
  id: number;
  name: string;
  image: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  parentId: number | null;
  isInHeroSection: boolean;
  isInHome: boolean;
  orderInHome: number;
  orderInHero: number;
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
  orderInHome?: number | null | undefined; // تغییر
  orderInHero?: number | null | undefined; // تغییر
}
