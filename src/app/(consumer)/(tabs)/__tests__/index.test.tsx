import { fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';

import ConsumerHomeScreen from '../index';
import * as useWalletModule from '@/hooks/useWallet';
import { CustomerInvoice, CustomerPointBalance } from '@/services/wallet.service';
import { useAuthStore } from '@/stores/use-auth-store';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useWallet');
jest.mock('@/stores/use-auth-store');

describe('ConsumerHomeScreen (TASK-04)', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { id: 1, email: 'ana@cashme.com', role: 'CUSTOMER' },
      profile: { id: 1, fullName: 'Ana Clara', cpf: '12345678901' },
    });
  });

  const mockBalances: CustomerPointBalance[] = [
    {
      id: 1,
      establishmentId: 10,
      currentBalance: 320,
      totalAccumulated: 500,
      establishment: {
        id: 10,
        cnpj: '12345678000195',
        tradeName: 'Padaria Real',
        status: 'ACTIVE',
      },
    },
    {
      id: 2,
      establishmentId: 20,
      currentBalance: 180,
      totalAccumulated: 180,
      establishment: {
        id: 20,
        cnpj: '98765432000110',
        tradeName: 'Supermercado Central',
        status: 'ACTIVE',
      },
    },
  ];

  const mockInvoices: CustomerInvoice[] = [
    {
      id: 101,
      accessKey: '42230912345678000195650010000001231000001234',
      totalAmount: 120.5,
      pointsAwarded: 120,
      status: 'PROCESSED',
      createdAt: '2026-10-12T10:00:00Z',
      establishment: {
        id: 10,
        cnpj: '12345678000195',
        tradeName: 'Padaria Real',
        status: 'ACTIVE',
      },
    },
  ];

  it('deve exibir saudação com nome do consumidor e pontos totais agregados (500 pts)', async () => {
    (useWalletModule.useCustomerBalances as jest.Mock).mockReturnValue({
      data: mockBalances,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    (useWalletModule.useCustomerInvoices as jest.Mock).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerHomeScreen />);

    expect(getByText(/Ana Clara/)).toBeTruthy();
    expect(getByText(/500/)).toBeTruthy();
  });

  it('deve exibir carrossel das lojas onde o consumidor pontuou e navegar para o extrato ao tocar', async () => {
    (useWalletModule.useCustomerBalances as jest.Mock).mockReturnValue({
      data: mockBalances,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    (useWalletModule.useCustomerInvoices as jest.Mock).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText, getByTestId } = await render(<ConsumerHomeScreen />);

    expect(getByText('Suas Lojas com Saldo')).toBeTruthy();
    expect(getByText('Supermercado Central')).toBeTruthy();

    fireEvent.press(getByTestId('home-store-balance-10'));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(consumer)/statement/[id]',
        params: expect.objectContaining({
          id: '10',
          tradeName: 'Padaria Real',
        }),
      })
    );
  });

  it('deve exibir histórico recente de notas fiscais e navegar para detalhes ao tocar', async () => {
    (useWalletModule.useCustomerBalances as jest.Mock).mockReturnValue({
      data: mockBalances,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    (useWalletModule.useCustomerInvoices as jest.Mock).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText, getByTestId } = await render(<ConsumerHomeScreen />);

    expect(getByText('Notas Fiscais Recentes')).toBeTruthy();
    expect(getByText(/\+120 pts/)).toBeTruthy();

    fireEvent.press(getByTestId('home-invoice-item-101'));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(consumer)/invoice/[id]',
        params: expect.objectContaining({
          id: '101',
        }),
      })
    );
  });

  it('deve navegar para a tela de escanear nota ao tocar no atalho Escanear Nota', async () => {
    (useWalletModule.useCustomerBalances as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    (useWalletModule.useCustomerInvoices as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerHomeScreen />);

    fireEvent.press(getByText('Escanear Nota'));
    expect(mockPush).toHaveBeenCalledWith('/(consumer)/(tabs)/scan');
  });
});
