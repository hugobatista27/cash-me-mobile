import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  useCancelCouponMutation,
  useCustomerCoupons,
  useCustomerEstablishmentRewards,
  useRedeemRewardMutation,
} from '../useCoupons';
import {
  CancelCouponResponse,
  CouponRedemption,
  couponsService,
  CouponStatus,
  RedeemRewardResponse,
} from '@/services/coupons.service';
import { Reward } from '@/services/rewards.service';

jest.mock('@/services/coupons.service');

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'CouponsQueryTestWrapper';

  return { Wrapper, queryClient };
};

describe('useCoupons hooks (TASK-11)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReward: Reward = {
    id: 1,
    establishmentId: 10,
    title: 'Desconto de R$ 15,00',
    description: 'Válido para compras acima de R$ 50',
    discountType: 'FIXED_AMOUNT',
    discountValue: 15,
    minPurchaseAmount: 50,
    maxDiscountAmount: null,
    pointsCost: 150,
    stock: 25,
    validityDays: 7,
    status: 'ACTIVE',
  };

  const mockCoupon: CouponRedemption = {
    id: 101,
    customerId: 5,
    establishmentId: 10,
    rewardId: 1,
    code: 'CM7X9K2',
    pointsCost: 150,
    discountType: 'FIXED_AMOUNT',
    discountValue: 15,
    minPurchaseAmount: 50,
    maxDiscountAmount: null,
    status: 'ACTIVE',
    expiresAt: '2026-10-28T20:00:00Z',
    usedAt: null,
    cancelledAt: null,
    createdAt: '2026-10-21T20:00:00Z',
  };

  describe('useCustomerEstablishmentRewards', () => {
    it('deve buscar e retornar recompensas ativas do estabelecimento informado', async () => {
      (
        couponsService.getCustomerEstablishmentRewards as jest.Mock
      ).mockResolvedValueOnce([mockReward]);

      const { Wrapper } = createTestWrapper();
      const { result } = await renderHook(
        () => useCustomerEstablishmentRewards(10),
        { wrapper: Wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([mockReward]);
      expect(
        couponsService.getCustomerEstablishmentRewards
      ).toHaveBeenCalledWith(10);
    });

    it('não deve disparar requisição se establishmentId não for informado ou for inválido', async () => {
      const { Wrapper } = createTestWrapper();
      const { result } = await renderHook(
        () => useCustomerEstablishmentRewards(0),
        { wrapper: Wrapper }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(
        couponsService.getCustomerEstablishmentRewards
      ).not.toHaveBeenCalled();
    });
  });

  describe('useCustomerCoupons', () => {
    it('deve buscar e retornar lista de cupons resgatados do consumidor', async () => {
      (couponsService.getCustomerCoupons as jest.Mock).mockResolvedValueOnce([
        mockCoupon,
      ]);

      const { Wrapper } = createTestWrapper();
      const { result } = await renderHook(() => useCustomerCoupons(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([mockCoupon]);
      expect(couponsService.getCustomerCoupons).toHaveBeenCalledWith(undefined);
    });

    it('deve repassar o filtro de status para o serviço quando fornecido', async () => {
      (couponsService.getCustomerCoupons as jest.Mock).mockResolvedValueOnce([
        mockCoupon,
      ]);

      const { Wrapper } = createTestWrapper();
      const { result } = await renderHook(
        () => useCustomerCoupons('ACTIVE' as CouponStatus),
        { wrapper: Wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([mockCoupon]);
      expect(couponsService.getCustomerCoupons).toHaveBeenCalledWith('ACTIVE');
    });
  });

  describe('useRedeemRewardMutation', () => {
    it('deve disparar resgate e invalidar caches de cupons, saldos, extratos e recompensas', async () => {
      const mockRedeemResponse: RedeemRewardResponse = {
        coupon: mockCoupon,
        message: 'Resgatado!',
        balance: { currentBalance: 200 },
      };

      (couponsService.redeemReward as jest.Mock).mockResolvedValueOnce(
        mockRedeemResponse
      );

      const { Wrapper, queryClient } = createTestWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = await renderHook(() => useRedeemRewardMutation(), {
        wrapper: Wrapper,
      });

      let response: RedeemRewardResponse | undefined;
      await act(async () => {
        response = await result.current.mutateAsync(1);
      });

      expect(response).toEqual(mockRedeemResponse);
      expect(couponsService.redeemReward).toHaveBeenCalledWith(1);

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customer', 'coupons'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customer', 'balances'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customer', 'statement'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customer', 'rewards'],
      });
    });
  });

  describe('useCancelCouponMutation', () => {
    it('deve disparar cancelamento e invalidar caches de cupons, saldos, extratos e recompensas', async () => {
      const mockCancelResponse: CancelCouponResponse = {
        coupon: { ...mockCoupon, status: 'CANCELLED' },
        message: 'Cancelado com sucesso!',
        refundedPoints: 150,
        balance: { currentBalance: 350 },
      };

      (couponsService.cancelCoupon as jest.Mock).mockResolvedValueOnce(
        mockCancelResponse
      );

      const { Wrapper, queryClient } = createTestWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = await renderHook(() => useCancelCouponMutation(), {
        wrapper: Wrapper,
      });

      let response: CancelCouponResponse | undefined;
      await act(async () => {
        response = await result.current.mutateAsync(101);
      });

      expect(response).toEqual(mockCancelResponse);
      expect(couponsService.cancelCoupon).toHaveBeenCalledWith(101);

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customer', 'coupons'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customer', 'balances'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customer', 'statement'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customer', 'rewards'],
      });
    });
  });
});
