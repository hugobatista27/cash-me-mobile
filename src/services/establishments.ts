import { apiClient } from '@/services/api';

export interface EstablishmentAddress {
  id?: number;
  establishmentId?: number;
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

export interface Establishment {
  id: number;
  cnpj: string;
  legalName: string;
  tradeName: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  conversionFactor: number;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  socialLinks?: Record<string, unknown> | null;
  address?: EstablishmentAddress | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Tradução da regra de conversão para badge amigável (RN04)
 * Ex: conversionFactor = 1.0 -> 'R$ 1 = 1 pt'
 *     conversionFactor = 0.1 -> 'R$ 10 = 1 pt'
 *     conversionFactor = 0.2 -> 'R$ 5 = 1 pt'
 *     conversionFactor = 2.0 -> 'R$ 1 = 2 pts'
 */
export function formatRuleBadge(conversionFactor?: number): string {
  if (!conversionFactor || conversionFactor <= 0) {
    return '1 pt por compra';
  }

  if (conversionFactor >= 1) {
    const pts = Math.round(conversionFactor);
    return pts === 1 ? 'R$ 1 = 1 pt' : `R$ 1 = ${pts} pts`;
  }

  const spendForOnePoint = Math.round(1 / conversionFactor);
  return `R$ ${spendForOnePoint} = 1 pt`;
}

/**
 * Tradução descritiva completa da regra de conversão para o consumidor (RN04)
 */
export function formatRuleDescription(conversionFactor?: number): string {
  if (!conversionFactor || conversionFactor <= 0) {
    return 'Consulte as regras de pontuação vigentes no estabelecimento.';
  }

  if (conversionFactor >= 1) {
    const pts = Math.round(conversionFactor);
    return pts === 1
      ? 'R$ 1,00 em compras = 1 ponto'
      : `A cada R$ 1,00 gasto ganhe ${pts} pontos`;
  }

  const spendForOnePoint = Math.round(1 / conversionFactor);
  return `A cada R$ ${spendForOnePoint},00 gastos ganhe 1 ponto`;
}

/**
 * Formata CNPJ (14 dígitos) para 00.000.000/0000-00
 */
export function formatCnpj(cnpj?: string | null): string {
  if (!cnpj) return '';
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formata número de telefone ou WhatsApp
 */
export function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

/**
 * Formata endereço completo em linha única
 */
export function formatFullAddress(address?: EstablishmentAddress | null): string {
  if (!address) return 'Endereço não informado';
  const parts = [
    address.street ? `${address.street}, ${address.number || 'S/N'}` : '',
    address.complement ? `(${address.complement})` : '',
    address.neighborhood || '',
    address.city && address.state ? `${address.city} - ${address.state}` : address.city || '',
    address.postalCode ? `CEP ${address.postalCode.replace(/^(\d{5})(\d{3})$/, '$1-$2')}` : '',
  ].filter(Boolean);

  return parts.join(', ');
}

export const establishmentsService = {
  /**
   * Lista estabelecimentos parceiros aplicando filtro de lojas ativas (RN06)
   */
  async listEstablishments(): Promise<Establishment[]> {
    const response = await apiClient.get<Establishment[] | { data: Establishment[] }>(
      '/establishments'
    );
    const rawData = response.data;
    const list: Establishment[] = Array.isArray(rawData)
      ? rawData
      : (rawData as { data: Establishment[] }).data || [];

    // RN06: Exibir apenas lojas ativas
    return list.filter((item) => item.status === 'ACTIVE');
  },

  /**
   * Obtém os detalhes de um estabelecimento pelo ID
   */
  async getEstablishmentById(id: number | string): Promise<Establishment> {
    const response = await apiClient.get<Establishment | { data: Establishment }>(
      `/establishments/${id}`
    );
    const rawData = response.data;
    if (rawData && typeof rawData === 'object' && 'data' in rawData) {
      return (rawData as { data: Establishment }).data;
    }
    return rawData as Establishment;
  },
};
