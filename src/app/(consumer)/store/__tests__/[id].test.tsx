import { fireEvent, render } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking } from 'react-native';

import ConsumerStoreDetailScreen from '../[id]';
import * as useCouponsModule from '@/hooks/useCoupons';
import * as useEstablishmentsModule from '@/hooks/useEstablishments';
import * as useWalletModule from '@/hooks/useWallet';
import { Establishment } from '@/services/establishments';
import { Reward } from '@/services/rewards.service';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('@/hooks/useEstablishments');
jest.mock('@/hooks/useCoupons');
jest.mock('@/hooks/useWallet');

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
    jest.spyOn(Alert, 'alert');

    (useCouponsModule.useCustomerEstablishmentRewards as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
    });
    (useCouponsModule.useRedeemRewardMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
    (useWalletModule.useCustomerBalances as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
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

  it('deve renderizar recompensas disponíveis e saldo do cliente na loja', async () => {
    const mockReward: Reward = {
      id: 1,
      establishmentId: 1,
      title: 'Cupom R$ 10 OFF',
      description: 'Em compras acima de R$ 30',
      discountType: 'FIXED_AMOUNT',
      discountValue: 10,
      pointsCost: 100,
      stock: 15,
      validityDays: 10,
      status: 'ACTIVE',
    };

    (useEstablishmentsModule.useEstablishmentDetails as jest.Mock).mockReturnValue({
      data: mockStore,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    (useCouponsModule.useCustomerEstablishmentRewards as jest.Mock).mockReturnValue({
      data: [mockReward],
      isLoading: false,
      refetch: jest.fn(),
    });
    (useWalletModule.useCustomerBalances as jest.Mock).mockReturnValue({
      data: [
        {
          id: 10,
          currentBalance: 250,
          totalAccumulated: 300,
          establishment: { id: 1, tradeName: 'Padaria Real', status: 'ACTIVE' },
        },
      ],
      isLoading: false,
    });

    const { getByText, getByTestId } = await render(<ConsumerStoreDetailScreen />);

    expect(getByText('Recompensas & Cupons')).toBeTruthy();
    expect(getByText('Cupom R$ 10 OFF')).toBeTruthy();
    expect(getByText('250 pts')).toBeTruthy();
    expect(getByTestId('redeem-button-1')).toBeTruthy();
  });

  it('deve exibir banner de bloqueio e desabilitar resgate se a loja estiver INACTIVE (RN11)', async () => {
    const inactiveStore: Establishment = {
      ...mockStore,
      status: 'INACTIVE',
    };

    const mockReward: Reward = {
      id: 2,
      establishmentId: 1,
      title: 'Desconto 15%',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      pointsCost: 50,
      validityDays: 5,
      status: 'ACTIVE',
    };

    (useEstablishmentsModule.useEstablishmentDetails as jest.Mock).mockReturnValue({
      data: inactiveStore,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    (useCouponsModule.useCustomerEstablishmentRewards as jest.Mock).mockReturnValue({
      data: [mockReward],
      isLoading: false,
      refetch: jest.fn(),
    });

    const { getByText, getByTestId } = await render(<ConsumerStoreDetailScreen />);

    expect(getByText(/Resgates Temporariamente Bloqueados \(RN11\)/i)).toBeTruthy();
    const btn = getByTestId('redeem-button-2');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });
});
