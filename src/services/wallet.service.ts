import { apiClient } from '@/services/api';

export interface PointBalanceEstablishment {
  id: number;
  cnpj: string;
  legalName?: string;
  tradeName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  conversionFactor?: number;
}

export interface CustomerPointBalance {
  id: number;
  customerId?: number;
  establishmentId?: number;
  currentBalance: number;
  totalAccumulated: number;
  createdAt?: string;
  updatedAt?: string;
  establishment?: PointBalanceEstablishment;
}

export type TransactionType = 'CREDIT' | 'DEBIT' | 'REVERSAL';

export interface PointTransaction {
  id: number;
  customerId?: number;
  establishmentId?: number;
  invoiceId?: number | null;
  type: TransactionType;
  points: number;
  purchaseAmount?: number | null;
  appliedConversionFactor?: number | null;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface InvoicePurchasedItem {
  id: number;
  description?: string;
  rawDescription?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CustomerInvoice {
  id: number;
  customerId?: number;
  establishmentId?: number;
  accessKey: string;
  qrCodeUrl?: string;
  issuerState?: string;
  issuerCnpj?: string;
  issuedAt?: string;
  totalAmount: number;
  pointsAwarded: number;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  items?: InvoicePurchasedItem[];
  establishment?: PointBalanceEstablishment;
  balance?: {
    id: number;
    currentBalance: number;
    totalAccumulated: number;
  };
  invoice?: {
    id: number;
    accessKey: string;
    totalAmount: number;
    pointsAwarded?: number;
    status: 'PENDING' | 'PROCESSED' | 'REJECTED';
    rejectionReason?: string | null;
    issuedAt?: string;
    items?: InvoicePurchasedItem[];
  };
}

/**
 * Calcula o saldo atual agregado de pontos do consumidor em todas as lojas
 */
export function calculateTotalBalance(balances: CustomerPointBalance[]): number {
  if (!Array.isArray(balances) || balances.length === 0) return 0;
  return balances.reduce((acc, item) => acc + (Number(item.currentBalance) || 0), 0);
}

/**
 * Calcula o total histórico acumulado de pontos do consumidor
 */
export function calculateTotalAccumulated(balances: CustomerPointBalance[]): number {
  if (!Array.isArray(balances) || balances.length === 0) return 0;
  return balances.reduce((acc, item) => acc + (Number(item.totalAccumulated) || 0), 0);
}

/**
 * Verifica se o estabelecimento está temporariamente inativo para novas pontuações (RN05)
 */
export function isEstablishmentInactive(status?: string): boolean {
  return status === 'INACTIVE' || status === 'SUSPENDED';
}

/**
 * Formata uma data ISO para o padrão brasileiro legível (DD/MM/YYYY às HH:mm)
 */
export function formatTransactionDate(isoDate?: string): string {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  } catch {
    return isoDate;
  }
}

export const walletService = {
  /**
   * Consulta todos os saldos do consumidor segmentados por estabelecimento (GET /customer/balances).
   * RN05: Preserva saldos mesmo quando a loja está INACTIVE.
   */
  async getCustomerBalances(): Promise<CustomerPointBalance[]> {
    const response = await apiClient.get<
      CustomerPointBalance[] | { data: CustomerPointBalance[] }
    >('/customer/balances');

    const raw = response.data;
    if (Array.isArray(raw)) {
      return raw;
    }
    if (raw && typeof raw === 'object' && 'data' in raw) {
      return (raw as { data: CustomerPointBalance[] }).data || [];
    }
    return [];
  },

  /**
   * Consulta o extrato de transações de uma loja específica (GET /customer/establishments/:id/statement).
   */
  async getEstablishmentStatement(
    establishmentId: number | string
  ): Promise<PointTransaction[]> {
    const response = await apiClient.get<
      PointTransaction[] | { data: PointTransaction[] }
    >(`/customer/establishments/${establishmentId}/statement`);

    const raw = response.data;
    if (Array.isArray(raw)) {
      return raw;
    }
    if (raw && typeof raw === 'object' && 'data' in raw) {
      return (raw as { data: PointTransaction[] }).data || [];
    }
    return [];
  },

  /**
   * Consulta o histórico de notas fiscais submetidas pelo consumidor (GET /customer/invoices).
   */
  async getCustomerInvoices(): Promise<CustomerInvoice[]> {
    const response = await apiClient.get<
      CustomerInvoice[] | { data: CustomerInvoice[] }
    >('/customer/invoices');

    const raw = response.data;
    if (Array.isArray(raw)) {
      return raw;
    }
    if (raw && typeof raw === 'object' && 'data' in raw) {
      return (raw as { data: CustomerInvoice[] }).data || [];
    }
    return [];
  },

  /**
   * Consulta os detalhes de uma nota fiscal específica com itens (GET /customer/invoices/:id).
   */
  async getCustomerInvoiceById(id: number | string): Promise<CustomerInvoice> {
    const response = await apiClient.get<
      CustomerInvoice | { data: CustomerInvoice }
    >(`/customer/invoices/${id}`);

    const raw = response.data;
    if (raw && typeof raw === 'object' && 'data' in raw && (raw as { data: CustomerInvoice }).data) {
      return (raw as { data: CustomerInvoice }).data;
    }
    return raw as CustomerInvoice;
  },
};
