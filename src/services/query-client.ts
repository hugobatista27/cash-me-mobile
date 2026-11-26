import { QueryClient } from '@tanstack/react-query';

/**
 * Instância configurada do QueryClient com os padrões da aplicação:
 * - staleTime: 2 minutos (120.000 ms)
 * - gcTime: 30 minutos (1.800.000 ms)
 * - retry: 2 tentativas
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;
