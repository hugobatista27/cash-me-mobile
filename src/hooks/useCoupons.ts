import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CancelCouponResponse,
  CouponRedemption,
  couponsService,
  CouponStatus,
  RedeemRewardResponse,
} from '@/services/coupons.service';
import { Reward } from '@/services/rewards.service';

/**
 * Hook para consultar o catálogo de recompensas de um estabelecimento para o consumidor
 */
export function useCustomerEstablishmentRewards(
  establishmentId: number | string
) {
  const numericId = Number(establishmentId);

  return useQuery<Reward[], Error>({
    queryKey: ['customer', 'rewards', establishmentId],
    queryFn: () => couponsService.getCustomerEstablishmentRewards(establishmentId),
    enabled: Boolean(establishmentId && (!isNaN(numericId) ? numericId > 0 : true)),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para consultar os cupons resgatados pelo consumidor (com filtro opcional por status)
 */
export function useCustomerCoupons(status?: CouponStatus) {
  return useQuery<CouponRedemption[], Error>({
    queryKey: ['customer', 'coupons', status],
    queryFn: () => couponsService.getCustomerCoupons(status),
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook de mutação para resgate atômico de cupom com débito imediato de pontos (ADR-003)
 */
export function useRedeemRewardMutation() {
  const queryClient = useQueryClient();

  return useMutation<RedeemRewardResponse, Error, number | string>({
    mutationFn: (rewardId) => couponsService.redeemReward(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customer', 'coupons'],
      });
      queryClient.invalidateQueries({
        queryKey: ['customer', 'balances'],
      });
      queryClient.invalidateQueries({
        queryKey: ['customer', 'statement'],
      });
      queryClient.invalidateQueries({
        queryKey: ['customer', 'rewards'],
      });
    },
  });
}

/**
 * Hook de mutação para cancelamento voluntário de cupom e estorno integral dos pontos (ADR-003)
 */
export function useCancelCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation<CancelCouponResponse, Error, number | string>({
    mutationFn: (couponId) => couponsService.cancelCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customer', 'coupons'],
      });
      queryClient.invalidateQueries({
        queryKey: ['customer', 'balances'],
      });
      queryClient.invalidateQueries({
        queryKey: ['customer', 'statement'],
      });
      queryClient.invalidateQueries({
        queryKey: ['customer', 'rewards'],
      });
    },
  });
}
