"use client";

import { create } from "zustand";
import type { User, AuthState } from "@/types/user";
import { authApi } from "@/lib/api";

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (payload: import("@/types/user").RegisterPayload) => Promise<User>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { user, token } = await authApi.login({ email, password });
    // JWT tokens are already persisted by authApi.login
    set({ user, token, isAuthenticated: true, isLoading: false });
    return user;
  },

  register: async (payload) => {
    const { user, token } = await authApi.register(payload);
    set({ user, token, isAuthenticated: true, isLoading: false });
    return user;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    const onClientArea = window.location.pathname.startsWith("/client");
    window.location.href = onClientArea ? "/client/login" : "/login";
  },

  loadUser: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { user } = await authApi.me();
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// Helper to get display name
export function getUserDisplayName(user: User | null): string {
  if (!user) return "Guest";
  return `${user.firstName} ${user.lastName}`;
}

// Helper to check role access
export function hasRole(user: User | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
