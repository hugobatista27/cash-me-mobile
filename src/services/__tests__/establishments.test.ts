import { apiClient } from '@/services/api';
import {
  establishmentsService,
  Establishment,
  formatCnpj,
  formatPhone,
  formatRuleBadge,
  formatRuleDescription,
} from '@/services/establishments';

jest.mock('@/services/api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('EstablishmentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEstablishments: Establishment[] = [
    {
      id: 1,
      cnpj: '12345678000195',
      legalName: 'Padaria Real Ltda',
      tradeName: 'Padaria Real',
      status: 'ACTIVE',
      conversionFactor: 1.0,
      phone: '48999990001',
      whatsapp: '48999990001',
      address: {
        id: 1,
        postalCode: '88010000',
        state: 'SC',
        city: 'Florianópolis',
        neighborhood: 'Centro',
        street: 'Rua Felipe Schmidt',
        number: '100',
      },
    },
    {
      id: 2,
      cnpj: '98765432000100',
      legalName: 'Supermercado Central Ltda',
      tradeName: 'Supermercado Central',
      status: 'PENDING',
      conversionFactor: 0.1,
      address: {
        id: 2,
        postalCode: '88015000',
        state: 'SC',
        city: 'Florianópolis',
        neighborhood: 'Agronômica',
        street: 'Rua Rui Barbosa',
        number: '500',
      },
    },
  ];

  describe('listEstablishments', () => {
    it('deve buscar e retornar apenas estabelecimentos com status ACTIVE (RN06)', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockEstablishments,
      });

      const result = await establishmentsService.listEstablishments();

      expect(apiClient.get).toHaveBeenCalledWith('/establishments');
      expect(result).toHaveLength(1);
      expect(result[0].tradeName).toBe('Padaria Real');
      expect(result[0].status).toBe('ACTIVE');
    });

    it('deve desempacotar caso a resposta venha com envelope { data: [...] }', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockEstablishments },
      });

      const result = await establishmentsService.listEstablishments();

      expect(apiClient.get).toHaveBeenCalledWith('/establishments');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('getEstablishmentById', () => {
    it('deve buscar detalhes do estabelecimento por ID', async () => {
      const mockDetail = mockEstablishments[0];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockDetail,
      });

      const result = await establishmentsService.getEstablishmentById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/establishments/1');
      expect(result).toEqual(mockDetail);
    });

    it('deve desempacotar caso a resposta venha com envelope { data: {...} }', async () => {
      const mockDetail = mockEstablishments[0];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockDetail },
      });

      const result = await establishmentsService.getEstablishmentById(1);

      expect(result).toEqual(mockDetail);
    });
  });

  describe('formatRuleBadge & formatRuleDescription (RN04)', () => {
    it('deve formatar badge para conversionFactor = 1.0 (R$ 1 = 1 pt)', () => {
      expect(formatRuleBadge(1.0)).toBe('R$ 1 = 1 pt');
      expect(formatRuleDescription(1.0)).toBe('R$ 1,00 em compras = 1 ponto');
    });

    it('deve formatar badge para conversionFactor = 0.1 (R$ 10 = 1 pt)', () => {
      expect(formatRuleBadge(0.1)).toBe('R$ 10 = 1 pt');
      expect(formatRuleDescription(0.1)).toBe('A cada R$ 10,00 gastos ganhe 1 ponto');
    });

    it('deve formatar badge para conversionFactor = 0.2 (R$ 5 = 1 pt)', () => {
      expect(formatRuleBadge(0.2)).toBe('R$ 5 = 1 pt');
      expect(formatRuleDescription(0.2)).toBe('A cada R$ 5,00 gastos ganhe 1 ponto');
    });

    it('deve formatar badge para conversionFactor = 2.0 (1 pt = R$ 0,50 ou 2 pts / R$ 1)', () => {
      expect(formatRuleBadge(2.0)).toBe('R$ 1 = 2 pts');
      expect(formatRuleDescription(2.0)).toBe('A cada R$ 1,00 gasto ganhe 2 pontos');
    });
  });

  describe('formatCnpj & formatPhone', () => {
    it('deve formatar CNPJ corretamente', () => {
      expect(formatCnpj('12345678000195')).toBe('12.345.678/0001-95');
      expect(formatCnpj('12.345.678/0001-95')).toBe('12.345.678/0001-95');
      expect(formatCnpj('')).toBe('');
    });

    it('deve formatar telefone com 11 dígitos', () => {
      expect(formatPhone('48999990001')).toBe('(48) 99999-0001');
      expect(formatPhone('4833330001')).toBe('(48) 3333-0001');
    });
  });
});
