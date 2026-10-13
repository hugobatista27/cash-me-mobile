import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  processInvoice,
  getInvoiceDetails,
  ProcessInvoicePayload,
  ProcessInvoiceResponse,
} from '@/services/invoices';

/**
 * Hook de mutação para envio e processamento de notas fiscais (NFC-e).
 * Ao obter sucesso, invalida os caches de saldos, extratos e histórico de notas do consumidor.
 */
export const useProcessInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation<ProcessInvoiceResponse, Error, ProcessInvoicePayload>({
    mutationFn: (payload: ProcessInvoicePayload) => processInvoice(payload),
    onSuccess: (data) => {
      // Invalida saldos gerais
      queryClient.invalidateQueries({ queryKey: ['customer', 'balances'] });
      // Invalida histórico de notas
      queryClient.invalidateQueries({ queryKey: ['customer', 'invoices'] });

      // Se houver estabelecimento identificado, invalida o extrato específico
      if (data.establishment?.id) {
        queryClient.invalidateQueries({
          queryKey: ['customer', 'statement', data.establishment.id],
        });
      }
    },
  });
};

/**
 * Hook de consulta para obter detalhes de uma nota fiscal pelo ID
 */
export const useInvoiceDetails = (id: number | string | undefined) => {
  return useQuery<ProcessInvoiceResponse, Error>({
    queryKey: ['customer', 'invoices', id],
    queryFn: () => getInvoiceDetails(id!),
    enabled: Boolean(id),
  });
};
