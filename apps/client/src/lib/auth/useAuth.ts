import { Effect } from "effect";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AuthError,
  AuthResponse,
  login,
  logout,
  register,
} from "./auth.service";

interface AuthState {
  user: AuthResponse["user"] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    fullName: string;
    email: string;
    password: string;
    type: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        const result = await Effect.runPromise(
          login({ email, password }),
        ).catch((error: AuthError) => {
          set({ error: error.message, isLoading: false });
          throw error;
        });

        set({
          user: result.user,
          token: result.token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      register: async (data) => {
        set({ isLoading: true, error: null });

        const result = await Effect.runPromise(register(data)).catch(
          (error: AuthError) => {
            set({ error: error.message, isLoading: false });
            throw error;
          },
        );

        set({
          user: result.user,
          token: result.token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        set({ isLoading: true, error: null });

        await Effect.runPromise(logout()).catch((error: AuthError) => {
          set({ error: error.message, isLoading: false });
          throw error;
        });

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
