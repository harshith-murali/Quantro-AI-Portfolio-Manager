import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PortfolioSnapshot } from "./types";

export type InvestmentGoal = "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM";
export type RiskAppetite   = "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  monthlyIncome?: number;
  fixedExpenses?: number;
  discretionaryExpenses?: number;
  totalSavings?: number;
  investmentGoal?: InvestmentGoal;
  riskAppetite?: RiskAppetite;
}

// Re-export the canonical PortfolioSnapshot from types.ts
export type { PortfolioSnapshot } from "./types";
export type { Holding } from "./types";

interface AppState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  portfolio: PortfolioSnapshot | null;

  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setProfile: (user: UserProfile | null) => void;
  setPortfolio: (portfolio: PortfolioSnapshot | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      portfolio: null,

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      setProfile: (user) => set({ user }),
      setPortfolio: (portfolio) => set({ portfolio }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null, portfolio: null }),
    }),
    {
      name: "fintech-store",
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }),
    }
  )
);
