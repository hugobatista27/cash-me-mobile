import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CreateRewardDTO,
  Reward,
  rewardsService,
  RewardStatus,
  UpdateRewardDTO,
} from '@/services/rewards.service';

/**
 * Hook para consultar a lista de recompensas cadastradas pelo estabelecimento.
 */
export function useEstablishmentRewards(status?: RewardStatus) {
  return useQuery<Reward[], Error>({
    queryKey: ['establishment', 'rewards', status],
    queryFn: () => rewardsService.getEstablishmentRewards(status),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para consultar uma recompensa específica por ID.
 */
export function useRewardById(id: string | number) {
  return useQuery<Reward, Error>({
    queryKey: ['establishment', 'rewards', 'detail', String(id)],
    queryFn: () => rewardsService.getRewardById(id),
    enabled: Boolean(id),
  });
}

/**
 * Hook de mutação para criar nova recompensa, invalidando o cache do catálogo do lojista.
 */
export function useCreateRewardMutation() {
  const queryClient = useQueryClient();

  return useMutation<Reward, Error, CreateRewardDTO>({
    mutationFn: (data: CreateRewardDTO) => rewardsService.createReward(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['establishment', 'rewards'],
      });
    },
  });
}

/**
 * Hook de mutação para alternar status (ACTIVE, INACTIVE, ARCHIVED), invalidando o cache.
 */
export function useToggleRewardStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    Reward,
    Error,
    { id: string | number; status: RewardStatus }
  >({
    mutationFn: ({ id, status }) =>
      rewardsService.toggleRewardStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['establishment', 'rewards'],
      });
    },
  });
}

/**
 * Hook de mutação para atualizar dados de uma recompensa existente.
 */
export function useUpdateRewardMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    Reward,
    Error,
    { id: string | number; data: UpdateRewardDTO }
  >({
    mutationFn: ({ id, data }) => rewardsService.updateReward(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['establishment', 'rewards'],
      });
    },
  });
}
