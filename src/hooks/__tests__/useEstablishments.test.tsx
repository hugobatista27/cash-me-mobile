import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  useEstablishments,
  useEstablishmentDetails,
} from '../useEstablishments';
import { establishmentsService, Establishment } from '@/services/establishments';

jest.mock('@/services/establishments');

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'EstablishmentsQueryWrapper';
  return { Wrapper, queryClient };
};

describe('useEstablishments hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEstablishments: Establishment[] = [
    {
      id: 1,
      cnpj: '12345678000195',
      legalName: 'Padaria Real Ltda',
      tradeName: 'Padaria Real',
      status: 'ACTIVE',
      conversionFactor: 1.0,
      phone: '48999990001',
      address: {
        postalCode: '88010000',
        state: 'SC',
        city: 'Florianópolis',
        neighborhood: 'Centro',
        street: 'Rua Felipe Schmidt',
        number: '100',
      },
    },
  ];

  it('useEstablishments deve carregar lista de estabelecimentos com staleTime de 10 min', async () => {
    (establishmentsService.listEstablishments as jest.Mock).mockResolvedValueOnce(
      mockEstablishments
    );

    const { Wrapper } = createTestWrapper();
    const { result } = await renderHook(() => useEstablishments(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockEstablishments);
    expect(establishmentsService.listEstablishments).toHaveBeenCalledTimes(1);
  });

  it('useEstablishmentDetails deve carregar detalhes do estabelecimento por ID', async () => {
    const detail = mockEstablishments[0];
    (establishmentsService.getEstablishmentById as jest.Mock).mockResolvedValueOnce(detail);

    const { Wrapper } = createTestWrapper();
    const { result } = await renderHook(() => useEstablishmentDetails(1), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(detail);
    expect(establishmentsService.getEstablishmentById).toHaveBeenCalledWith(1);
  });
});
