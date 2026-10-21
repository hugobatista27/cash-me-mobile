import { act, fireEvent, render } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React from 'react';

import ConsumerCouponsScreen from '../index';
import * as useCouponsModule from '@/hooks/useCoupons';
import { CouponRedemption } from '@/services/coupons.service';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useCoupons');
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

describe('ConsumerCouponsScreen (TASK-11)', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
  });

  const mockActiveCoupon: CouponRedemption = {
    id: 101,
    customerId: 1,
    establishmentId: 10,
    rewardId: 5,
    code: 'CM7X9K2',
    pointsCost: 150,
    discountType: 'FIXED_AMOUNT',
    discountValue: 15,
    status: 'ACTIVE',
    expiresAt: '2026-10-30T23:59:59Z',
    reward: {
      id: 5,
      title: 'Cupom R$ 15 OFF',
      discountType: 'FIXED_AMOUNT',
      discountValue: 15,
      pointsCost: 150,
      validityDays: 10,
      status: 'ACTIVE',
    },
    establishment: {
      id: 10,
      cnpj: '12345678000190',
      tradeName: 'Café & Bistrô Central',
      status: 'ACTIVE',
    },
  };

  const mockUsedCoupon: CouponRedemption = {
    id: 102,
    customerId: 1,
    establishmentId: 10,
    rewardId: 6,
    code: 'CM2Y8W1',
    pointsCost: 100,
    discountType: 'PERCENTAGE',
    discountValue: 20,
    status: 'USED',
    expiresAt: '2026-10-25T23:59:59Z',
    usedAt: '2026-10-22T14:30:00Z',
    reward: {
      id: 6,
      title: 'Desconto 20%',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      pointsCost: 100,
      validityDays: 5,
      status: 'ACTIVE',
    },
    establishment: {
      id: 10,
      cnpj: '12345678000190',
      tradeName: 'Café & Bistrô Central',
      status: 'ACTIVE',
    },
  };

  it('deve exibir lista de cupons ativos com código e desconto formatado', async () => {
    (useCouponsModule.useCustomerCoupons as jest.Mock).mockReturnValue({
      data: [mockActiveCoupon],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText, getByTestId } = await render(<ConsumerCouponsScreen />);

    expect(getByText('Meus Cupons')).toBeTruthy();
    expect(getByText('Café & Bistrô Central')).toBeTruthy();
    expect(getByText('R$ 15,00')).toBeTruthy();
    expect(getByText('CM7X9K2')).toBeTruthy();
    expect(getByTestId('copy-code-btn-101')).toBeTruthy();
  });

  it('deve copiar código para o clipboard ao tocar em Copiar', async () => {
    (useCouponsModule.useCustomerCoupons as jest.Mock).mockReturnValue({
      data: [mockActiveCoupon],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByTestId, getByText } = await render(<ConsumerCouponsScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('copy-code-btn-101'));
    });

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('CM7X9K2');
    expect(getByText('Copiado!')).toBeTruthy();
  });

  it('deve filtrar por aba de Utilizados ao tocar na tab correspondente', async () => {
    (useCouponsModule.useCustomerCoupons as jest.Mock).mockReturnValue({
      data: [mockActiveCoupon, mockUsedCoupon],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByTestId, getByText, queryByText } = await render(<ConsumerCouponsScreen />);

    // Na aba padrão (Ativos), o cupom ativo deve estar presente e o usado não
    expect(getByText('CM7X9K2')).toBeTruthy();
    expect(queryByText('CM2Y8W1')).toBeNull();

    // Toca na aba Utilizados
    await act(async () => {
      fireEvent.press(getByTestId('tab-filter-USED'));
    });

    // Agora deve exibir o cupom utilizado
    expect(getByText('CM2Y8W1')).toBeTruthy();
    expect(getByText('20% OFF')).toBeTruthy();
  });

  it('deve navegar para a tela de detalhes do cupom ao tocar no card', async () => {
    (useCouponsModule.useCustomerCoupons as jest.Mock).mockReturnValue({
      data: [mockActiveCoupon],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByTestId } = await render(<ConsumerCouponsScreen />);

    fireEvent.press(getByTestId('coupon-card-101'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(consumer)/coupons/[id]',
      params: { id: '101' },
    });
  });

  it('deve exibir empty state quando não há cupons ativos com botão para explorar lojas', async () => {
    (useCouponsModule.useCustomerCoupons as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = await render(<ConsumerCouponsScreen />);

    expect(getByText('Você não possui cupons ativos')).toBeTruthy();
    fireEvent.press(getByText('Explorar Lojas Parceiras'));
    expect(mockPush).toHaveBeenCalledWith('/(consumer)/(tabs)/stores');
  });
});
