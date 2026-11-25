import { apiClient } from '@/services/api';

export interface ProcessInvoiceItemInput {
  rawDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ProcessInvoicePayload {
  accessKey: string;
  qrCodeUrl?: string;
  issuerState?: 'SC' | 'PR';
  issuerCnpj?: string;
  issuedAt?: string;
  totalAmount?: number;
  items?: ProcessInvoiceItemInput[];
}

export interface InvoiceItem {
  id: number;
  accessKey: string;
  totalAmount: number;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  rejectionReason?: string | null;
  issuedAt?: string;
  issuerCnpj?: string;
  pointsAwarded?: number;
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
    ProcessInvoiceResponse | InvoiceItem | { data: ProcessInvoiceResponse | InvoiceItem }
  >(`/customer/invoices/${id}`);

  const raw = response.data;
  const unwrapped =
    raw && typeof raw === 'object' && 'data' in raw && raw.data ? raw.data : raw;

  if (unwrapped && typeof unwrapped === 'object' && 'invoice' in unwrapped) {
    return unwrapped as ProcessInvoiceResponse;
  }

  const flat = unwrapped as InvoiceItem;
  return {
    invoice: {
      id: flat.id,
      accessKey: flat.accessKey,
      totalAmount: Number(flat.totalAmount ?? 0),
      status: flat.status,
      rejectionReason: flat.rejectionReason ?? null,
      issuedAt: flat.issuedAt,
    },
    pointsAwarded: Number(flat.pointsAwarded ?? 0),
    status: flat.status === 'REJECTED' ? 'REJECTED' : 'PROCESSED',
    rejectionReason: flat.rejectionReason ?? null,
    establishment: flat.issuerCnpj
      ? { id: 0, tradeName: 'Estabelecimento Parceiro', cnpj: flat.issuerCnpj }
      : undefined,
  };
};
