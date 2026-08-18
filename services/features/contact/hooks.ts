import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createContacts, deleteContact, getContacts } from './api';
import { CreateContactDto } from './types';

export function useCreateContact() {
  return useMutation({
    mutationFn: (dto: CreateContactDto) => createContacts(dto),
  });
}

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContact,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['contacts'],
      });
    },
  });
}
