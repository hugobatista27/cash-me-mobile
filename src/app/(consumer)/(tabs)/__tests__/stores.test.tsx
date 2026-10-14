import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';

import ConsumerStoresScreen from '../stores';
import * as useEstablishmentsModule from '@/hooks/useEstablishments';
import { Establishment } from '@/services/establishments';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useEstablishments');

describe('ConsumerStoresScreen', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  const mockStores: Establishment[] = [
    {
      id: 1,
      cnpj: '12345678000195',
      legalName: 'Padaria Real Ltda',
      tradeName: 'Padaria Real',
      status: 'ACTIVE',
      conversionFactor: 1.0,
      address: {
        postalCode: '88010000',
        state: 'SC',
        city: 'Florianópolis',
        neighborhood: 'Centro',
        street: 'Rua Felipe Schmidt',
        number: '100',
      },
    },
    {
      id: 2,
      cnpj: '98765432000100',
      legalName: 'Café do Lago Ltda',
      tradeName: 'Café do Lago',
      status: 'ACTIVE',
      conversionFactor: 0.2,
      address: {
        postalCode: '88062000',
        state: 'SC',
        city: 'Florianópolis',
        neighborhood: 'Lagoa da Conceição',
        street: 'Av. das Rendeiras',
        number: '250',
      },
    },
  ];

  it('deve exibir indicador de carregamento quando isLoading for true', async () => {
    (useEstablishmentsModule.useEstablishments as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerStoresScreen />);
    expect(getByText('Carregando estabelecimentos parceiros...')).toBeTruthy();
  });

  it('deve listar estabelecimentos credenciados e seus badges de regra de pontuação (RN04)', async () => {
    (useEstablishmentsModule.useEstablishments as jest.Mock).mockReturnValue({
      data: mockStores,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerStoresScreen />);

    expect(getByText('Padaria Real')).toBeTruthy();
    expect(getByText('R$ 1 = 1 pt')).toBeTruthy();
    expect(getByText('Café do Lago')).toBeTruthy();
    expect(getByText('R$ 5 = 1 pt')).toBeTruthy();
  });

  it('deve filtrar lojas ao digitar no campo de busca com debounce', async () => {
    (useEstablishmentsModule.useEstablishments as jest.Mock).mockReturnValue({
      data: mockStores,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByPlaceholderText, getByText, queryByText } = await render(<ConsumerStoresScreen />);

    const searchInput = getByPlaceholderText('Buscar por loja, cidade ou bairro...');
    fireEvent.changeText(searchInput, 'Lago');

    await waitFor(() => {
      expect(getByText('Café do Lago')).toBeTruthy();
      expect(queryByText('Padaria Real')).toBeNull();
    });
  });

  it('deve navegar para a tela de detalhes ao tocar no cartão da loja', async () => {
    (useEstablishmentsModule.useEstablishments as jest.Mock).mockReturnValue({
      data: mockStores,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerStoresScreen />);

    fireEvent.press(getByText('Padaria Real'));
    expect(mockPush).toHaveBeenCalledWith('/(consumer)/store/1');
  });

  it('deve exibir estado vazio quando a busca não encontrar resultados', async () => {
    (useEstablishmentsModule.useEstablishments as jest.Mock).mockReturnValue({
      data: mockStores,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByPlaceholderText, getByText } = await render(<ConsumerStoresScreen />);

    const searchInput = getByPlaceholderText('Buscar por loja, cidade ou bairro...');
    fireEvent.changeText(searchInput, 'InexistenteXYZ');

    await waitFor(() => {
      expect(getByText('Nenhuma loja encontrada')).toBeTruthy();
    });
  });
});
