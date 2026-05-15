// In the browser, use a relative /api path so requests go through the
// Next.js rewrite proxy → Express backend (no CORS, no port-3001 exposure).
// In server-side context (SSR / Route Handlers), hit the backend directly.
const BASE_URL =
  typeof window !== "undefined"
    ? "/api"
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api");

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
      fetchAPI<{ user: any; accessToken: string }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      fetchAPI<{ user: any; accessToken: string }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

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

    buy: (body: { symbol: string; quantity: number; price?: number }, token: string) =>
      fetchAPI<any>("/trade/buy", { method: "POST", body: JSON.stringify(body) }, token),

    sell: (body: { symbol: string; quantity: number; price?: number }, token: string) =>
      fetchAPI<any>("/trade/sell", { method: "POST", body: JSON.stringify(body) }, token),

    // Unified helper — routes to /trade/buy or /trade/sell based on action or type
    // price is required by the backend Zod schema — caller should pass averageBuyPrice; fallback = 1
    trade: (body: { symbol: string; action?: "BUY" | "SELL" | null; quantity: number; price?: number; type?: string }, token: string) => {
      const action = body.action ?? body.type;
      const endpoint = action === "BUY" ? "/trade/buy" : "/trade/sell";
      const price = body.price && body.price > 0 ? body.price : 1; // price required by schema
      return fetchAPI<any>(endpoint, { method: "POST", body: JSON.stringify({ symbol: body.symbol, quantity: body.quantity, price }) }, token);
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
  // Signal metadata is still mock-served; OHLCV data comes from the
  // backend /ohlcv route which reads pre-loaded CSVs from AWS S3.
  signals: {
    list: async (_token: string): Promise<any[]> => MOCK_SIGNALS,
    get:  async (symbol: string, _token: string): Promise<any> =>
      MOCK_SIGNALS.find((s) => s.symbol === symbol) ?? null,

    /**
     * Fetch real OHLCV data from the backend (AWS S3 via /api/ohlcv).
     * Symbols on the frontend use short names (RELIANCE); the backend
     * expects the NSE-suffixed key (RELIANCE_NS).
     */
    ohlcv: async (symbol: string, _token: string, limit = 100): Promise<any[]> => {
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

  // ─── Backtest (no backend route — returns mock result) ───────────
  backtest: {
    run: async (_body: any, _token: string): Promise<any> => ({
      totalReturnPct: 15.4, annualisedReturnPct: 22.1, maxDrawdownPct: 5.2,
      winRatePct: 62.5, totalTrades: 14, sharpeRatio: 1.82, buyAndHoldReturnPct: 8.3,
      sampleTrades: [
        { date: "Jan 08", action: "BUY",  price: 2450, qty: 10, pnl: null },
        { date: "Jan 22", action: "SELL", price: 2620, qty: 10, pnl: "+₹1,700" },
        { date: "Feb 03", action: "BUY",  price: 2580, qty: 8,  pnl: null },
        { date: "Feb 18", action: "SELL", price: 2710, qty: 8,  pnl: "+₹1,040" },
      ],
    }),
    history: async (_token: string): Promise<any[]> => [],
    get: async (_id: string, _token: string): Promise<any> => null,
  },
};

// ─── Shared mock signal data ─────────────────────────────────────
export const MOCK_SIGNALS = [
  { symbol: "RELIANCE", signal: "BUY",  suitabilityScore: 92, suggestedAllocation: 50000, rsi: 28.5, macd: -1.2, currentPrice: 2845.50, changePercent: -1.4, rationale: "RSI oversold at major support. High conviction reversal setup." },
  { symbol: "ZOMATO",   signal: "BUY",  suitabilityScore: 85, suggestedAllocation: 25000, rsi: 35.2, macd: 0.8,  currentPrice: 154.20,  changePercent: 3.2,  rationale: "Breaking out of consolidation with volume expansion." },
  { symbol: "TCS",      signal: "HOLD", suitabilityScore: 78, suggestedAllocation: 0,     rsi: 55.4, macd: 2.1,  currentPrice: 3920.00, changePercent: 0.5,  rationale: "Range-bound. Await clear breakout above 4000." },
  { symbol: "HDFCBANK", signal: "SELL", suitabilityScore: 45, suggestedAllocation: 0,     rsi: 74.5, macd: 5.4,  currentPrice: 1680.75, changePercent: 1.8,  rationale: "Overbought on RSI, momentum slowing near resistance." },
  { symbol: "INFY",     signal: "BUY",  suitabilityScore: 88, suggestedAllocation: 40000, rsi: 32.1, macd: -0.5, currentPrice: 1425.30, changePercent: -2.1, rationale: "Mean reversion at 200 DMA with RSI oversold signal." },
  { symbol: "WIPRO",    signal: "BUY",  suitabilityScore: 81, suggestedAllocation: 20000, rsi: 31.0, macd: -0.3, currentPrice: 468.50,  changePercent: -1.8, rationale: "Accumulation zone with improving MACD divergence." },
  { symbol: "SUNPHARMA",signal: "HOLD", suitabilityScore: 72, suggestedAllocation: 0,     rsi: 52.0, macd: 1.2,  currentPrice: 1598.00, changePercent: 0.3,  rationale: "Neutral technicals — watch for sector rotation cue." },
  { symbol: "SBIN",     signal: "BUY",  suitabilityScore: 79, suggestedAllocation: 30000, rsi: 36.5, macd: 0.5,  currentPrice: 812.40,  changePercent: 0.9,  rationale: "Public sector banking showing relative strength." },
];