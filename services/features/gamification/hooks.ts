import { useMutation, useQuery } from '@tanstack/react-query';

import { createGamification, gamificationList } from './api';
import { GamificationDto } from './type';

export const useGamificationList = (query: {
  page?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['gamification'],
    queryFn: () => gamificationList(query),
  });
};

export function useCreateGamification() {
  return useMutation({
    mutationFn: (formData: GamificationDto) => createGamification(formData),
  });
}
