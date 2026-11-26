import { apiClient } from '@/services/api';

export interface RewardItem {
  id: number;
  establishmentId: number;
  title: string;
  description?: string | null;
  discountType: 'FIXED' | 'FIXED_AMOUNT' | 'PERCENTAGE';
  discountValue: number;
  minPurchaseAmount?: number | null;
  maxDiscountAmount?: number | null;
  pointsCost: number;
  stock?: number | null;
  validityDays: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface CouponRedemptionItem {
  id: number;
  customerId: number;
  establishmentId: number;
  rewardId: number;
  code: string;
  pointsCost: number;
  status: 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED';
  expiresAt: string;
  usedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  reward?: RewardItem;
  establishment?: {
    id: number;
    tradeName: string;
    cnpj: string;
    status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  };
}

function normalizeReward(raw: Record<string, unknown>): RewardItem {
  return {
    id: Number(raw.id),
    establishmentId: Number(raw.establishmentId ?? raw.establishment_id ?? 0),
    title: String(raw.title ?? ''),
    description: (raw.description as string | null) ?? null,
    discountType: (raw.discountType ?? raw.discount_type ?? 'FIXED') as RewardItem['discountType'],
    discountValue: Number(raw.discountValue ?? raw.discount_value ?? 0),
    minPurchaseAmount:
      raw.minPurchaseAmount !== undefined && raw.minPurchaseAmount !== null
        ? Number(raw.minPurchaseAmount)
        : raw.min_purchase_amount !== undefined && raw.min_purchase_amount !== null
          ? Number(raw.min_purchase_amount)
          : null,
    maxDiscountAmount:
      raw.maxDiscountAmount !== undefined && raw.maxDiscountAmount !== null
        ? Number(raw.maxDiscountAmount)
        : raw.max_discount_amount !== undefined && raw.max_discount_amount !== null
          ? Number(raw.max_discount_amount)
          : null,
    pointsCost: Number(raw.pointsCost ?? raw.points_cost ?? 0),
    stock:
      raw.stock !== undefined && raw.stock !== null ? Number(raw.stock) : null,
    validityDays: Number(raw.validityDays ?? raw.validity_days ?? 30),
    status: (raw.status ?? 'ACTIVE') as RewardItem['status'],
  };
}

function normalizeCoupon(raw: Record<string, unknown>): CouponRedemptionItem {
  const rawReward = raw.reward as Record<string, unknown> | undefined;
  const rawEstablishment = raw.establishment as Record<string, unknown> | undefined;

  return {
    id: Number(raw.id),
    customerId: Number(raw.customerId ?? raw.customer_id ?? 0),
    establishmentId: Number(raw.establishmentId ?? raw.establishment_id ?? 0),
    rewardId: Number(raw.rewardId ?? raw.reward_id ?? 0),
    code: String(raw.code ?? ''),
    pointsCost: Number(raw.pointsCost ?? raw.points_cost ?? 0),
    status: (raw.status ?? 'ACTIVE') as CouponRedemptionItem['status'],
    expiresAt: String(raw.expiresAt ?? raw.expires_at ?? ''),
    usedAt: (raw.usedAt ?? raw.used_at ?? null) as string | null,
    cancelledAt: (raw.cancelledAt ?? raw.cancelled_at ?? null) as string | null,
    createdAt: (raw.createdAt ?? raw.created_at) as string | undefined,
    reward: rawReward ? normalizeReward(rawReward) : undefined,
    establishment: rawEstablishment
      ? {
          id: Number(rawEstablishment.id),
          tradeName: String(rawEstablishment.tradeName ?? rawEstablishment.trade_name ?? ''),
          cnpj: String(rawEstablishment.cnpj ?? ''),
          status: (rawEstablishment.status ?? 'ACTIVE') as 'ACTIVE' | 'PENDING' | 'INACTIVE',
        }
      : undefined,
  };
}

function unwrapData<T>(raw: T | { data: T }): T {
  if (raw && typeof raw === 'object' && 'data' in raw && raw.data !== undefined) {
    return raw.data;
  }
  return raw as T;
}

export function formatRewardDiscount(reward?: RewardItem): string {
  if (!reward) return 'Desconto especial';
  if (reward.discountType === 'PERCENTAGE') {
    const base = `${reward.discountValue}% OFF`;
    return reward.maxDiscountAmount
      ? `${base} (máx. R$ ${reward.maxDiscountAmount.toFixed(2).replace('.', ',')})`
      : base;
  }
  return `R$ ${reward.discountValue.toFixed(2).replace('.', ',')} OFF`;
}

export const couponsService = {
  async getStoreRewards(establishmentId: number | string): Promise<RewardItem[]> {
    const response = await apiClient.get<
      Record<string, unknown>[] | { data: Record<string, unknown>[] }
    >(`/customer/establishments/${establishmentId}/rewards`);
    const list = unwrapData(response.data);
    return Array.isArray(list) ? list.map(normalizeReward) : [];
  },

  async redeemReward(rewardId: number | string): Promise<CouponRedemptionItem> {
    const response = await apiClient.post<
      Record<string, unknown> | { data: Record<string, unknown> }
    >(`/customer/rewards/${rewardId}/redeem`);
    return normalizeCoupon(unwrapData(response.data));
  },

  async getCustomerCoupons(status?: string): Promise<CouponRedemptionItem[]> {
    const url = status && status !== 'ALL' ? `/customer/coupons?status=${status}` : '/customer/coupons';
    const response = await apiClient.get<
      Record<string, unknown>[] | { data: Record<string, unknown>[] }
    >(url);
    const list = unwrapData(response.data);
    return Array.isArray(list) ? list.map(normalizeCoupon) : [];
  },

  async cancelCoupon(couponId: number | string): Promise<CouponRedemptionItem> {
    const response = await apiClient.post<
      Record<string, unknown> | { data: Record<string, unknown> }
    >(`/customer/coupons/${couponId}/cancel`);
    return normalizeCoupon(unwrapData(response.data));
  },
};

export default couponsService;
