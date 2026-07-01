import { useQuery } from '@tanstack/react-query';

import { getCitiesByProvince, getProvinces } from './api';

export const useProvinces = () => {
  return useQuery({
    queryKey: ['provinces'],
    queryFn: getProvinces,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useCities = (provinceId: number) => {
  return useQuery({
    queryKey: ['cities', provinceId],
    queryFn: () => getCitiesByProvince(provinceId),
    enabled: !!provinceId,
    staleTime: 24 * 60 * 60 * 1000,
  });
};
