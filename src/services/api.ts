import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

import { getAuthToken } from '@/services/storage';

/**
 * Obtém a baseURL do backend considerando as particularidades de cada plataforma
 * e variáveis de ambiente com prefixo EXPO_PUBLIC_
 */
export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // No emulador Android, 10.0.2.2 mapeia para o localhost da máquina host
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3333/api/v1';
  }

  // No iOS Simulator e Web, localhost funciona diretamente
  return 'http://localhost:3333/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Instância principal do cliente Axios
 */
// eslint-disable-next-line import/no-named-as-default-member
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Timeout de 15 segundos para resiliência em redes móveis
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor de requisições anexando o token Bearer salvo no SecureStore
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignora erro de leitura de token se ocorrer
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respostas: captura global de 401 limpando sessão
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      try {
        const { useAuthStore } = await import('@/stores/use-auth-store');
        await useAuthStore.getState().clearAuth();
      } catch {
        // Ignora erro durante limpeza de sessão
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extrai mensagem de erro legível de respostas da API AdonisJS/VineJS (`message` ou `errors[0].message`).
 */
export const extractApiErrorMessage = (err: unknown, fallback: string): string => {
  const maybeAxios = err as {
    response?: {
      data?: {
        message?: string;
        errors?: { message?: string }[];
      };
    };
  };
  const data = maybeAxios?.response?.data;
  return data?.message || data?.errors?.[0]?.message || fallback;
};

/**
 * Endpoint de health check para validação de conectividade.
 * Tenta GET /api/v1/health e faz fallback para GET / na raiz do servidor.
 */
export const checkHealth = async (config?: AxiosRequestConfig): Promise<boolean> => {
  try {
    const response = await apiClient.get('/health', config);
    return response.status >= 200 && response.status < 300;
  } catch {
    try {
      const rootUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/';
      const rootResponse = await axios.get(rootUrl, { timeout: 15000, ...config });
      return rootResponse.status >= 200 && rootResponse.status < 300;
    } catch {
      return false;
    }
  }
};

export default apiClient;
