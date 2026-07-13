// services/features/b2b/types.ts
export interface B2bResponse {
  id: number;
  fullName: string;
  companyName: string;
  position?: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateB2bDto {
  fullName: string;
  companyName: string;
  position?: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}
