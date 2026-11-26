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
 * Extrai mapa de erros por campo de respostas 422 do AdonisJS/VineJS.
 */
export const extractApiFieldErrors = (err: unknown): Record<string, string> => {
  const maybeAxios = err as {
    response?: {
      data?: {
        errors?: { field?: string; message?: string }[];
      };
    };
  };
  const errors = maybeAxios?.response?.data?.errors;
  if (!Array.isArray(errors)) return {};

  const result: Record<string, string> = {};
  for (const item of errors) {
    if (item?.field && item?.message && !result[item.field]) {
      result[item.field] = item.message;
    }
  }
  return result;
};

/**
 * Extrai mensagem de erro esclarecedora de erros Axios (rede, timeout, 4xx, 5xx) ou erros locais.
 */
export const extractApiErrorMessage = (err: unknown, fallback: string): string => {
  const maybeAxios = err as {
    isAxiosError?: boolean;
    code?: string;
    message?: string;
    response?: {
      status?: number;
      data?: {
        code?: string;
        message?: string;
        errors?: { field?: string; message?: string }[];
      } | string;
    };
  };

  if (!maybeAxios?.response) {
    if (maybeAxios?.code === 'ECONNABORTED' || maybeAxios?.code === 'ETIMEDOUT') {
      return 'Tempo limite excedido ao conectar ao servidor. Verifique sua conexão e tente novamente.';
    }

    if (
      maybeAxios?.isAxiosError ||
      maybeAxios?.code === 'ERR_NETWORK' ||
      maybeAxios?.message === 'Network Error'
    ) {
      const devHint =
        typeof __DEV__ !== 'undefined' && __DEV__ ? ` (${API_BASE_URL})` : '';
      return `Não foi possível conectar ao servidor${devHint}. Verifique sua internet e se a API está em execução.`;
    }

    if (err instanceof Error && err.message) {
      return err.message;
    }

    return fallback;
  }

  const status = maybeAxios.response.status ?? 0;
  const rawData = maybeAxios.response.data;

  if (typeof rawData === 'string') {
    if (status >= 500) {
      return `Erro interno no servidor (HTTP ${status}). Tente novamente em instantes.`;
    }
    return fallback;
  }

  const data = rawData;
  if (data?.code === 'E_INVALID_CREDENTIALS') {
    return 'E-mail ou senha incorretos.';
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const messages = data.errors
      .map((item) => item?.message?.trim())
      .filter((msg): msg is string => Boolean(msg))
      .map((msg) =>
        msg === 'Invalid user credentials' ? 'E-mail ou senha incorretos.' : msg
      );
    const unique = Array.from(new Set(messages));
    if (unique.length > 0) {
      return unique.join('\n');
    }
  }

  if (data?.message) {
    if (data.message === 'Invalid user credentials') {
      return 'E-mail ou senha incorretos.';
    }
    return data.message;
  }

  if (status >= 500) {
    return `Erro interno no servidor (HTTP ${status}). Tente novamente em instantes.`;
  }

  return fallback;
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
