import { fireEvent, render } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

import ConsumerStatementScreen from '../[id]';
import * as useWalletModule from '@/hooks/useWallet';
import { PointTransaction } from '@/services/wallet.service';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('@/hooks/useWallet');

describe('ConsumerStatementScreen (TASK-04)', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: '5',
      tradeName: 'Padaria Real',
      cnpj: '12345678000195',
      currentBalance: '350',
      totalAccumulated: '500',
      status: 'ACTIVE',
    });
    (useWalletModule.useCustomerBalances as jest.Mock).mockReturnValue({
      data: [
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
      ],
      isLoading: false,
      refetch: jest.fn(),
    });
  });

  const mockTransactions: PointTransaction[] = [
    {
      id: 101,
      type: 'CREDIT',
      points: 150,
      description: 'Pontos gerados por NFC-e',
      createdAt: '2026-10-10T14:30:00Z',
      invoiceId: 42,
    },
    {
      id: 89,
      type: 'DEBIT',
      points: 50,
      description: 'Resgate de café especial',
      createdAt: '2026-10-05T11:15:00Z',
    },
    {
      id: 75,
      type: 'REVERSAL',
      points: 20,
      description: 'Estorno administrativo',
      createdAt: '2026-10-01T09:00:00Z',
    },
  ];

  it('deve exibir cabeçalho com Nome Fantasia, CNPJ formatado e saldo atual na loja', async () => {
    (useWalletModule.useEstablishmentStatement as jest.Mock).mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getAllByText, getByText } = await render(<ConsumerStatementScreen />);

    expect(getAllByText('Padaria Real').length).toBeGreaterThanOrEqual(1);
    expect(getByText(/CNPJ: 12\.345\.678\/0001-95/)).toBeTruthy();
    expect(getByText('350')).toBeTruthy();
  });

  it('deve listar movimentações diferenciando CREDIT (+) em verde e DEBIT/REVERSAL (-) com sinal negativo', async () => {
    (useWalletModule.useEstablishmentStatement as jest.Mock).mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerStatementScreen />);

    expect(getByText('Pontos gerados por NFC-e')).toBeTruthy();
    expect(getByText('+150 pts')).toBeTruthy();

    expect(getByText('Resgate de café especial')).toBeTruthy();
    expect(getByText('-50 pts')).toBeTruthy();

    expect(getByText('Estorno administrativo')).toBeTruthy();
    expect(getByText('-20 pts')).toBeTruthy();
  });

  it('deve permitir abrir os detalhes da nota fiscal ao tocar em um lançamento vinculado a uma NFC-e', async () => {
    (useWalletModule.useEstablishmentStatement as jest.Mock).mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerStatementScreen />);

    fireEvent.press(getByText('Pontos gerados por NFC-e'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(consumer)/invoice/[id]',
      params: {
        id: '42',
        tradeName: 'Padaria Real',
      },
    });
  });

  it('deve exibir badge RN05 se a loja estiver INACTIVE preservando o extrato', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: '8',
      tradeName: 'Supermercado Central',
      cnpj: '98765432000100',
      currentBalance: '120',
      status: 'INACTIVE',
    });
    (useWalletModule.useCustomerBalances as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
    });
    (useWalletModule.useEstablishmentStatement as jest.Mock).mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerStatementScreen />);

    expect(getByText(/Loja temporariamente inativa para novos pontos/i)).toBeTruthy();
  });
});
