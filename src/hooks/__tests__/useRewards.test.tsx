import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  useCreateRewardMutation,
  useEstablishmentRewards,
  useRewardById,
  useToggleRewardStatusMutation,
  useUpdateRewardMutation,
} from '../useRewards';
import {
  CreateRewardDTO,
  Reward,
  rewardsService,
  RewardStatus,
  UpdateRewardDTO,
} from '@/services/rewards.service';

jest.mock('@/services/rewards.service');

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
  Wrapper.displayName = 'RewardsQueryTestWrapper';

  return { Wrapper, queryClient };
};

describe('useRewards hooks (TASK-10)', () => {
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

  describe('useEstablishmentRewards', () => {
    it('deve buscar e retornar a lista de recompensas do estabelecimento', async () => {
      (rewardsService.getEstablishmentRewards as jest.Mock).mockResolvedValueOnce([
        mockReward,
      ]);

      const { Wrapper } = createTestWrapper();
      const { result } = await renderHook(() => useEstablishmentRewards(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([mockReward]);
      expect(rewardsService.getEstablishmentRewards).toHaveBeenCalledWith(undefined);
    });

    it('deve repassar filtro de status quando fornecido', async () => {
      (rewardsService.getEstablishmentRewards as jest.Mock).mockResolvedValueOnce([
        mockReward,
      ]);

      const { Wrapper } = createTestWrapper();
      const { result } = await renderHook(() => useEstablishmentRewards('ACTIVE'), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([mockReward]);
      expect(rewardsService.getEstablishmentRewards).toHaveBeenCalledWith('ACTIVE');
    });
  });

  describe('useRewardById', () => {
    it('deve buscar e retornar a recompensa por id quando id fornecido', async () => {
      (rewardsService.getRewardById as jest.Mock).mockResolvedValueOnce(mockReward);

      const { Wrapper } = createTestWrapper();
      const { result } = await renderHook(() => useRewardById('rew_1'), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockReward);
      expect(rewardsService.getRewardById).toHaveBeenCalledWith('rew_1');
    });
  });

  describe('useCreateRewardMutation', () => {
    it('deve criar recompensa e invalidar a chave de cache [establishment, rewards]', async () => {
      const payload: CreateRewardDTO = {
        title: 'Desconto 20%',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscountAmount: 30,
        pointsCost: 200,
        validityDays: 7,
      };

      const created: Reward = {
        ...mockReward,
        id: 'rew_created',
        ...payload,
      };

      (rewardsService.createReward as jest.Mock).mockResolvedValueOnce(created);

      const { Wrapper, queryClient } = createTestWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = await renderHook(() => useCreateRewardMutation(), {
        wrapper: Wrapper,
      });

      let mutationResult: Reward | undefined;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(payload);
      });

      expect(mutationResult).toEqual(created);
      expect(rewardsService.createReward).toHaveBeenCalledWith(payload);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['establishment', 'rewards'],
      });
    });
  });

  describe('useToggleRewardStatusMutation', () => {
    it('deve alterar status e invalidar a chave de cache [establishment, rewards]', async () => {
      const updated: Reward = {
        ...mockReward,
        status: 'INACTIVE' as RewardStatus,
      };

      (rewardsService.toggleRewardStatus as jest.Mock).mockResolvedValueOnce(updated);

      const { Wrapper, queryClient } = createTestWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = await renderHook(() => useToggleRewardStatusMutation(), {
        wrapper: Wrapper,
      });

      let mutationResult: Reward | undefined;
      await act(async () => {
        mutationResult = await result.current.mutateAsync({
          id: 'rew_1',
          status: 'INACTIVE',
        });
      });

      expect(mutationResult).toEqual(updated);
      expect(rewardsService.toggleRewardStatus).toHaveBeenCalledWith(
        'rew_1',
        'INACTIVE'
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['establishment', 'rewards'],
      });
    });
  });

  describe('useUpdateRewardMutation', () => {
    it('deve atualizar recompensa e invalidar a chave de cache [establishment, rewards]', async () => {
      const updateData: UpdateRewardDTO = {
        title: 'Novo Título',
      };
      const updated: Reward = {
        ...mockReward,
        title: 'Novo Título',
      };

      (rewardsService.updateReward as jest.Mock).mockResolvedValueOnce(updated);

      const { Wrapper, queryClient } = createTestWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = await renderHook(() => useUpdateRewardMutation(), {
        wrapper: Wrapper,
      });

      let mutationResult: Reward | undefined;
      await act(async () => {
        mutationResult = await result.current.mutateAsync({
          id: 'rew_1',
          data: updateData,
        });
      });

      expect(mutationResult).toEqual(updated);
      expect(rewardsService.updateReward).toHaveBeenCalledWith('rew_1', updateData);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['establishment', 'rewards'],
      });
    });
  });
});
