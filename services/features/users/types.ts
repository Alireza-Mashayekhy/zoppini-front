export interface UserResponse {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  birthDate?: string;
  roles?: string[];
}

export interface UsersListResponse {
  data: UserResponse[];
  pagination: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
}
