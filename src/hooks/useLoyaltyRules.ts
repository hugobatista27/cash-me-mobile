import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  loyaltyRulesService,
  PointRule,
  SimulateRuleParams,
  SimulateRuleResponse,
  UpdateLoyaltyRulePayload,
} from '@/services/loyaltyRules';

export const LOYALTY_RULES_QUERY_KEYS = {
  activeRule: ['merchant', 'loyalty-rule'] as const,
  simulate: (amount: number, customConfig?: Partial<SimulateRuleParams>) =>
    ['merchant', 'loyalty-rule', 'simulate', amount, customConfig] as const,
  history: ['merchant', 'loyalty-rule', 'history'] as const,
};

/**
 * Hook para buscar a regra de fidelidade ativa do estabelecimento autenticado
 */
export function useActiveLoyaltyRule() {
  return useQuery<PointRule>({
    queryKey: LOYALTY_RULES_QUERY_KEYS.activeRule,
    queryFn: () => loyaltyRulesService.getActiveRule(),
  });
}

/**
 * Hook para simular pontuação em tempo real com valor de compra
 */
export function useSimulateLoyaltyRule(
  amount: number,
  customConfig?: Partial<SimulateRuleParams>,
  enabled: boolean = true
) {
  return useQuery<SimulateRuleResponse>({
    queryKey: LOYALTY_RULES_QUERY_KEYS.simulate(amount, customConfig),
    queryFn: () =>
      loyaltyRulesService.simulateRule({
        amount,
        ...customConfig,
      }),
    enabled: enabled && amount > 0,
  });
}

/**
 * Hook para atualizar e versionar nova regra de fidelidade
 */
export function useUpdateLoyaltyRule() {
  const queryClient = useQueryClient();

  return useMutation<PointRule, Error, UpdateLoyaltyRulePayload>({
    mutationFn: (payload) => loyaltyRulesService.updateRule(payload),
    onSuccess: () => {
      // Invalida os caches de regra ativa e histórico conforme critério de aceite
      queryClient.invalidateQueries({
        queryKey: LOYALTY_RULES_QUERY_KEYS.activeRule,
      });
      queryClient.invalidateQueries({
        queryKey: LOYALTY_RULES_QUERY_KEYS.history,
      });
    },
  });
}

/**
 * Hook para listar histórico versionado de regras
 */
export function useLoyaltyRuleHistory() {
  return useQuery<PointRule[]>({
    queryKey: LOYALTY_RULES_QUERY_KEYS.history,
    queryFn: () => loyaltyRulesService.getRuleHistory(),
  });
}
