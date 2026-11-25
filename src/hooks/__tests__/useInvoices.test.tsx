import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useProcessInvoice, useInvoiceDetails } from '../useInvoices';
import * as invoicesService from '@/services/invoices';

jest.mock('@/services/invoices');

let activeQueryClient: QueryClient | null = null;

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  activeQueryClient = queryClient;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'InvoicesQueryClientWrapper';
  return { Wrapper, queryClient };
};

describe('useInvoices hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    activeQueryClient?.clear();
    activeQueryClient = null;
  });

  const mockResponse: invoicesService.ProcessInvoiceResponse = {
    invoice: {
      id: 42,
      accessKey: '42230912345678000195650010000001231000001234',
      totalAmount: 150.0,
      status: 'PROCESSED',
    },
    pointsAwarded: 150,
    status: 'PROCESSED',
    rejectionReason: null,
    balance: {
      id: 10,
      currentBalance: 450,
      totalAccumulated: 450,
    },
    establishment: {
      id: 5,
      tradeName: 'Padaria Real',
      cnpj: '12345678000195',
    },
  };

  it('useProcessInvoice deve processar nota e invalidar caches de saldos e extratos', async () => {
    (invoicesService.processInvoice as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { Wrapper, queryClient } = createTestWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = await renderHook(() => useProcessInvoice(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        accessKey: '42230912345678000195650010000001231000001234',
        issuerState: 'SC',
      });
    });

    expect(invoicesService.processInvoice).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['customer', 'balances'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['customer', 'invoices'] });
  });

  it('useInvoiceDetails deve buscar dados de uma nota específica', async () => {
    (invoicesService.getInvoiceDetails as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { Wrapper } = createTestWrapper();
    const { result } = await renderHook(() => useInvoiceDetails(42), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(invoicesService.getInvoiceDetails).toHaveBeenCalledWith(42);
  });
});
