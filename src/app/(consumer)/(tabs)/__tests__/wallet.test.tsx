import { fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';

import ConsumerWalletScreen from '../wallet';
import * as useWalletModule from '@/hooks/useWallet';
import { CustomerPointBalance } from '@/services/wallet.service';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useWallet');

describe('ConsumerWalletScreen (TASK-04)', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
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
    {
      id: 2,
      currentBalance: 120,
      totalAccumulated: 120,
      establishment: {
        id: 8,
        cnpj: '98765432000100',
        tradeName: 'Supermercado Central',
        status: 'INACTIVE',
      },
    },
  ];

  it('deve exibir skeleton de carregamento enquanto busca os saldos', async () => {
    (useWalletModule.useCustomerBalances as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerWalletScreen />);
    expect(getByText('Carregando sua carteira...')).toBeTruthy();
  });

  it('deve exibir saldos isolados por loja e preservar loja INACTIVE com aviso sutil (RN05 / ADR-002)', async () => {
    (useWalletModule.useCustomerBalances as jest.Mock).mockReturnValue({
      data: mockBalances,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerWalletScreen />);

    expect(getByText('Padaria Real')).toBeTruthy();
    expect(getByText('350')).toBeTruthy();
    expect(getByText('Supermercado Central')).toBeTruthy();
    expect(getByText('120')).toBeTruthy();
    expect(getByText(/Loja temporariamente inativa para novos pontos/i)).toBeTruthy();
  });

  it('deve navegar para a tela de extrato da loja ao tocar no card do estabelecimento', async () => {
    (useWalletModule.useCustomerBalances as jest.Mock).mockReturnValue({
      data: mockBalances,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerWalletScreen />);

    fireEvent.press(getByText('Padaria Real'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(consumer)/statement/[id]',
      params: {
        id: '5',
        tradeName: 'Padaria Real',
        cnpj: '12345678000195',
        currentBalance: '350',
        totalAccumulated: '500',
        status: 'ACTIVE',
      },
    });
  });

  it('deve exibir empty state quando o consumidor ainda não possui saldos', async () => {
    (useWalletModule.useCustomerBalances as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerWalletScreen />);

    expect(getByText('Sua carteira ainda está vazia')).toBeTruthy();
    fireEvent.press(getByText('Escanear Primeira Nota'));
    expect(mockPush).toHaveBeenCalledWith('/(consumer)/(tabs)/scan');
  });
});
