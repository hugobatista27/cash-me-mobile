import { apiClient } from '@/services/api';
import {
  walletService,
  CustomerPointBalance,
  PointTransaction,
  CustomerInvoice,
  calculateTotalBalance,
  calculateTotalAccumulated,
  isEstablishmentInactive,
  formatTransactionDate,
} from '@/services/wallet.service';

jest.mock('@/services/api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('WalletService (TASK-04)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBalances: CustomerPointBalance[] = [
    {
      id: 1,
      currentBalance: 350,
      totalAccumulated: 500,
      establishment: {
        id: 5,
        cnpj: '12345678000195',
        tradeName: 'Padaria Real',
        status: 'ACTIVE',
      },
    },
    {
      id: 2,
      currentBalance: 120,
      totalAccumulated: 120,
      establishment: {
        id: 8,
        cnpj: '98765432000100',
        tradeName: 'Supermercado Central',
        status: 'INACTIVE',
      },
    },
  ];

  const mockStatement: PointTransaction[] = [
    {
      id: 101,
      type: 'CREDIT',
      points: 150,
      description: 'Pontos gerados por NFC-e',
      createdAt: '2026-10-10T14:30:00Z',
    },
    {
      id: 89,
      type: 'DEBIT',
      points: 50,
      description: 'Resgate de recompensa',
      createdAt: '2026-10-05T11:15:00Z',
    },
  ];

  const mockInvoices: CustomerInvoice[] = [
    {
      id: 42,
      accessKey: '42230912345678000195650010000001231000001234',
      totalAmount: 150.0,
      pointsAwarded: 150,
      status: 'PROCESSED',
      createdAt: '2026-10-10T14:30:00Z',
      items: [
        {
          id: 1,
          description: 'Café Especial 250g',
          quantity: 2,
          unitPrice: 25.0,
          totalPrice: 50.0,
        },
      ],
    },
  ];

  describe('getCustomerBalances', () => {
    it('deve buscar saldos por estabelecimento em GET /customer/balances preservando lojas INACTIVE (RN05)', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockBalances,
      });

      const result = await walletService.getCustomerBalances();

      expect(apiClient.get).toHaveBeenCalledWith('/customer/balances');
      expect(result).toHaveLength(2);
      expect(result[0].establishment?.tradeName).toBe('Padaria Real');
      expect(result[1].establishment?.status).toBe('INACTIVE');
      expect(result[1].currentBalance).toBe(120);
    });

    it('deve desempacotar envelope { data: [...] } caso retornado pelo serializer', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockBalances },
      });

      const result = await walletService.getCustomerBalances();

      expect(apiClient.get).toHaveBeenCalledWith('/customer/balances');
      expect(result).toEqual(mockBalances);
    });
  });

  describe('getEstablishmentStatement', () => {
    it('deve buscar o extrato de transações de uma loja específica via GET /customer/establishments/:id/statement', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockStatement },
      });

      const result = await walletService.getEstablishmentStatement(5);

      expect(apiClient.get).toHaveBeenCalledWith('/customer/establishments/5/statement');
      expect(result).toEqual(mockStatement);
    });

    it('deve aceitar array direto sem envelope data', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockStatement,
      });

      const result = await walletService.getEstablishmentStatement('5');

      expect(apiClient.get).toHaveBeenCalledWith('/customer/establishments/5/statement');
      expect(result).toHaveLength(2);
    });
  });

  describe('getCustomerInvoices & getCustomerInvoiceById', () => {
    it('deve buscar histórico de notas fiscais do consumidor em GET /customer/invoices', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockInvoices },
      });

      const result = await walletService.getCustomerInvoices();

      expect(apiClient.get).toHaveBeenCalledWith('/customer/invoices');
      expect(result).toEqual(mockInvoices);
    });

    it('deve buscar detalhes de uma nota específica com itens em GET /customer/invoices/:id', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockInvoices[0] },
      });

      const result = await walletService.getCustomerInvoiceById(42);

      expect(apiClient.get).toHaveBeenCalledWith('/customer/invoices/42');
      expect(result.id).toBe(42);
      expect(result.items).toHaveLength(1);
      expect(result.items?.[0].description).toBe('Café Especial 250g');
    });
  });

  describe('Helpers de cálculo e formatação', () => {
    it('deve calcular o saldo atual agregado e o total acumulado corretamente', () => {
      expect(calculateTotalBalance(mockBalances)).toBe(470);
      expect(calculateTotalAccumulated(mockBalances)).toBe(620);
      expect(calculateTotalBalance([])).toBe(0);
    });

    it('deve identificar se o estabelecimento está inativo para novos pontos (RN05)', () => {
      expect(isEstablishmentInactive('INACTIVE')).toBe(true);
      expect(isEstablishmentInactive('SUSPENDED')).toBe(true);
      expect(isEstablishmentInactive('ACTIVE')).toBe(false);
      expect(isEstablishmentInactive(undefined)).toBe(false);
    });

    it('deve formatar data de transação de forma amigável', () => {
      const formatted = formatTransactionDate('2026-10-10T14:30:00Z');
      expect(formatted).toMatch(/10\/10\/2026/);
    });
  });
});
