import { serverFetch } from '@/services/api/server';

import { UserResponse } from '../users/types';

export async function getMe() {
  return serverFetch<UserResponse>('auth/me');
}
