import { loyaltyRulesService } from '@/services/loyaltyRules';
import { apiClient } from '@/services/api';

jest.mock('@/services/api', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

describe('LoyaltyRulesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveRule', () => {
    it('deve buscar a regra de fidelidade ativa do estabelecimento', async () => {
      const mockRule = {
        id: 1,
        version: 1,
        name: 'Regra Base Inicial',
        baseAmount: 10,
        pointsPerBase: 1,
        minPurchaseAmount: 0,
        maxPointsPerPurchase: 500,
        status: 'ACTIVE',
        humanReadableSummary: 'A cada R$ 10,00 você ganha 1 ponto.',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockRule },
      });

      const result = await loyaltyRulesService.getActiveRule();

      expect(apiClient.get).toHaveBeenCalledWith('/establishment/loyalty-rule');
      expect(result).toEqual(mockRule);
    });

    it('deve lidar com resposta sem encapsulamento data', async () => {
      const mockRule = {
        id: 1,
        version: 1,
        name: 'Regra Base Inicial',
        baseAmount: 10,
        pointsPerBase: 1,
        minPurchaseAmount: 0,
        maxPointsPerPurchase: null,
        status: 'ACTIVE',
        humanReadableSummary: 'A cada R$ 10,00 você ganha 1 ponto.',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockRule,
      });

      const result = await loyaltyRulesService.getActiveRule();

      expect(apiClient.get).toHaveBeenCalledWith('/establishment/loyalty-rule');
      expect(result).toEqual(mockRule);
    });
  });

  describe('simulateRule', () => {
    it('deve simular pontuação para um valor específico', async () => {
      const mockSimulation = {
        purchaseAmount: 150,
        calculatedPoints: 15,
        ruleApplied: {
          baseAmount: 10,
          pointsPerBase: 1,
          minPurchaseAmount: 0,
          maxPointsPerPurchase: 500,
        },
        humanReadableSummary: 'A cada R$ 10,00 você ganha 1 ponto.',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockSimulation },
      });

      const result = await loyaltyRulesService.simulateRule({ amount: 150 });

      expect(apiClient.get).toHaveBeenCalledWith('/establishment/loyalty-rule/simulate', {
        params: { amount: 150 },
      });
      expect(result).toEqual(mockSimulation);
    });

    it('deve permitir parâmetros adicionais de simulação customizada', async () => {
      const mockSimulation = {
        purchaseAmount: 200,
        calculatedPoints: 40,
        ruleApplied: {
          baseAmount: 5,
          pointsPerBase: 1,
          minPurchaseAmount: 10,
          maxPointsPerPurchase: 100,
        },
        humanReadableSummary: 'A cada R$ 5,00 você ganha 1 ponto (compra mínima de R$ 10,00).',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockSimulation,
      });

      const result = await loyaltyRulesService.simulateRule({
        amount: 200,
        baseAmount: 5,
        pointsPerBase: 1,
        minPurchaseAmount: 10,
        maxPointsPerPurchase: 100,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/establishment/loyalty-rule/simulate', {
        params: {
          amount: 200,
          baseAmount: 5,
          pointsPerBase: 1,
          minPurchaseAmount: 10,
          maxPointsPerPurchase: 100,
        },
      });
      expect(result).toEqual(mockSimulation);
    });
  });

  describe('updateRule', () => {
    it('deve publicar e versionar nova regra de fidelidade', async () => {
      const payload = {
        baseAmount: 5,
        pointsPerBase: 1,
        minPurchaseAmount: 10,
        maxPointsPerPurchase: 1000,
        name: '1 ponto a cada R$ 5 acima de R$ 10',
      };

      const mockUpdatedRule = {
        id: 2,
        version: 2,
        name: '1 ponto a cada R$ 5 acima de R$ 10',
        baseAmount: 5,
        pointsPerBase: 1,
        minPurchaseAmount: 10,
        maxPointsPerPurchase: 1000,
        status: 'ACTIVE',
        humanReadableSummary: 'A cada R$ 5,00 você ganha 1 ponto (compra mínima de R$ 10,00).',
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({
        data: { data: mockUpdatedRule },
      });

      const result = await loyaltyRulesService.updateRule(payload);

      expect(apiClient.put).toHaveBeenCalledWith('/establishment/loyalty-rule', payload);
      expect(result).toEqual(mockUpdatedRule);
    });
  });

  describe('getRuleHistory', () => {
    it('deve listar o histórico de versões das regras de fidelidade', async () => {
      const mockHistory = [
        {
          id: 2,
          version: 2,
          name: 'Regra v2',
          status: 'ACTIVE',
          baseAmount: 5,
          pointsPerBase: 1,
          minPurchaseAmount: 10,
          maxPointsPerPurchase: 1000,
          humanReadableSummary: 'A cada R$ 5,00 você ganha 1 ponto.',
        },
        {
          id: 1,
          version: 1,
          name: 'Regra Base Inicial',
          status: 'INACTIVE',
          baseAmount: 10,
          pointsPerBase: 1,
          minPurchaseAmount: 0,
          maxPointsPerPurchase: null,
          humanReadableSummary: 'A cada R$ 10,00 você ganha 1 ponto.',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockHistory },
      });

      const result = await loyaltyRulesService.getRuleHistory();

      expect(apiClient.get).toHaveBeenCalledWith('/establishment/loyalty-rule/history');
      expect(result).toEqual(mockHistory);
    });
  });
});
