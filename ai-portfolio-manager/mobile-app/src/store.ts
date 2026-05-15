import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  riskAppetite?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  investmentGoal?: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
}

interface AppState {
  accessToken: string | null;
  user: UserProfile | null;
  portfolio: any | null;
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setPortfolio: (portfolio: any | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  accessToken: null,
  user: null,
  portfolio: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  setPortfolio: (portfolio) => set({ portfolio }),
  logout: () => set({ accessToken: null, user: null, portfolio: null }),
}));
