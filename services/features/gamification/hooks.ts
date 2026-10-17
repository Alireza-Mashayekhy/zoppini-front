import { useMutation, useQuery } from '@tanstack/react-query';

import {
  createGamification,
  gamificationList,
  GamificationListQuery,
  gamificationStats,
} from './api';
import { GamificationDto } from './type';

export const useGamificationList = (query: GamificationListQuery) => {
  return useQuery({
    queryKey: ['gamification', { ...query }],
    queryFn: () => gamificationList(query),
  });
};

export function useCreateGamification() {
  return useMutation({
    mutationFn: (formData: GamificationDto) => createGamification(formData),
  });
}

export const useGamificationStats = () => {
  return useQuery({
    queryKey: ['gamification-stats'],
    queryFn: () => gamificationStats(),
  });
};
