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
 * Normaliza os campos de um cupom vindos da API para camelCase e valores numéricos (TASK-11)
 */
export function normalizeCoupon(item: any): CouponRedemption {
  if (!item || typeof item !== 'object') return item;

  const rawDiscountType =
    item.discountType ??
    item.discount_type ??
    item.reward?.discountType ??
    item.reward?.discount_type ??
    'FIXED_AMOUNT';

  const rawDiscountValue =
    item.discountValue ??
    item.discount_value ??
    item.reward?.discountValue ??
    item.reward?.discount_value ??
    0;

  const rawPointsCost =
    item.pointsCost ??
    item.points_cost ??
    item.reward?.pointsCost ??
    item.reward?.points_cost ??
    0;

  const rawMinPurchase =
    item.minPurchaseAmount ??
    item.min_purchase_amount ??
    item.reward?.minPurchaseAmount ??
    item.reward?.min_purchase_amount;

  const rawMaxDiscount =
    item.maxDiscountAmount ??
    item.max_discount_amount ??
    item.reward?.maxDiscountAmount ??
    item.reward?.max_discount_amount;

  const numDiscountValue = Number(rawDiscountValue);
  const numPointsCost = Number(rawPointsCost);

  return {
    ...item,
    discountType: rawDiscountType as RewardDiscountType,
    discountValue: isNaN(numDiscountValue) ? 0 : numDiscountValue,
    pointsCost: isNaN(numPointsCost) ? 0 : numPointsCost,
    minPurchaseAmount:
      rawMinPurchase !== undefined && rawMinPurchase !== null
        ? Number(rawMinPurchase)
        : undefined,
    maxDiscountAmount:
      rawMaxDiscount !== undefined && rawMaxDiscount !== null
        ? Number(rawMaxDiscount)
        : null,
  };
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
    const items = Array.isArray(body)
      ? body
      : body && typeof body === 'object' && 'data' in body && Array.isArray(body.data)
        ? body.data
        : [];

    return items.map((item: any) => {
      const discountValue = Number(item.discountValue ?? item.discount_value ?? 0);
      const pointsCost = Number(item.pointsCost ?? item.points_cost ?? 0);
      const rawMinPurchase = item.minPurchaseAmount ?? item.min_purchase_amount;
      const rawMaxDiscount = item.maxDiscountAmount ?? item.max_discount_amount;

      return {
        ...item,
        discountType: item.discountType ?? item.discount_type ?? 'FIXED_AMOUNT',
        discountValue: isNaN(discountValue) ? 0 : discountValue,
        pointsCost: isNaN(pointsCost) ? 0 : pointsCost,
        minPurchaseAmount:
          rawMinPurchase !== undefined && rawMinPurchase !== null
            ? Number(rawMinPurchase)
            : undefined,
        maxDiscountAmount:
          rawMaxDiscount !== undefined && rawMaxDiscount !== null
            ? Number(rawMaxDiscount)
            : null,
      };
    });
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
      return {
        ...(raw as RedeemRewardResponse),
        coupon: normalizeCoupon((raw as any).coupon),
      };
    }

    return {
      coupon: normalizeCoupon(raw),
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
      return {
        ...(raw as CancelCouponResponse),
        coupon: normalizeCoupon((raw as any).coupon),
      };
    }

    return {
      coupon: normalizeCoupon(raw),
      refundedPoints: Number(
        (raw as any)?.refundedPoints ??
        (raw as any)?.refunded_points ??
        (raw as any)?.pointsCost ??
        (raw as any)?.points_cost ??
        0
      ),
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
    const items = Array.isArray(body)
      ? body
      : body && typeof body === 'object' && 'data' in body && Array.isArray(body.data)
        ? body.data
        : [];

    return items.map((item: any) => normalizeCoupon(item));
  },
};

export const getCustomerEstablishmentRewards =
  couponsService.getCustomerEstablishmentRewards;
export const redeemReward = couponsService.redeemReward;
export const cancelCoupon = couponsService.cancelCoupon;
export const getCustomerCoupons = couponsService.getCustomerCoupons;
