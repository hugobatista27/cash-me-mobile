import { apiClient } from '@/services/api';
import {
  cancelCoupon,
  CancelCouponResponse,
  CouponRedemption,
  couponsService,
  formatCouponCode,
  getCustomerCoupons,
  getCustomerEstablishmentRewards,
  isCouponActive,
  isCouponExpired,
  normalizeCoupon,
  redeemReward,
  RedeemRewardResponse,
} from '@/services/coupons.service';
import { Reward } from '@/services/rewards.service';

jest.mock('@/services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('CouponsService (TASK-11)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReward: Reward = {
    id: 1,
    establishmentId: 10,
    title: 'Desconto de R$ 15,00',
    description: 'Válido para compras acima de R$ 50',
    discountType: 'FIXED_AMOUNT',
    discountValue: 15,
    minPurchaseAmount: 50,
    maxDiscountAmount: null,
    pointsCost: 150,
    stock: 25,
    validityDays: 7,
    status: 'ACTIVE',
  };

  const mockCoupon: CouponRedemption = {
    id: 101,
    customerId: 5,
    establishmentId: 10,
    rewardId: 1,
    code: 'CM7X9K2',
    pointsCost: 150,
    discountType: 'FIXED_AMOUNT',
    discountValue: 15,
    minPurchaseAmount: 50,
    maxDiscountAmount: null,
    status: 'ACTIVE',
    expiresAt: '2026-10-28T20:00:00Z',
    usedAt: null,
    cancelledAt: null,
    createdAt: '2026-10-21T20:00:00Z',
    reward: mockReward,
    establishment: {
      id: 10,
      cnpj: '12.345.678/0001-90',
      tradeName: 'Café & Bistrô Central',
      status: 'ACTIVE',
    },
  };

  describe('getCustomerEstablishmentRewards', () => {
    it('deve buscar recompensas ativas da loja chamando GET /customer/establishments/:id/rewards', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: [mockReward] },
      });

      const result = await couponsService.getCustomerEstablishmentRewards(10);

      expect(apiClient.get).toHaveBeenCalledWith('/customer/establishments/10/rewards');
      expect(result).toEqual([mockReward]);
    });

    it('deve desempacotar resposta que venha como array direto', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: [mockReward],
      });

      const result = await couponsService.getCustomerEstablishmentRewards(10);

      expect(result).toEqual([mockReward]);
    });

    it('deve retornar lista vazia se resposta for nula ou inválida', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: null,
      });

      const result = await couponsService.getCustomerEstablishmentRewards(10);

      expect(result).toEqual([]);
    });
  });

  describe('redeemReward', () => {
    it('deve realizar resgate atômico chamando POST /customer/rewards/:id/redeem', async () => {
      const mockResponse: RedeemRewardResponse = {
        coupon: mockCoupon,
        message: 'Cupom resgatado com sucesso!',
        balance: {
          currentBalance: 350,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { data: mockResponse },
      });

      const result = await couponsService.redeemReward(1);

      expect(apiClient.post).toHaveBeenCalledWith('/customer/rewards/1/redeem');
      expect(result).toEqual(mockResponse);
      expect(result.coupon.code).toBe('CM7X9K2');
    });

    it('deve encapsular objeto coupon caso backend retorne CouponRedemption diretamente', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockCoupon,
      });

      const result = await couponsService.redeemReward(1);

      expect(result.coupon).toEqual(mockCoupon);
    });
  });

  describe('cancelCoupon', () => {
    it('deve cancelar cupom ativo e estornar pontos chamando POST /customer/coupons/:id/cancel', async () => {
      const cancelledCoupon: CouponRedemption = {
        ...mockCoupon,
        status: 'CANCELLED',
        cancelledAt: '2026-10-21T21:00:00Z',
      };

      const mockResponse: CancelCouponResponse = {
        coupon: cancelledCoupon,
        message: 'Cupom cancelado e pontos estornados.',
        refundedPoints: 150,
        balance: {
          currentBalance: 500,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { data: mockResponse },
      });

      const result = await couponsService.cancelCoupon(101);

      expect(apiClient.post).toHaveBeenCalledWith('/customer/coupons/101/cancel');
      expect(result).toEqual(mockResponse);
      expect(result.coupon.status).toBe('CANCELLED');
    });

    it('deve encapsular resposta direta de cancelamento caso backend retorne cupom atualizado', async () => {
      const cancelledCoupon: CouponRedemption = {
        ...mockCoupon,
        status: 'CANCELLED',
        cancelledAt: '2026-10-21T21:00:00Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: cancelledCoupon,
      });

      const result = await couponsService.cancelCoupon(101);

      expect(result.coupon).toEqual(cancelledCoupon);
    });
  });

  describe('getCustomerCoupons', () => {
    it('deve buscar histórico de cupons chamando GET /customer/coupons sem filtros', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: [mockCoupon] },
      });

      const result = await couponsService.getCustomerCoupons();

      expect(apiClient.get).toHaveBeenCalledWith('/customer/coupons', {
        params: undefined,
      });
      expect(result).toEqual([mockCoupon]);
    });

    it('deve enviar parâmetro status quando fornecido (ex: ACTIVE)', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: [mockCoupon],
      });

      const result = await couponsService.getCustomerCoupons('ACTIVE');

      expect(apiClient.get).toHaveBeenCalledWith('/customer/coupons', {
        params: { status: 'ACTIVE' },
      });
      expect(result).toEqual([mockCoupon]);
    });

    it('deve normalizar campos snake_case e string (discount_value e discount_type) para camelCase numérico', async () => {
      const rawApiCoupon = {
        id: 102,
        customer_id: 5,
        establishment_id: 10,
        reward_id: 1,
        code: 'DISC10',
        points_cost: '100',
        discount_type: 'FIXED_AMOUNT',
        discount_value: '10.00',
        min_purchase_amount: '50.00',
        max_discount_amount: null,
        status: 'ACTIVE',
        expires_at: '2026-10-28T20:00:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: [rawApiCoupon] },
      });

      const result = await couponsService.getCustomerCoupons();

      expect(result).toHaveLength(1);
      expect(result[0].discountValue).toBe(10);
      expect(result[0].discountType).toBe('FIXED_AMOUNT');
      expect(result[0].pointsCost).toBe(100);
      expect(result[0].minPurchaseAmount).toBe(50);
    });

    it('deve retornar lista vazia se resposta for nula', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: null,
      });

      const result = await couponsService.getCustomerCoupons();

      expect(result).toEqual([]);
    });
  });

  describe('Standalone functions export', () => {
    it('deve chamar os métodos correspondentes através dos exports diretos', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [mockReward] });
      const rewards = await getCustomerEstablishmentRewards(10);
      expect(rewards).toEqual([mockReward]);

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockCoupon });
      const redeemRes = await redeemReward(1);
      expect(redeemRes.coupon).toEqual(mockCoupon);

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockCoupon });
      const cancelRes = await cancelCoupon(101);
      expect(cancelRes.coupon).toEqual(mockCoupon);

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [mockCoupon] });
      const coupons = await getCustomerCoupons();
      expect(coupons).toEqual([mockCoupon]);
    });
  });

  describe('Pure Helpers', () => {
    describe('formatCouponCode', () => {
      it('deve formatar código em caixa alta e sem espaços externos', () => {
        expect(formatCouponCode('cm7x9k2')).toBe('CM7X9K2');
        expect(formatCouponCode('  cm7x9k2  ')).toBe('CM7X9K2');
      });

      it('deve retornar string vazia se o código for nulo, indefinido ou vazio', () => {
        expect(formatCouponCode('')).toBe('');
        expect(formatCouponCode(null as unknown as string)).toBe('');
        expect(formatCouponCode(undefined as unknown as string)).toBe('');
      });
    });

    describe('isCouponActive', () => {
      it('deve retornar true quando status for ACTIVE e data de expiração estiver no futuro', () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        expect(
          isCouponActive({
            status: 'ACTIVE',
            expiresAt: futureDate,
          })
        ).toBe(true);
      });

      it('deve retornar false quando status for ACTIVE mas data de expiração já tiver passado', () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString();
        expect(
          isCouponActive({
            status: 'ACTIVE',
            expiresAt: pastDate,
          })
        ).toBe(false);
      });

      it('deve retornar false para cupons com status USED, CANCELLED ou EXPIRED', () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        expect(isCouponActive({ status: 'USED', expiresAt: futureDate })).toBe(false);
        expect(isCouponActive({ status: 'CANCELLED', expiresAt: futureDate })).toBe(false);
        expect(isCouponActive({ status: 'EXPIRED', expiresAt: futureDate })).toBe(false);
      });
    });

    describe('isCouponExpired', () => {
      it('deve retornar true se status for EXPIRED', () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        expect(
          isCouponExpired({
            status: 'EXPIRED',
            expiresAt: futureDate,
          })
        ).toBe(true);
      });

      it('deve retornar true se a data de expiração estiver no passado', () => {
        const pastDate = new Date(Date.now() - 3600000).toISOString();
        expect(
          isCouponExpired({
            status: 'ACTIVE',
            expiresAt: pastDate,
          })
        ).toBe(true);
      });

      it('deve retornar false se status for ACTIVE e ainda dentro da validade', () => {
        const futureDate = new Date(Date.now() + 3600000).toISOString();
        expect(
          isCouponExpired({
            status: 'ACTIVE',
            expiresAt: futureDate,
          })
        ).toBe(false);
      });
    });

    describe('normalizeCoupon', () => {
      it('deve extrair e converter discountValue e discountType de snake_case e strings', () => {
        const raw = {
          id: 99,
          discount_type: 'PERCENTAGE',
          discount_value: '25.50',
          points_cost: '200',
        };

        const normalized = normalizeCoupon(raw);

        expect(normalized.discountType).toBe('PERCENTAGE');
        expect(normalized.discountValue).toBe(25.5);
        expect(normalized.pointsCost).toBe(200);
      });

      it('deve fazer fallback para reward aninhado se campos diretos estiverem ausentes', () => {
        const raw = {
          id: 100,
          reward: {
            discount_type: 'FIXED_AMOUNT',
            discount_value: '10',
          },
        };

        const normalized = normalizeCoupon(raw);

        expect(normalized.discountType).toBe('FIXED_AMOUNT');
        expect(normalized.discountValue).toBe(10);
      });

      it('deve retornar 0 para discountValue se nenhum campo estiver presente', () => {
        const raw = { id: 101 };
        const normalized = normalizeCoupon(raw);

        expect(normalized.discountValue).toBe(0);
        expect(normalized.discountType).toBe('FIXED_AMOUNT');
      });
    });
  });
});
