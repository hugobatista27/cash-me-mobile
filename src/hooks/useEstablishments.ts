import { useQuery } from '@tanstack/react-query';
import { establishmentsService, Establishment } from '@/services/establishments';

export const ESTABLISHMENTS_QUERY_KEYS = {
  all: ['establishments'] as const,
  list: () => [...ESTABLISHMENTS_QUERY_KEYS.all, 'list'] as const,
  detail: (id: number | string) => [...ESTABLISHMENTS_QUERY_KEYS.all, 'detail', id] as const,
};

// Revalidação inteligente a cada 10 minutos (10 * 60 * 1000 ms)
export const STALE_TIME_10_MINUTES = 10 * 60 * 1000;

/**
 * Hook para listar estabelecimentos credenciados ativos
 */
export function useEstablishments() {
  return useQuery<Establishment[], Error>({
    queryKey: ESTABLISHMENTS_QUERY_KEYS.list(),
    queryFn: () => establishmentsService.listEstablishments(),
    staleTime: STALE_TIME_10_MINUTES,
  });
}

/**
 * Hook para obter os detalhes de um estabelecimento pelo ID
 */
export function useEstablishmentDetails(id: number | string | undefined) {
  return useQuery<Establishment, Error>({
    queryKey: ESTABLISHMENTS_QUERY_KEYS.detail(id!),
    queryFn: () => establishmentsService.getEstablishmentById(id!),
    enabled: Boolean(id),
    staleTime: STALE_TIME_10_MINUTES,
  });
}
