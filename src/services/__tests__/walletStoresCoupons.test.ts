import { apiClient } from '../api';
import { walletService } from '../wallet';
import { storesService, formatConversionRule } from '../stores';
import { couponsService, formatRewardDiscount } from '../coupons';
import { merchantCustomersService } from '../merchantCustomers';

jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Wallet, Stores, Coupons & MerchantCustomers Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('walletService deve buscar saldos, extrato e notas desembrulhando { data }', async () => {
    (apiClient.get as jest.Mock)
      .mockResolvedValueOnce({ data: { data: [{ id: 1, currentBalance: 120 }] } })
      .mockResolvedValueOnce({ data: { data: [{ id: 10, type: 'CREDIT', points: 50 }] } })
      .mockResolvedValueOnce({ data: { data: [{ id: 99, status: 'PROCESSED' }] } });

    const balances = await walletService.getBalances();
    const statement = await walletService.getStatement(5);
    const invoices = await walletService.getInvoices();

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/customer/balances');
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/customer/establishments/5/statement');
    expect(apiClient.get).toHaveBeenNthCalledWith(3, '/customer/invoices');
    expect(balances[0].currentBalance).toBe(120);
    expect(statement[0].type).toBe('CREDIT');
    expect(invoices[0].id).toBe(99);
  });

  it('storesService deve listar lojas e formatar regra de conversão', async () => {
    (apiClient.get as jest.Mock)
      .mockResolvedValueOnce({ data: { data: [{ id: 1, tradeName: 'Padaria Real' }] } })
      .mockResolvedValueOnce({ data: { data: { id: 1, tradeName: 'Padaria Real' } } });

    const list = await storesService.getStores();
    const detail = await storesService.getStoreById(1);

    expect(list).toHaveLength(1);
    expect(detail.tradeName).toBe('Padaria Real');
    expect(formatConversionRule(1)).toBe('R$ 1,00 = 1 ponto');
    expect(formatConversionRule(0.1)).toBe('A cada R$ 10,00 = 1 ponto');
  });

  it('couponsService deve normalizar respostas snake_case da API de rewards e cupons', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          id: 7,
          establishment_id: 2,
          title: 'R$ 15 OFF',
          discount_type: 'FIXED',
          discount_value: 15,
          points_cost: 150,
          validity_days: 30,
          status: 'ACTIVE',
        },
      ],
    });
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: {
        id: 20,
        customer_id: 1,
        establishment_id: 2,
        reward_id: 7,
        code: 'ABCD1234',
        points_cost: 150,
        status: 'ACTIVE',
        expires_at: '2026-12-25T00:00:00Z',
      },
    });

    const rewards = await couponsService.getStoreRewards(2);
    const coupon = await couponsService.redeemReward(7);

    expect(rewards[0].pointsCost).toBe(150);
    expect(formatRewardDiscount(rewards[0])).toBe('R$ 15,00 OFF');
    expect(coupon.code).toBe('ABCD1234');
    expect(coupon.pointsCost).toBe(150);
  });

  it('merchantCustomersService deve consultar /establishment/customers com busca', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { data: [{ id: 1, fullName: 'Maria', currentBalance: 80 }] },
    });

    const customers = await merchantCustomersService.getCustomers('Maria');
    expect(apiClient.get).toHaveBeenCalledWith('/establishment/customers?search=Maria');
    expect(customers[0].fullName).toBe('Maria');
  });
});
