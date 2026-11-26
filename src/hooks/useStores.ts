import { useQuery } from '@tanstack/react-query';

import { storesService } from '@/services/stores';

export const useStores = () => {
  return useQuery({
    queryKey: ['establishments', 'list'],
    queryFn: () => storesService.getStores(),
    staleTime: 1000 * 60 * 10,
  });
};

export const useStoreDetails = (id: number | string | undefined) => {
  return useQuery({
    queryKey: ['establishments', 'detail', String(id)],
    queryFn: () => storesService.getStoreById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 10,
  });
};
