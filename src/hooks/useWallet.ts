import { useQuery } from '@tanstack/react-query';

import { walletService } from '@/services/wallet';

export const useCustomerBalances = () => {
  return useQuery({
    queryKey: ['customer', 'balances'],
    queryFn: () => walletService.getBalances(),
  });
};

export const useEstablishmentStatement = (establishmentId: number | string | undefined) => {
  return useQuery({
    queryKey: ['customer', 'statement', String(establishmentId)],
    queryFn: () => walletService.getStatement(establishmentId!),
    enabled: Boolean(establishmentId),
  });
};

export const useCustomerInvoices = () => {
  return useQuery({
    queryKey: ['customer', 'invoices'],
    queryFn: () => walletService.getInvoices(),
  });
};
