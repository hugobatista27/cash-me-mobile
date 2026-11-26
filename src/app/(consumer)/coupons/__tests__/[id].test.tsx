import { act, fireEvent, render } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';

import ConsumerCouponDetailScreen from '../[id]';
import * as useCouponsModule from '@/hooks/useCoupons';
import { CouponRedemption } from '@/services/coupons.service';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('@/hooks/useCoupons');
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

describe('ConsumerCouponDetailScreen (TASK-11)', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
      replace: mockReplace,
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: '101',
    });
    jest.spyOn(Alert, 'alert');
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
    minPurchaseAmount: 50,
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-10-21T12:00:00Z',
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

  it('deve renderizar detalhes do cupom, código alfanumérico e regras', async () => {
    (useCouponsModule.useCustomerCoupons as jest.Mock).mockReturnValue({
      data: [mockActiveCoupon],
      isLoading: false,
    });
    (useCouponsModule.useCancelCouponMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    const { getByText, getAllByText, getByTestId } = await render(<ConsumerCouponDetailScreen />);

    expect(getAllByText('Café & Bistrô Central').length).toBeGreaterThanOrEqual(1);
    expect(getByText('R$ 15,00')).toBeTruthy();
    expect(getByText('CM7X9K2')).toBeTruthy();
    expect(getAllByText('150 pts').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Compra Mínima')).toBeTruthy();
    expect(getByTestId('cancel-coupon-button')).toBeTruthy();
  });

  it('deve copiar o código ao tocar no botão Copiar', async () => {
    (useCouponsModule.useCustomerCoupons as jest.Mock).mockReturnValue({
      data: [mockActiveCoupon],
      isLoading: false,
    });
    (useCouponsModule.useCancelCouponMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    const { getByTestId, getByText } = await render(<ConsumerCouponDetailScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('copy-coupon-code-button'));
    });

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('CM7X9K2');
    expect(getByText('Copiado!')).toBeTruthy();
  });

  it('deve disparar confirmação de cancelamento e estorno de pontos (ADR-003)', async () => {
    const mockCancelMutate = jest.fn().mockResolvedValue({
      coupon: { ...mockActiveCoupon, status: 'CANCELLED' },
      refundedPoints: 150,
    });

    (useCouponsModule.useCustomerCoupons as jest.Mock).mockReturnValue({
      data: [mockActiveCoupon],
      isLoading: false,
    });
    (useCouponsModule.useCancelCouponMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockCancelMutate,
    });

    const { getByTestId } = await render(<ConsumerCouponDetailScreen />);

    fireEvent.press(getByTestId('cancel-coupon-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Cancelar Cupom e Estornar Pontos',
      expect.stringContaining('O código CM7X9K2 será invalidado imediatamente e os 150 pontos serão estornados'),
      expect.any(Array)
    );

    // Simula confirmação no Alert
    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const confirmButton = alertCalls[0][2].find(
      (btn: { text: string }) => btn.text === 'Sim, Cancelar e Estornar'
    );
    await confirmButton.onPress();

    expect(mockCancelMutate).toHaveBeenCalledWith(101);
  });

  it('não deve exibir botão de cancelamento se o cupom já estiver utilizado', async () => {
    const usedCoupon: CouponRedemption = {
      ...mockActiveCoupon,
      status: 'USED',
      usedAt: '2026-10-22T10:00:00Z',
    };

    (useCouponsModule.useCustomerCoupons as jest.Mock).mockReturnValue({
      data: [usedCoupon],
      isLoading: false,
    });
    (useCouponsModule.useCancelCouponMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    const { queryByTestId, getByText } = await render(<ConsumerCouponDetailScreen />);

    expect(getByText('Este cupom já foi utilizado no caixa')).toBeTruthy();
    expect(queryByTestId('cancel-coupon-button')).toBeNull();
  });
});
