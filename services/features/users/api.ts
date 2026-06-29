import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse } from '@/services/api/types';

import { UserResponse } from './types';

export async function usersList(query: { page: number; search: string }) {
  const { data } = await api.get<ApiListResponse<UserResponse>>(
    endpoints.users.list,
    {
      params: query,
    },
  );

  return data;
}

export const updateUser = async (
  id: number,
  data: Partial<UserResponse>,
): Promise<UserResponse> => {
  const url = endpoints.users.edit(id);
  const { data: response } = await api.patch(url, data);

  return response.data;
};
