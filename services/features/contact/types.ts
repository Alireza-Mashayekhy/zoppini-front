export interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactListResponse {
  data: Contact[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface CreateContactDto {
  name: string;
  email?: string;
  phone: string;
  message: string;
}
