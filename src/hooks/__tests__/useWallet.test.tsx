import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  useCustomerBalances,
  useEstablishmentStatement,
  useCustomerInvoices,
  useCustomerInvoiceDetail,
} from '../useWallet';
import {
  walletService,
  CustomerPointBalance,
  PointTransaction,
  CustomerInvoice,
} from '@/services/wallet.service';

jest.mock('@/services/wallet.service');

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'WalletQueryWrapper';
  return { Wrapper, queryClient };
};

describe('useWallet hooks (TASK-04)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBalances: CustomerPointBalance[] = [
    {
      id: 1,
      currentBalance: 350,
      totalAccumulated: 500,
      establishment: {
        id: 5,
        cnpj: '12345678000195',
        tradeName: 'Padaria Real',
        status: 'ACTIVE',
      },
    },
  ];

  const mockStatement: PointTransaction[] = [
    {
      id: 101,
      type: 'CREDIT',
      points: 150,
      description: 'Pontos gerados por NFC-e',
      createdAt: '2026-10-10T14:30:00Z',
    },
  ];

  const mockInvoices: CustomerInvoice[] = [
    {
      id: 42,
      accessKey: '42230912345678000195650010000001231000001234',
      totalAmount: 150.0,
      pointsAwarded: 150,
      status: 'PROCESSED',
      createdAt: '2026-10-10T14:30:00Z',
    },
  ];

  it('useCustomerBalances deve consultar e armazenar saldos isolados por loja', async () => {
    (walletService.getCustomerBalances as jest.Mock).mockResolvedValueOnce(mockBalances);

    const { Wrapper } = createTestWrapper();
    const { result } = await renderHook(() => useCustomerBalances(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockBalances);
    expect(walletService.getCustomerBalances).toHaveBeenCalledTimes(1);
  });

  it('useEstablishmentStatement deve consultar o extrato de uma loja específica', async () => {
    (walletService.getEstablishmentStatement as jest.Mock).mockResolvedValueOnce(mockStatement);

    const { Wrapper } = createTestWrapper();
    const { result } = await renderHook(() => useEstablishmentStatement(5), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockStatement);
    expect(walletService.getEstablishmentStatement).toHaveBeenCalledWith(5);
  });

  it('useCustomerInvoices deve consultar a lista de notas fiscais', async () => {
    (walletService.getCustomerInvoices as jest.Mock).mockResolvedValueOnce(mockInvoices);

    const { Wrapper } = createTestWrapper();
    const { result } = await renderHook(() => useCustomerInvoices(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockInvoices);
    expect(walletService.getCustomerInvoices).toHaveBeenCalledTimes(1);
  });

  it('useCustomerInvoiceDetail deve consultar os detalhes de uma nota por ID', async () => {
    (walletService.getCustomerInvoiceById as jest.Mock).mockResolvedValueOnce(mockInvoices[0]);

    const { Wrapper } = createTestWrapper();
    const { result } = await renderHook(() => useCustomerInvoiceDetail(42), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockInvoices[0]);
    expect(walletService.getCustomerInvoiceById).toHaveBeenCalledWith(42);
  });
});
