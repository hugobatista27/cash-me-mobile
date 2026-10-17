import { useQuery } from '@tanstack/react-query';
import {
  walletService,
  CustomerPointBalance,
  PointTransaction,
  CustomerInvoice,
} from '@/services/wallet.service';

export const WALLET_QUERY_KEYS = {
  balances: ['customer', 'balances'] as const,
  statement: (establishmentId: number | string) =>
    ['customer', 'statement', Number(establishmentId)] as const,
  invoices: ['customer', 'invoices'] as const,
  invoiceDetail: (id: number | string) => ['customer', 'invoices', id] as const,
};

// Revalidação inteligente a cada 2 minutos para dados financeiros / saldos
export const WALLET_STALE_TIME = 2 * 60 * 1000;

/**
 * Hook para obter todos os saldos do consumidor agrupados por estabelecimento (ADR-002 / RN05)
 */
export function useCustomerBalances() {
  return useQuery<CustomerPointBalance[], Error>({
    queryKey: WALLET_QUERY_KEYS.balances,
    queryFn: () => walletService.getCustomerBalances(),
    staleTime: WALLET_STALE_TIME,
  });
}

/**
 * Alias de conveniência para useCustomerBalances
 */
export const useBalances = useCustomerBalances;

/**
 * Hook para obter o extrato detalhado de movimentações em uma loja específica
 */
export function useEstablishmentStatement(establishmentId: number | string | undefined) {
  return useQuery<PointTransaction[], Error>({
    queryKey: WALLET_QUERY_KEYS.statement(establishmentId || 0),
    queryFn: () => walletService.getEstablishmentStatement(establishmentId!),
    enabled: Boolean(establishmentId),
    staleTime: WALLET_STALE_TIME,
  });
}

/**
 * Alias de conveniência para useEstablishmentStatement
 */
export const useStatement = useEstablishmentStatement;

/**
 * Hook para obter o histórico de notas fiscais processadas pelo consumidor
 */
export function useCustomerInvoices() {
  return useQuery<CustomerInvoice[], Error>({
    queryKey: WALLET_QUERY_KEYS.invoices,
    queryFn: () => walletService.getCustomerInvoices(),
    staleTime: WALLET_STALE_TIME,
  });
}

/**
 * Hook para obter os detalhes de uma nota fiscal específica com itens
 */
export function useCustomerInvoiceDetail(id: number | string | undefined) {
  return useQuery<CustomerInvoice, Error>({
    queryKey: WALLET_QUERY_KEYS.invoiceDetail(id || 0),
    queryFn: () => walletService.getCustomerInvoiceById(id!),
    enabled: Boolean(id),
    staleTime: WALLET_STALE_TIME,
  });
}
