import { create } from 'zustand';
import { apiRequest } from '../utils/api';
import { User, AuthResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGithub: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'u-demo',
    name: 'Raju Developer',
    email: 'raju@gmail.com',
    avatar: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  token: localStorage.getItem('collab_token') || 'demo-token',
  isAuthenticated: true,
  isLoading: false,

  initAuth: async () => {
    let token = localStorage.getItem('collab_token');
    if (!token) {
      token = 'demo-token';
      localStorage.setItem('collab_token', token);
    }

    try {
      const user = await apiRequest<User>('/auth/me');
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const fallbackUser: User = {
        id: 'u-demo',
        name: 'Raju Developer',
        email: 'raju@gmail.com',
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set({ user: fallbackUser, token, isAuthenticated: true, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const res = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('collab_token', res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true });
  },

  loginWithGithub: async () => {
    const res = await apiRequest<AuthResponse>('/auth/github', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    localStorage.setItem('collab_token', res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true });
  },

  register: async (name: string, email: string, password: string) => {
    const res = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    localStorage.setItem('collab_token', res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('collab_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
