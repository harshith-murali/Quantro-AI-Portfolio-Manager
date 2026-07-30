import { useStore } from "./store";

const DEFAULT_API_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8080/api"
    : "https://quantro-api-biwp.onrender.com/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

async function fetchAPI<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: "include" });
  } catch {
    throw new Error("Cannot reach the server. Please make sure the backend is running.");
  }

  // Intercept 401 Unauthorized errors (e.g., token expired) and attempt a silent token refresh
  if (res.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
    const state = useStore.getState();
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        const newData = refreshJson.data ?? refreshJson;
        if (newData.accessToken) {
          state.setAccessToken(newData.accessToken);
          const newHeaders: HeadersInit = {
            ...headers,
            Authorization: `Bearer ${newData.accessToken}`,
          };
          res = await fetch(`${BASE_URL}${path}`, { ...options, headers: newHeaders, credentials: "include" });
        }
      } else {
        state.logout();
      }
    } catch {
      state.logout();
    }
  }

  const json = await res.json().catch(() => ({ message: res.statusText }));
  if (!res.ok) {
    // Zod validation errors come back as { message: "Validation failed", errors: { field: ["msg"] } }
    if (json.errors && typeof json.errors === "object") {
      const firstField = Object.keys(json.errors)[0];
      const msgs = json.errors[firstField];
      const firstMsg: string = Array.isArray(msgs) ? msgs[0] : String(msgs);
      throw new Error(firstMsg ?? json.message ?? "Validation failed");
    }
    throw new Error(json.message ?? "API error");
  }
  // Backend wraps every success as { success, message, data }
  return (json.data ?? json) as T;
}

// ─── Auth ─────────────────────────────────────────────────────────
// Backend: POST /auth/register → { user, accessToken }
// Backend: POST /auth/login    → { user, accessToken }
// Backend: GET  /auth/me       → { user }
// Backend: POST /auth/refresh  → { accessToken } (reads HttpOnly cookie)
// Backend: POST /auth/logout   → null
export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      fetchAPI<{ user: any; accessToken: string; emailVerificationRequired?: boolean }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      fetchAPI<{ user: any; accessToken: string }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

    verifyEmail: (body: { email: string; otp: string }) =>
      fetchAPI<{ verified: boolean }>("/auth/verify-email", { method: "POST", body: JSON.stringify(body) }),

    resendVerification: (body: { email: string }) =>
      fetchAPI<{ sent: boolean }>("/auth/resend-verification", { method: "POST", body: JSON.stringify(body) }),

    me: (token: string) =>
      fetchAPI<{ user: any }>("/auth/me", {}, token),

    refresh: () =>
      fetchAPI<{ accessToken: string }>("/auth/refresh", { method: "POST" }),

    logout: (token: string) =>
      fetchAPI<void>("/auth/logout", { method: "POST" }, token),
  },

  // ─── Financial Profile ──────────────────────────────────────────
  // Backend: POST /financial-profile      → create profile
  // Backend: GET  /financial-profile/me   → get profile
  // Backend: PUT  /financial-profile/me   → update profile
  profile: {
    get: (token: string) =>
      fetchAPI<any>("/financial-profile/me", {}, token),

    create: (body: any, token: string) =>
      fetchAPI<any>("/financial-profile", { method: "POST", body: JSON.stringify(body) }, token),

    update: (body: any, token: string) =>
      fetchAPI<any>("/financial-profile/me", { method: "PUT", body: JSON.stringify(body) }, token),
  },

  // ─── Portfolio & Holdings ────────────────────────────────────────
  // Backend: GET  /portfolio/summary  → { summary: { totalValue, invested, pnl, ... } }
  // Backend: GET  /portfolio/history  → { history: [...] }
  // Backend: GET  /holdings           → { holdings: [...] }
  // Backend: GET  /holdings/:symbol   → { holding: {...} }
  // Backend: POST /trade/buy          → { trade }
  // Backend: POST /trade/sell         → { trade }
  // Backend: GET  /trade/history      → paginated trades
  portfolio: {
    summary: (token: string) =>
      fetchAPI<any>("/portfolio/summary", {}, token),

    history: (token: string, days = 30) =>
      fetchAPI<any>("/portfolio/history?days=" + days, {}, token),

    holdings: (token: string) =>
      fetchAPI<any>("/holdings", {}, token),

    holding: (symbol: string, token: string) =>
      fetchAPI<any>(`/holdings/${symbol}`, {}, token),

    buy: (body: { symbol: string; quantity: number }, token: string) =>
      fetchAPI<any>("/trade/buy", { method: "POST", body: JSON.stringify(body) }, token),

    sell: (body: { symbol: string; quantity: number }, token: string) =>
      fetchAPI<any>("/trade/sell", { method: "POST", body: JSON.stringify(body) }, token),

    // Unified helper — routes to /trade/buy or /trade/sell based on action or type.
    // Execution price is resolved by the backend from market data.
    trade: (body: { symbol: string; action?: "BUY" | "SELL" | null; quantity: number; type?: string; price?: number }, token: string) => {
      const action = body.action ?? body.type;
      const endpoint = action === "BUY" ? "/trade/buy" : "/trade/sell";
      return fetchAPI<any>(endpoint, { method: "POST", body: JSON.stringify({ symbol: body.symbol, quantity: body.quantity }) }, token);
    },

    tradeHistory: (token: string, limit = 50, offset = 0) =>
      fetchAPI<any>(`/trade/history?limit=${limit}&offset=${offset}`, {}, token)
        .then((d: any) => d.trades ?? d),
  },

  // ─── Dashboard / Analytics ──────────────────────────────────────
  // Backend: GET /dashboard/summary
  // Backend: GET /dashboard/portfolio-growth
  // Backend: GET /dashboard/sector-allocation
  // Backend: GET /dashboard/top-movers
  // Backend: GET /dashboard/recent-activity
  // Backend: GET /dashboard/holdings-table
  dashboard: {
    summary: (token: string) =>
      fetchAPI<any>("/dashboard/summary", {}, token),

    portfolioGrowth: (token: string) =>
      fetchAPI<any>("/dashboard/portfolio-growth", {}, token),

    sectorAllocation: (token: string) =>
      fetchAPI<any>("/dashboard/sector-allocation", {}, token),

    topMovers: (token: string) =>
      fetchAPI<any>("/dashboard/top-movers", {}, token),

    recentActivity: (token: string) =>
      fetchAPI<any>("/dashboard/recent-activity", {}, token),

    holdingsTable: (token: string) =>
      fetchAPI<any>("/dashboard/holdings-table", {}, token),
  },

  market: {
    nifty: () => fetchAPI<any>("/market/nifty"),
  },

  // ─── Wallet & Transactions ──────────────────────────────────────
  wallet: {
    balance: (token: string) =>
      fetchAPI<{ balance: number }>("/wallet/balance", {}, token),

    deposit: (body: { amount: number }, token: string) =>
      fetchAPI<any>("/wallet/deposit", { method: "POST", body: JSON.stringify(body) }, token),

    withdraw: (body: { amount: number }, token: string) =>
      fetchAPI<any>("/wallet/withdraw", { method: "POST", body: JSON.stringify(body) }, token),
  },

  transactions: {
    list: (token: string) =>
      fetchAPI<any[]>("/transactions", {}, token),

    summary: (token: string) =>
      fetchAPI<any>("/transactions/summary", {}, token),

    get: (id: string, token: string) =>
      fetchAPI<any>(`/transactions/${id}`, {}, token),
  },

  watchlist: {
    list: (token: string) =>
      fetchAPI<any>("/watchlist", {}, token),
    add: (symbol: string, token: string) =>
      fetchAPI<any>("/watchlist", { method: "POST", body: JSON.stringify({ symbol }) }, token),
    remove: (symbol: string, token: string) =>
      fetchAPI<void>(`/watchlist/${encodeURIComponent(symbol)}`, { method: "DELETE" }, token),
  },

  // ─── AI Insights ────────────────────────────────────────────────
  // Backend: POST /insights/portfolio-summary
  // Backend: POST /insights/stock/:symbol
  // Backend: POST /insights/risk-analysis
  // Backend: POST /insights/ask
  // Backend: GET  /insights/history
  insights: {
    portfolioSummary: (token: string) =>
      fetchAPI<{ response: string }>("/insights/portfolio-summary", { method: "POST", body: JSON.stringify({}) }, token),

    stock: (symbol: string, token: string) =>
      fetchAPI<{ response: string }>(`/insights/stock/${symbol}`, { method: "POST", body: JSON.stringify({}) }, token),

    riskAnalysis: (token: string) =>
      fetchAPI<{ response: string }>("/insights/risk-analysis", { method: "POST", body: JSON.stringify({}) }, token),

    ask: (question: string, token: string) =>
      fetchAPI<{ response: string }>("/insights/ask", { method: "POST", body: JSON.stringify({ question }) }, token),

    recommendations: (token: string) =>
      fetchAPI<{ recommendations: any[] }>("/insights/recommendations", { method: "POST", body: JSON.stringify({}) }, token),

    history: (token: string) =>
      fetchAPI<any[]>("/insights/history", {}, token),
  },

  // ─── Signals ──────────────────────────────────────────────────────
  signals: {
    list: async (token: string): Promise<any[]> =>
      fetchAPI<any>("/signals", {}, token).then((d: any) => d.signals ?? []),
    get:  async (symbol: string, token: string): Promise<any> =>
      fetchAPI<any>(`/signals/${symbol}`, {}, token).then((d: any) => d.signal ?? null),

    /**
     * Fetch real OHLCV data from the backend (AWS S3 via /api/ohlcv).
     * Symbols on the frontend use short names (RELIANCE); the backend
     * expects the NSE-suffixed key (RELIANCE_NS).
     */
    ohlcv: async (symbol: string, _token: string, limit = 1500): Promise<any[]> => {
      // Map frontend symbol → S3 key suffix
      const SYMBOL_MAP: Record<string, string> = {
        RELIANCE: "RELIANCE_NS",
        INFY:     "INFY_NS",
        TCS:      "TCS_NS",
      };
      const s3Symbol = SYMBOL_MAP[symbol.toUpperCase()] ?? `${symbol.toUpperCase()}_NS`;

      try {
        const res = await fetch(
          `${BASE_URL}/ohlcv?symbol=${encodeURIComponent(s3Symbol)}&limit=${limit}`
        );
        const json = await res.json();
        if (!res.ok || !json.success) return [];

        // Transform to chart-friendly format { time, open, high, low, close, volume }
        return (json.data ?? []).map((d: any) => ({
          time:   d.date, // YYYY-MM-DD from S3 CSV
          open:   d.open,
          high:   d.high,
          low:    d.low,
          close:  d.close ?? d.adjClose,
          volume: d.volume,
        }));
      } catch {
        // Graceful fallback — return empty so the page generates mock data
        return [];
      }
    },
  },
  // ─── Backtest ───────────
  backtest: {
    run: async (body: any, token: string): Promise<any> => {
      // Map frontend symbol -> backend S3 suffix
      const SYMBOL_MAP: Record<string, string> = {
        RELIANCE: "RELIANCE_NS",
        INFY:     "INFY_NS",
        TCS:      "TCS_NS",
      };
      const s3Symbol = SYMBOL_MAP[body.symbol.toUpperCase()] ?? `${body.symbol.toUpperCase()}_NS`;

      const params = new URLSearchParams({
        symbol: s3Symbol,
        shortWindow: body.shortWindow?.toString() ?? "20",
        longWindow: body.longWindow?.toString() ?? "50",
        initialCapital: body.initialCapital?.toString() ?? "100000",
        startDate: body.dateFrom,
        endDate: body.dateTo,
      });
      return fetchAPI<any>(`/backtest?${params.toString()}`, { method: "GET" }, token);
    },
    history: async (_token: string): Promise<any[]> => [],
    get: async (_id: string, _token: string): Promise<any> => null,
  },
};
