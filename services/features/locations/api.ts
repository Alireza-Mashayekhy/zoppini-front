import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse } from '@/services/api/types';

import { City, Province } from './types';

export const getProvinces = async (): Promise<ApiListResponse<Province>> => {
  const { data } = await api.get(endpoints.locations.province);
  return data;
};

export const getCitiesByProvince = async (
  provinceId: number,
): Promise<ApiListResponse<City>> => {
  const url = endpoints.locations.cities(provinceId);
  const { data } = await api.get(url);
  return data;
};
