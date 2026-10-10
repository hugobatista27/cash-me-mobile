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

/**
 * Serviço de autenticação e contas
 */
export const authService = {
  /**
   * Login unificado (Consumidor ou Lojista)
   * POST /api/v1/auth/login
   */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', payload);
    return response.data;
  },

  /**
   * Cadastro de consumidor global
   * POST /api/v1/auth/customer/signup
   */
  async signupCustomer(payload: SignupCustomerRequest): Promise<SignupCustomerResponse> {
    const response = await apiClient.post<SignupCustomerResponse>(
      '/auth/customer/signup',
      payload
    );
    return response.data;
  },

  /**
   * Onboarding de estabelecimento comercial
   * POST /api/v1/auth/establishment/register
   */
  async registerEstablishment(
    payload: RegisterEstablishmentRequest
  ): Promise<RegisterEstablishmentResponse> {
    const response = await apiClient.post<RegisterEstablishmentResponse>(
      '/auth/establishment/register',
      payload
    );
    return response.data;
  },

  /**
   * Encerramento de sessão
   * POST /api/v1/account/logout
   */
  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>('/account/logout');
    return response.data;
  },
};

export default authService;
