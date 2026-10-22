import { apiClient } from '@/services/api';
import { formatCurrency } from '@/utils/nfceParser';

export type RewardDiscountType = 'FIXED_AMOUNT' | 'PERCENTAGE';
export type RewardStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface Reward {
  id: string | number;
  establishmentId?: number;
  title: string;
  description?: string | null;
  discountType: RewardDiscountType;
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number | null;
  pointsCost: number;
  stock?: number | null;
  validityDays: number;
  status: RewardStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRewardDTO {
  title: string;
  description?: string | null;
  discountType: RewardDiscountType;
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number | null;
  pointsCost: number;
  stock?: number | null;
  validityDays?: number;
}

export type UpdateRewardDTO = Partial<CreateRewardDTO>;

/**
 * Formata o valor de desconto para exibição amigável (R$ 10,00 ou 15% OFF)
 */
export function formatDiscountValue(reward: {
  discountType?: RewardDiscountType | string;
  discount_type?: RewardDiscountType | string;
  discountValue?: number | string;
  discount_value?: number | string;
}): string {
  const type = reward?.discountType ?? reward?.discount_type ?? 'FIXED_AMOUNT';
  const rawNum = Number(reward?.discountValue ?? reward?.discount_value ?? 0);
  const safeValue = isNaN(rawNum) ? 0 : rawNum;

  if (type === 'PERCENTAGE') {
    return `${safeValue}% OFF`;
  }
  return formatCurrency(safeValue).replace(/\u00A0/g, ' ');
}

/**
 * Verifica se a recompensa está ativa e disponível para resgate
 */
export function isRewardAvailable(reward: {
  status: RewardStatus;
  stock?: number | null;
}): boolean {
  if (reward.status !== 'ACTIVE') {
    return false;
  }
  if (reward.stock === null || reward.stock === undefined) {
    return true;
  }
  return reward.stock > 0;
}

export const rewardsService = {
  /**
   * Consulta a lista de recompensas cadastradas pelo estabelecimento (GET /establishments/rewards)
   */
  async getEstablishmentRewards(status?: RewardStatus): Promise<Reward[]> {
    const response = await apiClient.get<Reward[] | { data: Reward[] }>(
      '/establishments/rewards',
      {
        params: status ? { status } : undefined,
      }
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
   * Consulta os detalhes de uma recompensa específica por id (GET /establishments/rewards/:id)
   */
  async getRewardById(id: string | number): Promise<Reward> {
    const response = await apiClient.get<Reward | { data: Reward }>(
      `/establishments/rewards/${id}`
    );

    const body = response?.data;
    if (body && typeof body === 'object' && 'data' in body) {
      return (body as { data: Reward }).data;
    }
    return body as Reward;
  },

  /**
   * Cria uma nova recompensa (POST /establishments/rewards)
   */
  async createReward(data: CreateRewardDTO): Promise<Reward> {
    const response = await apiClient.post<Reward | { data: Reward }>(
      '/establishments/rewards',
      data
    );

    const body = response?.data;
    if (body && typeof body === 'object' && 'data' in body) {
      return (body as { data: Reward }).data;
    }
    return body as Reward;
  },

  /**
   * Atualiza uma recompensa existente (PUT /establishments/rewards/:id)
   */
  async updateReward(
    id: string | number,
    data: UpdateRewardDTO
  ): Promise<Reward> {
    const response = await apiClient.put<Reward | { data: Reward }>(
      `/establishments/rewards/${id}`,
      data
    );

    const body = response?.data;
    if (body && typeof body === 'object' && 'data' in body) {
      return (body as { data: Reward }).data;
    }
    return body as Reward;
  },

  /**
   * Altera o status da recompensa (PATCH /establishments/rewards/:id/status)
   */
  async toggleRewardStatus(
    id: string | number,
    status: RewardStatus
  ): Promise<Reward> {
    const response = await apiClient.patch<Reward | { data: Reward }>(
      `/establishments/rewards/${id}/status`,
      { status }
    );

    const body = response?.data;
    if (body && typeof body === 'object' && 'data' in body) {
      return (body as { data: Reward }).data;
    }
    return body as Reward;
  },
};
