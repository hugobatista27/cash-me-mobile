import { apiClient } from '@/services/api';

export interface WalletEstablishment {
  id: number;
  cnpj: string;
  legalName?: string;
  tradeName: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  conversionFactor?: number;
}

export interface PointBalanceItem {
  id: number;
  customerId: number;
  establishmentId: number;
  currentBalance: number;
  totalAccumulated: number;
  createdAt?: string;
  updatedAt?: string;
  establishment: WalletEstablishment;
}

export interface PointTransactionItem {
  id: number;
  customerId: number;
  establishmentId: number;
  invoiceId?: number | null;
  ruleId?: number | null;
  ruleVersion?: number | null;
  couponRedemptionId?: number | null;
  type: 'CREDIT' | 'DEBIT' | 'REVERSAL';
  points: number;
  purchaseAmount?: number | null;
  appliedConversionFactor?: number | null;
  description: string;
  createdAt: string;
}

export interface CustomerInvoiceListItem {
  id: number;
  accessKey: string;
  issuerCnpj: string;
  issuerState: string;
  totalAmount: number;
  pointsAwarded: number;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  rejectionReason?: string | null;
  issuedAt?: string;
  createdAt: string;
}

function unwrapData<T>(raw: T | { data: T }): T {
  if (raw && typeof raw === 'object' && 'data' in raw && raw.data !== undefined) {
    return raw.data;
  }
  return raw as T;
}

export const walletService = {
  async getBalances(): Promise<PointBalanceItem[]> {
    const response = await apiClient.get<PointBalanceItem[] | { data: PointBalanceItem[] }>(
      '/customer/balances'
    );
    const items = unwrapData(response.data);
    return Array.isArray(items) ? items : [];
  },

  async getStatement(establishmentId: number | string): Promise<PointTransactionItem[]> {
    const response = await apiClient.get<
      PointTransactionItem[] | { data: PointTransactionItem[] }
    >(`/customer/establishments/${establishmentId}/statement`);
    const items = unwrapData(response.data);
    return Array.isArray(items) ? items : [];
  },

  async getInvoices(): Promise<CustomerInvoiceListItem[]> {
    const response = await apiClient.get<
      CustomerInvoiceListItem[] | { data: CustomerInvoiceListItem[] }
    >('/customer/invoices');
    const items = unwrapData(response.data);
    return Array.isArray(items) ? items : [];
  },
};

export default walletService;
