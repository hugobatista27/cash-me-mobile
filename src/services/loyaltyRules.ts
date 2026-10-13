import { apiClient } from '@/services/api';

export interface PointRule {
  id: number;
  loyaltyProgramId?: number;
  establishmentId?: number;
  version: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  baseAmount: number;
  pointsPerBase: number;
  minPurchaseAmount: number;
  maxPointsPerPurchase: number | null;
  humanReadableSummary: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SimulateRuleParams {
  amount: number;
  baseAmount?: number;
  pointsPerBase?: number;
  minPurchaseAmount?: number;
  maxPointsPerPurchase?: number | null;
}

export interface RuleAppliedConfig {
  baseAmount: number;
  pointsPerBase: number;
  minPurchaseAmount: number;
  maxPointsPerPurchase: number | null;
}

export interface SimulateRuleResponse {
  purchaseAmount: number;
  calculatedPoints: number;
  ruleApplied: RuleAppliedConfig;
  humanReadableSummary: string;
}

export interface UpdateLoyaltyRulePayload {
  baseAmount: number;
  pointsPerBase: number;
  minPurchaseAmount?: number;
  maxPointsPerPurchase?: number | null;
  name?: string;
}

export const loyaltyRulesService = {
  /**
   * Consulta a regra de fidelidade ativa do estabelecimento
   * GET /api/v1/establishment/loyalty-rule
   */
  async getActiveRule(): Promise<PointRule> {
    const response = await apiClient.get<PointRule | { data: PointRule }>(
      '/establishment/loyalty-rule'
    );
    const body = response.data;
    return (body && 'data' in body ? body.data : body) as PointRule;
  },

  /**
   * Simula o cálculo de pontos para um determinado valor em tempo real
   * GET /api/v1/establishment/loyalty-rule/simulate
   */
  async simulateRule(params: SimulateRuleParams): Promise<SimulateRuleResponse> {
    const response = await apiClient.get<
      SimulateRuleResponse | { data: SimulateRuleResponse }
    >('/establishment/loyalty-rule/simulate', {
      params,
    });
    const body = response.data;
    return (body && 'data' in body ? body.data : body) as SimulateRuleResponse;
  },

  /**
   * Atualiza e versiona uma nova regra de conversão de pontos
   * PUT /api/v1/establishment/loyalty-rule
   */
  async updateRule(payload: UpdateLoyaltyRulePayload): Promise<PointRule> {
    const response = await apiClient.put<PointRule | { data: PointRule }>(
      '/establishment/loyalty-rule',
      payload
    );
    const body = response.data;
    return (body && 'data' in body ? body.data : body) as PointRule;
  },

  /**
   * Consulta o histórico de todas as versões anteriores das regras de fidelidade
   * GET /api/v1/establishment/loyalty-rule/history
   */
  async getRuleHistory(): Promise<PointRule[]> {
    const response = await apiClient.get<PointRule[] | { data: PointRule[] }>(
      '/establishment/loyalty-rule/history'
    );
    const body = response.data;
    return (body && 'data' in body ? body.data : body) as PointRule[];
  },
};

export default loyaltyRulesService;
