import { apiClient } from '@/services/api';
import {
  CreateRewardDTO,
  formatDiscountValue,
  isRewardAvailable,
  Reward,
  rewardsService,
  RewardStatus,
  UpdateRewardDTO,
} from '@/services/rewards.service';

jest.mock('@/services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('RewardsService (TASK-10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReward: Reward = {
    id: 'rew_1',
    establishmentId: 10,
    title: 'Cupom R$ 10 OFF',
    description: 'Desconto em compras acima de R$ 50',
    discountType: 'FIXED_AMOUNT',
    discountValue: 10,
    minPurchaseAmount: 50,
    maxDiscountAmount: null,
    pointsCost: 100,
    stock: 20,
    validityDays: 15,
    status: 'ACTIVE',
    createdAt: '2026-10-15T12:00:00Z',
    updatedAt: '2026-10-15T12:00:00Z',
  };

  describe('getEstablishmentRewards', () => {
    it('deve buscar a lista de recompensas do estabelecimento', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: [mockReward] },
      });

      const result = await rewardsService.getEstablishmentRewards();

      expect(apiClient.get).toHaveBeenCalledWith('/establishments/rewards', {
        params: undefined,
      });
      expect(result).toEqual([mockReward]);
    });

    it('deve enviar parâmetro de status quando fornecido', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: [mockReward],
      });

      const result = await rewardsService.getEstablishmentRewards('ACTIVE');

      expect(apiClient.get).toHaveBeenCalledWith('/establishments/rewards', {
        params: { status: 'ACTIVE' },
      });
      expect(result).toEqual([mockReward]);
    });

    it('deve retornar lista vazia se resposta for nula ou vazia', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: null,
      });

      const result = await rewardsService.getEstablishmentRewards();

      expect(result).toEqual([]);
    });
  });

  describe('getRewardById', () => {
    it('deve buscar uma recompensa específica por id', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockReward },
      });

      const result = await rewardsService.getRewardById('rew_1');

      expect(apiClient.get).toHaveBeenCalledWith('/establishments/rewards/rew_1');
      expect(result).toEqual(mockReward);
    });

    it('deve desempacotar resposta mesmo sem a chave data', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockReward,
      });

      const result = await rewardsService.getRewardById('rew_1');

      expect(apiClient.get).toHaveBeenCalledWith('/establishments/rewards/rew_1');
      expect(result).toEqual(mockReward);
    });
  });

  describe('createReward', () => {
    it('deve criar uma nova recompensa enviando CreateRewardDTO', async () => {
      const payload: CreateRewardDTO = {
        title: 'Desconto 15%',
        description: 'Válido para todo o cardápio',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minPurchaseAmount: 30,
        maxDiscountAmount: 25,
        pointsCost: 150,
        stock: 50,
        validityDays: 10,
      };

      const createdMock: Reward = {
        ...mockReward,
        id: 'rew_2',
        ...payload,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { data: createdMock },
      });

      const result = await rewardsService.createReward(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/establishments/rewards', payload);
      expect(result).toEqual(createdMock);
    });
  });

  describe('updateReward', () => {
    it('deve atualizar uma recompensa existente enviando UpdateRewardDTO', async () => {
      const updateData: UpdateRewardDTO = {
        title: 'Cupom R$ 15 OFF Atualizado',
        pointsCost: 120,
      };

      const updatedMock: Reward = {
        ...mockReward,
        title: 'Cupom R$ 15 OFF Atualizado',
        pointsCost: 120,
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({
        data: { data: updatedMock },
      });

      const result = await rewardsService.updateReward('rew_1', updateData);

      expect(apiClient.put).toHaveBeenCalledWith(
        '/establishments/rewards/rew_1',
        updateData
      );
      expect(result).toEqual(updatedMock);
    });
  });

  describe('toggleRewardStatus', () => {
    it('deve alterar o status de uma recompensa via PATCH', async () => {
      const statusToSet: RewardStatus = 'INACTIVE';
      const updatedMock: Reward = {
        ...mockReward,
        status: statusToSet,
      };

      (apiClient.patch as jest.Mock).mockResolvedValueOnce({
        data: { data: updatedMock },
      });

      const result = await rewardsService.toggleRewardStatus('rew_1', statusToSet);

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/establishments/rewards/rew_1/status',
        { status: statusToSet }
      );
      expect(result).toEqual(updatedMock);
    });
  });

  describe('formatDiscountValue', () => {
    it('deve formatar cupom de valor fixo em moeda brasileira (R$)', () => {
      const formatted = formatDiscountValue({
        discountType: 'FIXED_AMOUNT',
        discountValue: 10,
      });
      expect(formatted).toBe('R$ 10,00');
    });

    it('deve formatar cupom de porcentagem com sufixo % OFF', () => {
      const formatted = formatDiscountValue({
        discountType: 'PERCENTAGE',
        discountValue: 15,
      });
      expect(formatted).toBe('15% OFF');
    });
  });

  describe('isRewardAvailable', () => {
    it('deve retornar true quando status é ACTIVE e stock é positivo', () => {
      expect(isRewardAvailable({ status: 'ACTIVE', stock: 10 })).toBe(true);
    });

    it('deve retornar true quando status é ACTIVE e stock é null (ilimitado)', () => {
      expect(isRewardAvailable({ status: 'ACTIVE', stock: null })).toBe(true);
    });

    it('deve retornar false quando status é ACTIVE mas stock é 0 (esgotado)', () => {
      expect(isRewardAvailable({ status: 'ACTIVE', stock: 0 })).toBe(false);
    });

    it('deve retornar false quando status é INACTIVE independentemente do estoque', () => {
      expect(isRewardAvailable({ status: 'INACTIVE', stock: 50 })).toBe(false);
    });

    it('deve retornar false quando status é ARCHIVED', () => {
      expect(isRewardAvailable({ status: 'ARCHIVED', stock: 100 })).toBe(false);
    });
  });
});
