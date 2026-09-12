import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteVisit, visitStats, visitsList, VisitListQuery } from './api';

export const useVisitsList = (query: VisitListQuery) => {
  return useQuery({
    queryKey: ['visits', query],
    queryFn: () => visitsList(query),
  });
};

export const useVisitStats = () => {
  return useQuery({
    queryKey: ['visits-stats'],
    queryFn: () => visitStats(),
  });
};

export const useDeleteVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteVisit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['visits-stats'] });
    },
  });
};
