import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { couponsService } from '@/services/coupons';

export const useStoreRewards = (establishmentId: number | string | undefined) => {
  return useQuery({
    queryKey: ['store', 'rewards', String(establishmentId)],
    queryFn: () => couponsService.getStoreRewards(establishmentId!),
    enabled: Boolean(establishmentId),
  });
};

export const useCustomerCoupons = (status?: string) => {
  return useQuery({
    queryKey: ['customer', 'coupons', status || 'ALL'],
    queryFn: () => couponsService.getCustomerCoupons(status),
  });
};

export const useRedeemReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rewardId: number | string) => couponsService.redeemReward(rewardId),
    onSuccess: (coupon) => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'balances'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'coupons'] });
      queryClient.invalidateQueries({
        queryKey: ['store', 'rewards', String(coupon.establishmentId)],
      });
    },
  });
};

export const useCancelCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (couponId: number | string) => couponsService.cancelCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'balances'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'coupons'] });
      queryClient.invalidateQueries({ queryKey: ['store', 'rewards'] });
    },
  });
};
