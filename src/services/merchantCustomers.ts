import { apiClient } from '@/services/api';

export interface MerchantCustomerItem {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  currentBalance: number;
  totalAccumulated: number;
  lastActivityAt: string;
}

export const merchantCustomersService = {
  async getCustomers(search?: string): Promise<MerchantCustomerItem[]> {
    const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const response = await apiClient.get<
      MerchantCustomerItem[] | { data: MerchantCustomerItem[] }
    >(`/establishment/customers${query}`);
    const raw = response.data;
    const list =
      raw && typeof raw === 'object' && 'data' in raw && raw.data !== undefined ? raw.data : raw;
    return Array.isArray(list) ? list : [];
  },
};

export default merchantCustomersService;
