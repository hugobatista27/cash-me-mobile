import { apiClient } from '@/services/api';
import {
  CustomerProfile,
  Establishment,
  EstablishmentProfile,
  User,
} from '@/stores/use-auth-store';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  profile?: CustomerProfile | EstablishmentProfile;
  establishment?: Establishment;
}

export interface SignupCustomerRequest {
  fullName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  cpf: string;
  phone: string;
  termsAccepted: boolean;
  deviceToken?: string;
}

export interface SignupCustomerResponse {
  user: User;
  profile: CustomerProfile;
  token: string;
}

export interface RegisterEstablishmentRequest {
  user: {
    fullName: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  };
  establishment: {
    cnpj: string;
    legalName: string;
    tradeName: string;
    conversionFactor?: number;
    contact: {
      phone: string;
      whatsapp?: string;
      email: string;
    };
  };
  address: {
    postalCode: string;
    state: string;
    city: string;
    neighborhood: string;
    street: string;
    number: string;
    complement?: string;
  };
}

export interface RegisterEstablishmentResponse {
  message?: string;
  user: User;
  profile?: EstablishmentProfile;
  establishment: Establishment;
  token: string;
}

export interface LogoutResponse {
  message: string;
}

function unwrapAuthBody<T>(body: unknown): T {
  if (!body || typeof body !== 'object') {
    throw new Error('Resposta inválida do servidor. Verifique o endereço da API.');
  }
  if ('data' in body && (body as { data?: T }).data !== undefined) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/**
 * Serviço de autenticação e contas
 */
export const authService = {
  /**
   * Login unificado (Consumidor ou Lojista)
   * POST /api/v1/auth/login
   */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse | { data: LoginResponse }>(
      '/auth/login',
      payload
    );
    return unwrapAuthBody<LoginResponse>(response.data);
  },

  /**
   * Cadastro de consumidor global
   * POST /api/v1/auth/customer/signup
   */
  async signupCustomer(payload: SignupCustomerRequest): Promise<SignupCustomerResponse> {
    const response = await apiClient.post<
      SignupCustomerResponse | { data: SignupCustomerResponse }
    >('/auth/customer/signup', payload);
    return unwrapAuthBody<SignupCustomerResponse>(response.data);
  },

  /**
   * Onboarding de estabelecimento comercial
   * POST /api/v1/auth/establishment/register
   */
  async registerEstablishment(
    payload: RegisterEstablishmentRequest
  ): Promise<RegisterEstablishmentResponse> {
    const response = await apiClient.post<
      RegisterEstablishmentResponse | { data: RegisterEstablishmentResponse }
    >('/auth/establishment/register', payload);
    return unwrapAuthBody<RegisterEstablishmentResponse>(response.data);
  },

  /**
   * Encerramento de sessão
   * POST /api/v1/account/logout
   */
  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse | { data: LogoutResponse }>(
      '/account/logout'
    );
    return unwrapAuthBody<LogoutResponse>(response.data);
  },
};

export default authService;
