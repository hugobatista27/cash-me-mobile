import { create } from 'zustand';

export interface AppState {
  isLoading: boolean;
  isConnected: boolean;
  isReady: boolean;
  setIsLoading: (isLoading: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  setIsReady: (isReady: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  isConnected: true,
  isReady: false,
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setIsConnected: (isConnected: boolean) => set({ isConnected }),
  setIsReady: (isReady: boolean) => set({ isReady }),
  reset: () => set({ isLoading: false, isConnected: true, isReady: false }),
}));

export default useAppStore;
