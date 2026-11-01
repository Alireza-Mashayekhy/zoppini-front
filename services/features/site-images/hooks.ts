import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminSiteImagesList, resetSiteImage, updateSiteImage } from './api';
import { UpdateSiteImageDto } from './types';

export const SITE_IMAGES_QUERY_KEY = 'site-images';

/** جایگاه‌های تصویر صفحه اصلی در پنل مدیریت */
export const useAdminSiteImages = () => {
  return useQuery({
    queryKey: [SITE_IMAGES_QUERY_KEY],
    queryFn: () => adminSiteImagesList(),
  });
};

export function useUpdateSiteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slot, dto }: { slot: string; dto: UpdateSiteImageDto }) =>
      updateSiteImage(slot, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SITE_IMAGES_QUERY_KEY] });
    },
  });
}

export function useResetSiteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slot: string) => resetSiteImage(slot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SITE_IMAGES_QUERY_KEY] });
    },
  });
}
