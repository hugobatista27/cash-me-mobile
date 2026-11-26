import { create } from 'zustand';

import { authService } from '@/services/auth';
import { queryClient } from '@/services/query-client';
import {
  getAuthToken,
  getSessionData,
  removeAuthToken,
  removeSessionData,
  saveAuthToken,
  saveSessionData,
} from '@/services/storage';

export type UserType = 'CUSTOMER' | 'ESTABLISHMENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface User {
  id: number;
  email: string;
  userType: UserType;
  status: UserStatus;
}

export interface CustomerProfile {
  id: number;
  fullName: string;
  cpf: string;
  phone: string;
}

export interface EstablishmentProfile {
  id: number;
  fullName: string;
  role: 'LOJISTA_ADMIN' | 'LOJISTA_OPERADOR';
}

export interface Establishment {
  id: number;
  cnpj: string;
  tradeName: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  legalName?: string;
}

export interface AuthSessionPayload {
  user: User;
  token: string;
  profile?: CustomerProfile | EstablishmentProfile | null;
  establishment?: Establishment | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  profile: CustomerProfile | EstablishmentProfile | null;
  establishment: Establishment | null;
  isAuthenticated: boolean;
  isRestoringSession: boolean;

  setAuth: (payload: AuthSessionPayload) => Promise<void>;
  clearAuth: () => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  profile: null,
  establishment: null,
  isAuthenticated: false,
  isRestoringSession: true,

  setAuth: async (payload) => {
    const compactProfile = payload.profile
      ? 'role' in payload.profile
        ? {
            id: payload.profile.id,
            fullName: payload.profile.fullName,
            role: payload.profile.role,
          }
        : {
            id: payload.profile.id,
            fullName: payload.profile.fullName,
            cpf: payload.profile.cpf,
            phone: payload.profile.phone,
          }
      : null;

    const compactEstablishment = payload.establishment
      ? {
          id: payload.establishment.id,
          cnpj: payload.establishment.cnpj,
          tradeName: payload.establishment.tradeName,
          status: payload.establishment.status,
          legalName: payload.establishment.legalName,
        }
      : null;

    await saveAuthToken(payload.token);
    await saveSessionData({
      user: {
        id: payload.user.id,
        email: payload.user.email,
        userType: payload.user.userType,
        status: payload.user.status,
      },
      profile: compactProfile,
      establishment: compactEstablishment,
    });

    set({
      user: payload.user,
      token: payload.token,
      profile: compactProfile,
      establishment: compactEstablishment,
      isAuthenticated: true,
      isRestoringSession: false,
    });
  },

  clearAuth: async () => {
    queryClient.clear();
    await removeAuthToken();
    await removeSessionData();

    set({
      user: null,
      token: null,
      profile: null,
      establishment: null,
      isAuthenticated: false,
      isRestoringSession: false,
    });
  },

  restoreSession: async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        set({
          user: null,
          token: null,
          profile: null,
          establishment: null,
          isAuthenticated: false,
          isRestoringSession: false,
        });
        return;
      }

      const cached = await getSessionData<{
        user: User;
        profile: CustomerProfile | EstablishmentProfile | null;
        establishment: Establishment | null;
      }>();

      if (cached?.user) {
        set({
          user: cached.user,
          token,
          profile: cached.profile ?? null,
          establishment: cached.establishment ?? null,
          isAuthenticated: true,
          isRestoringSession: false,
        });
      } else {
        set({
          user: null,
          token: null,
          profile: null,
          establishment: null,
          isAuthenticated: false,
          isRestoringSession: false,
        });
      }
    } catch {
      set({
        user: null,
        token: null,
        profile: null,
        establishment: null,
        isAuthenticated: false,
        isRestoringSession: false,
      });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignora erro de rede ao revogar token no logout
    }
    queryClient.clear();
    await removeAuthToken();
    await removeSessionData();

    set({
      user: null,
      token: null,
      profile: null,
      establishment: null,
      isAuthenticated: false,
      isRestoringSession: false,
    });
  },
}));

export default useAuthStore;
