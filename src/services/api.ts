import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

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

// Interceptor de requisições (preparado para injeção de token JWT/Bearer)
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respostas para captura global de erros de rede
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Endpoint de health check para validação de conectividade em modo desenvolvimento.
 * Tenta GET / e faz fallback para GET /swagger.
 */
export const checkHealth = async (config?: AxiosRequestConfig): Promise<boolean> => {
  try {
    const response = await apiClient.get('/', config);
    return response.status >= 200 && response.status < 300;
  } catch {
    try {
      const swaggerResponse = await apiClient.get('/swagger', config);
      return swaggerResponse.status >= 200 && swaggerResponse.status < 300;
    } catch {
      return false;
    }
  }
};

export default apiClient;
