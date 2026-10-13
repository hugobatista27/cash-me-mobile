import { renderHook, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useActiveLoyaltyRule,
  useSimulateLoyaltyRule,
  useUpdateLoyaltyRule,
  useLoyaltyRuleHistory,
} from '@/hooks/useLoyaltyRules';
import { loyaltyRulesService } from '@/services/loyaltyRules';

jest.mock('@/services/loyaltyRules');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientTestWrapper';
  return Wrapper;
};

describe('useLoyaltyRules hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('useActiveLoyaltyRule deve carregar a regra ativa com sucesso', async () => {
    const mockRule = {
      id: 1,
      version: 1,
      name: 'Regra Base',
      baseAmount: 10,
      pointsPerBase: 1,
      minPurchaseAmount: 0,
      maxPointsPerPurchase: null,
      status: 'ACTIVE' as const,
      humanReadableSummary: 'A cada R$ 10,00 você ganha 1 ponto.',
    };

    (loyaltyRulesService.getActiveRule as jest.Mock).mockResolvedValueOnce(mockRule);

    const { result } = await renderHook(() => useActiveLoyaltyRule(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockRule);
  });

  it('useSimulateLoyaltyRule deve chamar simulateRule quando o valor for maior que zero', async () => {
    const mockSimulation = {
      purchaseAmount: 100,
      calculatedPoints: 10,
      ruleApplied: {
        baseAmount: 10,
        pointsPerBase: 1,
        minPurchaseAmount: 0,
        maxPointsPerPurchase: null,
      },
      humanReadableSummary: 'A cada R$ 10,00 você ganha 1 ponto.',
    };

    (loyaltyRulesService.simulateRule as jest.Mock).mockResolvedValueOnce(mockSimulation);

    const { result } = await renderHook(() => useSimulateLoyaltyRule(100), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSimulation);
    expect(loyaltyRulesService.simulateRule).toHaveBeenCalledWith({ amount: 100 });
  });

  it('useUpdateLoyaltyRule deve disparar mutação e invalidar cache de regras', async () => {
    const newRule = {
      id: 2,
      version: 2,
      name: 'Regra v2',
      baseAmount: 5,
      pointsPerBase: 1,
      minPurchaseAmount: 10,
      maxPointsPerPurchase: 500,
      status: 'ACTIVE' as const,
      humanReadableSummary: 'A cada R$ 5,00 você ganha 1 ponto.',
    };

    (loyaltyRulesService.updateRule as jest.Mock).mockResolvedValueOnce(newRule);

    const { result } = await renderHook(() => useUpdateLoyaltyRule(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        baseAmount: 5,
        pointsPerBase: 1,
        minPurchaseAmount: 10,
        maxPointsPerPurchase: 500,
        name: 'Regra v2',
      });
    });

    expect(loyaltyRulesService.updateRule).toHaveBeenCalledWith({
      baseAmount: 5,
      pointsPerBase: 1,
      minPurchaseAmount: 10,
      maxPointsPerPurchase: 500,
      name: 'Regra v2',
    });
  });

  it('useLoyaltyRuleHistory deve carregar a lista de histórico', async () => {
    const mockHistory = [
      {
        id: 2,
        version: 2,
        name: 'Regra v2',
        status: 'ACTIVE' as const,
        baseAmount: 5,
        pointsPerBase: 1,
        minPurchaseAmount: 10,
        maxPointsPerPurchase: 500,
        humanReadableSummary: 'A cada R$ 5,00 você ganha 1 ponto.',
      },
    ];

    (loyaltyRulesService.getRuleHistory as jest.Mock).mockResolvedValueOnce(mockHistory);

    const { result } = await renderHook(() => useLoyaltyRuleHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockHistory);
  });
});
