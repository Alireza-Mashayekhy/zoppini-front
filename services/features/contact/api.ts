import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { Contact, CreateContactDto } from './types';

export async function createContacts(dto: CreateContactDto) {
  const { data } = await api.post<ApiSingleResponse<Contact>>(
    endpoints.contact.create,
    dto,
  );

  return data;
}

export async function getContacts() {
  const { data } = await api.get<ApiListResponse<Contact>>(
    endpoints.contact.list,
  );

  return data;
}

export async function deleteContact(id: number) {
  const { data } = await api.delete(endpoints.contact.delete(id));

  return data;
}
