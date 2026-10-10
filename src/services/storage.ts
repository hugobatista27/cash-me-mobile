import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'cashme_auth_token';
const USER_KEY = 'cashme_auth_user';

export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

/**
 * Operações específicas de token no Keychain/Keystore
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  await storage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await storage.getItem(TOKEN_KEY);
};

export const removeAuthToken = async (): Promise<void> => {
  await storage.removeItem(TOKEN_KEY);
};

/**
 * Cache de sessão persistente em storage seguro
 */
export const saveSessionData = async (data: Record<string, unknown>): Promise<void> => {
  await storage.setItem(USER_KEY, JSON.stringify(data));
};

export const getSessionData = async <T>(): Promise<T | null> => {
  const raw = await storage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const removeSessionData = async (): Promise<void> => {
  await storage.removeItem(USER_KEY);
};
