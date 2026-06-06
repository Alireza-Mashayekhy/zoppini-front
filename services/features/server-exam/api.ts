import { serverFetch } from '@/services/api/server';

export async function getUsersServer() {
  return serverFetch<string[]>('/exam');
}
