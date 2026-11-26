import { apiClient } from '@/services/api';

export interface StoreAddress {
  id: number;
  postalCode: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string | null;
  reference?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface StoreItem {
  id: number;
  cnpj: string;
  legalName: string;
  tradeName: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  conversionFactor: number;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  address?: StoreAddress | null;
}

export function formatConversionRule(factor: number): string {
  const numeric = Number(factor) || 1;
  if (numeric >= 1) {
    const pts = Math.round(numeric * 100) / 100;
    return `R$ 1,00 = ${pts} ${pts === 1 ? 'ponto' : 'pontos'}`;
  }
  const reais = Math.round((1 / numeric) * 100) / 100;
  return `A cada R$ ${reais.toFixed(2).replace('.', ',')} = 1 ponto`;
}

function unwrapData<T>(raw: T | { data: T }): T {
  if (raw && typeof raw === 'object' && 'data' in raw && raw.data !== undefined) {
    return raw.data;
  }
  return raw as T;
}

export const storesService = {
  async getStores(): Promise<StoreItem[]> {
    const response = await apiClient.get<StoreItem[] | { data: StoreItem[] }>('/establishments');
    const items = unwrapData(response.data);
    return Array.isArray(items) ? items : [];
  },

  async getStoreById(id: number | string): Promise<StoreItem> {
    const response = await apiClient.get<StoreItem | { data: StoreItem }>(`/establishments/${id}`);
    return unwrapData(response.data);
  },
};

export default storesService;
