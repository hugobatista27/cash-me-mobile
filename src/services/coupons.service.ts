import { apiClient } from '@/services/api';
import { Reward, RewardDiscountType } from '@/services/rewards.service';
import { PointBalanceEstablishment } from '@/services/wallet.service';

export type CouponStatus = 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED';

export interface CouponRedemption {
  id: number | string;
  customerId: number;
  establishmentId: number;
  rewardId: number;
  code: string;
  pointsCost: number;
  discountType: RewardDiscountType;
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number | null;
  status: CouponStatus;
  expiresAt: string;
  usedAt?: string | null;
  usedByUserId?: number | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  reward?: Reward;
  establishment?: PointBalanceEstablishment;
}

export interface RedeemRewardResponse {
  coupon: CouponRedemption;
  message?: string;
  balance?: {
    currentBalance: number;
    totalAccumulated?: number;
  };
  [key: string]: unknown;
}

export interface CancelCouponResponse {
  coupon: CouponRedemption;
  message?: string;
  refundedPoints?: number;
  balance?: {
    currentBalance: number;
    totalAccumulated?: number;
  };
  [key: string]: unknown;
}

/**
 * Formata o código do cupom para exibição uniforme (em caixa alta e sem espaços residuais)
 */
export function formatCouponCode(code?: string | null): string {
  if (!code) return '';
  return code.trim().toUpperCase();
}

/**
 * Verifica se um cupom está com status ACTIVE e dentro do prazo de validade
 */
export function isCouponActive(
  coupon: Pick<CouponRedemption, 'status' | 'expiresAt'>
): boolean {
  if (coupon.status !== 'ACTIVE') {
    return false;
  }
  const expiryTime = new Date(coupon.expiresAt).getTime();
  return !isNaN(expiryTime) && expiryTime > Date.now();
}

/**
 * Verifica se um cupom já expirou (status EXPIRED ou timestamp de expiração já ultrapassado)
 */
export function isCouponExpired(
  coupon: Pick<CouponRedemption, 'status' | 'expiresAt'>
): boolean {
  if (coupon.status === 'EXPIRED') {
    return true;
  }
  const expiryTime = new Date(coupon.expiresAt).getTime();
  return !isNaN(expiryTime) && expiryTime <= Date.now();
}

/**
 * Serviços da API para consulta, resgate e cancelamento de cupons (TASK-11)
 */
export const couponsService = {
  /**
   * Consulta o catálogo de recompensas ativas de uma loja específica (GET /customer/establishments/:id/rewards)
   */
  async getCustomerEstablishmentRewards(
    establishmentId: number | string
  ): Promise<Reward[]> {
    const response = await apiClient.get<Reward[] | { data: Reward[] }>(
      `/customer/establishments/${establishmentId}/rewards`
    );

    const body = response?.data;
    if (Array.isArray(body)) {
      return body;
    }
    if (body && typeof body === 'object' && 'data' in body && Array.isArray(body.data)) {
      return body.data;
    }
    return [];
  },

  /**
   * Executa o resgate atômico de uma recompensa, debitando pontos imediatamente (POST /customer/rewards/:id/redeem)
   */
  async redeemReward(
    rewardId: number | string
  ): Promise<RedeemRewardResponse> {
    const response = await apiClient.post<
      RedeemRewardResponse | { data: RedeemRewardResponse } | CouponRedemption | { data: CouponRedemption }
    >(`/customer/rewards/${rewardId}/redeem`);

    const body = response?.data;
    const raw =
      body && typeof body === 'object' && 'data' in body
        ? (body as { data: unknown }).data
        : body;

    if (raw && typeof raw === 'object' && 'coupon' in raw) {
      return raw as RedeemRewardResponse;
    }

    return {
      coupon: raw as CouponRedemption,
    };
  },

  /**
   * Cancela voluntariamente um cupom ativo e realiza o estorno integral dos pontos (POST /customer/coupons/:id/cancel)
   */
  async cancelCoupon(
    couponId: number | string
  ): Promise<CancelCouponResponse> {
    const response = await apiClient.post<
      CancelCouponResponse | { data: CancelCouponResponse } | CouponRedemption | { data: CouponRedemption }
    >(`/customer/coupons/${couponId}/cancel`);

    const body = response?.data;
    const raw =
      body && typeof body === 'object' && 'data' in body
        ? (body as { data: unknown }).data
        : body;

    if (raw && typeof raw === 'object' && 'coupon' in raw) {
      return raw as CancelCouponResponse;
    }

    return {
      coupon: raw as CouponRedemption,
      refundedPoints: (raw as CouponRedemption)?.pointsCost,
    };
  },

  /**
   * Consulta a lista de cupons resgatados pelo consumidor (GET /customer/coupons)
   */
  async getCustomerCoupons(
    status?: CouponStatus
  ): Promise<CouponRedemption[]> {
    const response = await apiClient.get<
      CouponRedemption[] | { data: CouponRedemption[] }
    >('/customer/coupons', {
      params: status ? { status } : undefined,
    });

    const body = response?.data;
    if (Array.isArray(body)) {
      return body;
    }
    if (body && typeof body === 'object' && 'data' in body && Array.isArray(body.data)) {
      return body.data;
    }
    return [];
  },
};

export const getCustomerEstablishmentRewards =
  couponsService.getCustomerEstablishmentRewards;
export const redeemReward = couponsService.redeemReward;
export const cancelCoupon = couponsService.cancelCoupon;
export const getCustomerCoupons = couponsService.getCustomerCoupons;
