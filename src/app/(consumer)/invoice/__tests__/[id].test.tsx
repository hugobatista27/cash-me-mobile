import { fireEvent, render } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

import ConsumerInvoiceDetailsScreen from '../[id]';
import * as useWalletModule from '@/hooks/useWallet';
import { CustomerInvoice } from '@/services/wallet.service';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('@/hooks/useWallet');

describe('ConsumerInvoiceDetailsScreen (TASK-04)', () => {
  const mockReplace = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
      back: mockBack,
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: '42',
      tradeName: 'Padaria Real',
    });
  });

  const mockInvoiceDetail: CustomerInvoice = {
    id: 42,
    accessKey: '42230912345678000195650010000001231000001234',
    totalAmount: 150.0,
    pointsAwarded: 150,
    status: 'PROCESSED',
    createdAt: '2026-10-10T14:30:00Z',
    items: [
      {
        id: 1,
        description: 'Café Especial 250g',
        quantity: 2,
        unitPrice: 25.0,
        totalPrice: 50.0,
      },
      {
        id: 2,
        rawDescription: 'Torta de Maçã Artesanal',
        quantity: 1,
        unitPrice: 100.0,
        totalPrice: 100.0,
      },
    ],
  };

  it('deve renderizar valor total (R$), chave formatada em blocos de 4 dígitos, pontos e status', async () => {
    (useWalletModule.useCustomerInvoiceDetail as jest.Mock).mockReturnValue({
      data: mockInvoiceDetail,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText, getAllByText } = await render(<ConsumerInvoiceDetailsScreen />);

    expect(getAllByText('Padaria Real').length).toBeGreaterThanOrEqual(1);
    expect(getByText(/\+150/)).toBeTruthy();
    expect(getByText(/150,00/)).toBeTruthy();
    expect(
      getByText('4223 0912 3456 7800 0195 6500 1000 0001 2310 0000 1234')
    ).toBeTruthy();
    expect(getByText('Processada')).toBeTruthy();
  });

  it('deve listar os itens adquiridos extraídos da nota fiscal', async () => {
    (useWalletModule.useCustomerInvoiceDetail as jest.Mock).mockReturnValue({
      data: mockInvoiceDetail,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerInvoiceDetailsScreen />);

    expect(getByText('Café Especial 250g')).toBeTruthy();
    expect(getByText('Torta de Maçã Artesanal')).toBeTruthy();
  });

  it('deve navegar de volta ao tocar em Voltar para o Início', async () => {
    (useWalletModule.useCustomerInvoiceDetail as jest.Mock).mockReturnValue({
      data: mockInvoiceDetail,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerInvoiceDetailsScreen />);

    fireEvent.press(getByText('Voltar para o Início'));
    expect(mockReplace).toHaveBeenCalledWith('/(consumer)/(tabs)');
  });
});
