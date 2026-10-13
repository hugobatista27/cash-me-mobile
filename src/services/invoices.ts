import { apiClient } from '@/services/api';

export interface ProcessInvoicePayload {
  accessKey: string;
  qrCodeUrl?: string;
  issuerState?: 'SC' | 'PR';
  issuerCnpj?: string;
  issuedAt?: string;
  totalAmount?: number;
}

export interface InvoiceItem {
  id: number;
  accessKey: string;
  totalAmount: number;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  rejectionReason?: string | null;
  issuedAt?: string;
}

export interface ProcessInvoiceResponse {
  invoice: InvoiceItem;
  pointsAwarded: number;
  status: 'PROCESSED' | 'REJECTED';
  rejectionReason?: string | null;
  balance?: {
    id: number;
    currentBalance: number;
    totalAccumulated: number;
  };
  establishment?: {
    id: number;
    tradeName: string;
    cnpj: string;
  };
}

/**
 * Envia uma NFC-e para processamento e concessão de pontos via POST /customer/invoices/process
 */
export const processInvoice = async (
  payload: ProcessInvoicePayload
): Promise<ProcessInvoiceResponse> => {
  const response = await apiClient.post<
    ProcessInvoiceResponse | { data: ProcessInvoiceResponse }
  >('/customer/invoices/process', payload);

  const raw = response.data;
  if (raw && typeof raw === 'object' && 'data' in raw && (raw as { data: ProcessInvoiceResponse }).data) {
    return (raw as { data: ProcessInvoiceResponse }).data;
  }

  return raw as ProcessInvoiceResponse;
};

/**
 * Consulta os detalhes de uma nota fiscal processada por ID via GET /customer/invoices/:id
 */
export const getInvoiceDetails = async (
  id: number | string
): Promise<ProcessInvoiceResponse> => {
  const response = await apiClient.get<
    ProcessInvoiceResponse | { data: ProcessInvoiceResponse }
  >(`/customer/invoices/${id}`);

  const raw = response.data;
  if (raw && typeof raw === 'object' && 'data' in raw && (raw as { data: ProcessInvoiceResponse }).data) {
    return (raw as { data: ProcessInvoiceResponse }).data;
  }

  return raw as ProcessInvoiceResponse;
};
