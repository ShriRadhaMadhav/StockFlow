import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type Store, type User } from '../services/api/auth.api';
import { storeApi } from '../services/api/store.api';

interface AuthState {
  token: string | null;
  user: User | null;
  stores: Store[];
  activeStore: Store | null;
  isLoading: boolean;
  error: string | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  fetchMe: () => Promise<void>;
  createStore: (payload: {
    storeName: string;
    businessType: string;
    gstNumber?: string;
  }) => Promise<Store>;
  clearError: () => void;
  logout: () => void;
}

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ error?: string }>(error) && error.response?.data.error) {
    return error.response.data.error;
  }

  return 'Something went wrong. Please try again.';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      stores: [],
      activeStore: null,
      isLoading: false,
      error: null,
      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.login(payload);
          set({
            token: data.token,
            user: data.user,
            stores: data.user.stores,
            activeStore: data.user.stores[0] ?? null,
            isLoading: false,
          });
        } catch (error) {
          set({ error: getErrorMessage(error), isLoading: false });
          throw error;
        }
      },
      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.register(payload);
          set({
            token: data.token,
            user: data.user,
            stores: data.user.stores,
            activeStore: data.user.stores[0] ?? null,
            isLoading: false,
          });
        } catch (error) {
          set({ error: getErrorMessage(error), isLoading: false });
          throw error;
        }
      },
      fetchMe: async () => {
        if (!get().token) return;

        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.me();
          set({
            user: data.user,
            stores: data.user.stores,
            activeStore: data.user.stores[0] ?? null,
            isLoading: false,
          });
        } catch (error) {
          get().logout();
          set({ error: getErrorMessage(error), isLoading: false });
        }
      },
      createStore: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await storeApi.create(payload);
          const stores = [data.store, ...get().stores.filter((store) => store.id !== data.store.id)];
          const currentUser = get().user;
          set({
            stores,
            activeStore: data.store,
            user: currentUser ? { ...currentUser, stores } : null,
            isLoading: false,
          });
          return data.store;
        } catch (error) {
          set({ error: getErrorMessage(error), isLoading: false });
          throw error;
        }
      },
      clearError: () => set({ error: null }),
      logout: () => {
        localStorage.removeItem('token');
        set({
          token: null,
          user: null,
          stores: [],
          activeStore: null,
          error: null,
          isLoading: false,
        });
      },
    }),
    {
      name: 'stockflow-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        stores: state.stores,
        activeStore: state.activeStore,
      }),
    }
  )
);
