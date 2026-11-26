import { useQuery } from '@tanstack/react-query';

import { merchantCustomersService } from '@/services/merchantCustomers';

export const useMerchantCustomers = (search?: string) => {
  return useQuery({
    queryKey: ['establishment', 'customers', search?.trim() || ''],
    queryFn: () => merchantCustomersService.getCustomers(search),
  });
};
