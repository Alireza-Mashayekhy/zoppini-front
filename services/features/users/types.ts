export interface UserResponse {
  fullName: string[];
  roles: string[];
  birthDate: string;
  id: number;
  phone: string;
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
