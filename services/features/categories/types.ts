export interface CategoriesResponse {
  id: number;
  name: string;
  image: string;
  secondImages: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  parentId: number | null;
  isInHeroSection: boolean;
  isInHome: boolean;
  orderInHome: number;
  orderInHero: number;
  isActive: boolean;
}

export interface createCategoryDto {
  id?: string;
  name: string;
  image: File;
  secondImages?: (File | string)[];
  description: string;
  slug: string;
  parentId: string | null;
  isInHeroSection: boolean;
  isInHome: boolean;
  orderInHome?: number | null | undefined; // تغییر
  orderInHero?: number | null | undefined; // تغییر
  isActive?: boolean;
}
