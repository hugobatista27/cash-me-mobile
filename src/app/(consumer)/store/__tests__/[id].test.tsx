import { fireEvent, render } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Linking } from 'react-native';

import ConsumerStoreDetailScreen from '../[id]';
import * as useEstablishmentsModule from '@/hooks/useEstablishments';
import { Establishment } from '@/services/establishments';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('@/hooks/useEstablishments');

describe('ConsumerStoreDetailScreen', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: '1',
    });
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
  });

  const mockStore: Establishment = {
    id: 1,
    cnpj: '12345678000195',
    legalName: 'Padaria Real Ltda',
    tradeName: 'Padaria Real',
    status: 'ACTIVE',
    conversionFactor: 1.0,
    phone: '4833330001',
    whatsapp: '48999990001',
    instagram: 'padariareal',
    address: {
      postalCode: '88010000',
      state: 'SC',
      city: 'Florianópolis',
      neighborhood: 'Centro',
      street: 'Rua Felipe Schmidt',
      number: '100',
      complement: 'Loja 2',
      reference: 'Próximo ao Calçadão',
    },
  };

  it('deve renderizar dados da loja, CNPJ formatado e regra de conversão (RN04)', async () => {
    (useEstablishmentsModule.useEstablishmentDetails as jest.Mock).mockReturnValue({
      data: mockStore,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const { getByText, getAllByText } = await render(<ConsumerStoreDetailScreen />);

    expect(getAllByText('Padaria Real').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Padaria Real Ltda')).toBeTruthy();
    expect(getByText(/CNPJ: 12\.345\.678\/0001-95/)).toBeTruthy();
    expect(getAllByText('R$ 1 = 1 pt').length).toBeGreaterThanOrEqual(1);
    expect(getByText('R$ 1,00 em compras = 1 ponto')).toBeTruthy();
  });

  it('deve abrir mapa ao tocar no botão Abrir no Mapa', async () => {
    (useEstablishmentsModule.useEstablishmentDetails as jest.Mock).mockReturnValue({
      data: mockStore,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const { getByText } = await render(<ConsumerStoreDetailScreen />);

    fireEvent.press(getByText('Abrir no Mapa'));
    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining('https://www.google.com/maps/search/?api=1')
    );
  });

  it('deve acionar WhatsApp via Linking ao tocar no contato de WhatsApp', async () => {
    (useEstablishmentsModule.useEstablishmentDetails as jest.Mock).mockReturnValue({
      data: mockStore,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const { getByText } = await render(<ConsumerStoreDetailScreen />);

    fireEvent.press(getByText('WhatsApp'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://wa.me/5548999990001');
  });

  it('deve acionar discador nativo ao tocar no telefone', async () => {
    (useEstablishmentsModule.useEstablishmentDetails as jest.Mock).mockReturnValue({
      data: mockStore,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const { getByText } = await render(<ConsumerStoreDetailScreen />);

    fireEvent.press(getByText('Telefone'));
    expect(Linking.openURL).toHaveBeenCalledWith('tel:4833330001');
  });

  it('deve redirecionar para a aba /scan ao tocar em Escanear Nota Desta Loja', async () => {
    (useEstablishmentsModule.useEstablishmentDetails as jest.Mock).mockReturnValue({
      data: mockStore,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const { getByText } = await render(<ConsumerStoreDetailScreen />);

    fireEvent.press(getByText('Escanear Nota Desta Loja'));
    expect(mockPush).toHaveBeenCalledWith('/(consumer)/(tabs)/scan');
  });
});
