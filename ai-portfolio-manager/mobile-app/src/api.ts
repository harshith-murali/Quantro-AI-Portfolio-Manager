// Use your machine's LAN IP so the physical device / Expo Go can reach the backend
const BASE_URL = 'http://192.168.0.4:3001/api';

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({ message: res.statusText }));
  if (!res.ok) throw new Error(json.message ?? 'API error');
  // Backend wraps every response as { success, message, data }
  return (json.data ?? json) as T;
}

export const api = {
  // ─── Auth ────────────────────────────────────────────────────────
  // POST /auth/register → { user, accessToken }
  // POST /auth/login    → { user, accessToken }
  // GET  /auth/me       → { user }
  // POST /auth/refresh  → { accessToken }
  // POST /auth/logout
  auth: {
    login: (body: { email: string; password: string }) =>
      request<{ user: any; accessToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    register: (body: { name: string; email: string; password: string }) =>
      request<{ user: any; accessToken: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    me: (token: string) =>
      request<{ user: any }>('/auth/me', {}, token),

    logout: (token: string) =>
      request<void>('/auth/logout', { method: 'POST' }, token),
  },

  // ─── Financial Profile ───────────────────────────────────────────
  // POST /financial-profile     → create
  // GET  /financial-profile/me  → get
  // PUT  /financial-profile/me  → update
  profile: {
    get: (token: string) =>
      request<any>('/financial-profile/me', {}, token),

    create: (body: any, token: string) =>
      request<any>('/financial-profile', { method: 'POST', body: JSON.stringify(body) }, token),

    update: (body: any, token: string) =>
      request<any>('/financial-profile/me', { method: 'PUT', body: JSON.stringify(body) }, token),

    // Convenience alias used by ProfileScreen
    save: (body: any, token: string) =>
      request<any>('/financial-profile', { method: 'POST', body: JSON.stringify(body) }, token),
  },

  // ─── Portfolio & Trading ─────────────────────────────────────────
  // GET  /portfolio/summary  → { summary }
  // GET  /portfolio/history  → { history }
  // GET  /holdings           → { holdings }
  // POST /trade/buy          → { trade }
  // POST /trade/sell         → { trade }
  // GET  /trade/history      → paginated trades
  portfolio: {
    summary: (token: string) =>
      request<any>('/portfolio/summary', {}, token),

    history: (token: string, days = 30) =>
      request<any>(`/portfolio/history?days=${days}`, {}, token),

    holdings: (token: string) =>
      request<any>('/holdings', {}, token),

    buy: (body: { symbol: string; quantity: number; price?: number }, token: string) =>
      request<any>('/trade/buy', { method: 'POST', body: JSON.stringify(body) }, token),

    sell: (body: { symbol: string; quantity: number; price?: number }, token: string) =>
      request<any>('/trade/sell', { method: 'POST', body: JSON.stringify(body) }, token),

    // Unified trade helper: routes to buy or sell based on `action`
    trade: (body: { symbol: string; action: 'BUY' | 'SELL' | null; quantity: number }, token: string) => {
      const endpoint = body.action === 'BUY' ? '/trade/buy' : '/trade/sell';
      return request<any>(endpoint, { method: 'POST', body: JSON.stringify({ symbol: body.symbol, quantity: body.quantity }) }, token);
    },

    tradeHistory: (token: string, limit = 50, offset = 0) =>
      request<any>(`/trade/history?limit=${limit}&offset=${offset}`, {}, token)
        .then((d: any) => d.trades ?? d),
  },

  // ─── Dashboard / Analytics ───────────────────────────────────────
  // GET /dashboard/summary
  // GET /dashboard/portfolio-growth
  // GET /dashboard/sector-allocation
  // GET /dashboard/top-movers
  // GET /dashboard/recent-activity
  // GET /dashboard/holdings-table
  dashboard: {
    summary: (token: string) =>
      request<any>('/dashboard/summary', {}, token),

    portfolioGrowth: (token: string) =>
      request<any>('/dashboard/portfolio-growth', {}, token),

    sectorAllocation: (token: string) =>
      request<any>('/dashboard/sector-allocation', {}, token),

    topMovers: (token: string) =>
      request<any>('/dashboard/top-movers', {}, token),

    recentActivity: (token: string) =>
      request<any>('/dashboard/recent-activity', {}, token),
  },

  // ─── Wallet ──────────────────────────────────────────────────────
  wallet: {
    balance: (token: string) =>
      request<{ balance: number }>('/wallet/balance', {}, token),

    deposit: (body: { amount: number }, token: string) =>
      request<any>('/wallet/deposit', { method: 'POST', body: JSON.stringify(body) }, token),

    withdraw: (body: { amount: number }, token: string) =>
      request<any>('/wallet/withdraw', { method: 'POST', body: JSON.stringify(body) }, token),
  },

  // ─── Transactions ─────────────────────────────────────────────────
  transactions: {
    list: (token: string) =>
      request<any[]>('/transactions', {}, token),

    summary: (token: string) =>
      request<any>('/transactions/summary', {}, token),
  },

  // ─── AI Insights ─────────────────────────────────────────────────
  // POST /insights/portfolio-summary
  // POST /insights/stock/:symbol
  // POST /insights/risk-analysis
  // POST /insights/ask
  // GET  /insights/history
  insights: {
    portfolioSummary: (token: string) =>
      request<{ response: string }>('/insights/portfolio-summary', { method: 'POST', body: JSON.stringify({}) }, token),

    stock: (symbol: string, token: string) =>
      request<{ response: string }>(`/insights/stock/${symbol}`, { method: 'POST', body: JSON.stringify({}) }, token),

    riskAnalysis: (token: string) =>
      request<{ response: string }>('/insights/risk-analysis', { method: 'POST', body: JSON.stringify({}) }, token),

    ask: (question: string, token: string) =>
      request<{ response: string }>('/insights/ask', { method: 'POST', body: JSON.stringify({ question }) }, token),

    history: (token: string) =>
      request<any[]>('/insights/history', {}, token),
  },

  // ─── Signals (mock — no backend route exists yet) ─────────────────
  signals: {
    list: async (_token: string) => MOCK_SIGNALS,
    get: async (symbol: string, _token: string) => MOCK_SIGNALS.find(s => s.symbol === symbol) ?? null,
    ohlcv: async (symbol: string, _token: string, limit = 100): Promise<any[]> => {
      const SYMBOL_MAP: Record<string, string> = {
        RELIANCE: "RELIANCE_NS",
        INFY:     "INFY_NS",
        TCS:      "TCS_NS",
      };
      const s3Symbol = SYMBOL_MAP[symbol.toUpperCase()] ?? `${symbol.toUpperCase()}_NS`;

      try {
        const res = await request<any>(`/ohlcv?symbol=${encodeURIComponent(s3Symbol)}&limit=${limit}`);
        // Return chart-friendly format
        return (res ?? []).map((d: any) => ({
          time:   d.date,
          open:   d.open,
          high:   d.high,
          low:    d.low,
          close:  d.close ?? d.adjClose,
          volume: d.volume,
        }));
      } catch {
        return [];
      }
    },
  },

  // ─── Backtest (mock — no backend route exists yet) ────────────────
  backtest: {
    run: async (_body: any, _token: string) => null,
  },
};

// ─── Mock fallback data ───────────────────────────────────────────
export const MOCK_SIGNALS = [
  { symbol: 'RELIANCE', signal: 'BUY',  suitabilityScore: 92, rsi: 28.5, macd: -1.2, currentPrice: 2845.50, changePercent: -1.4, suggestedAllocation: 28000, rationale: 'RSI oversold at major support. Strong institutional accumulation.' },
  { symbol: 'ZOMATO',   signal: 'BUY',  suitabilityScore: 85, rsi: 35.2, macd: 0.8,  currentPrice: 154.20,  changePercent: 3.2,  suggestedAllocation: 15000, rationale: 'Breaking out of consolidation with volume confirmation.' },
  { symbol: 'TCS',      signal: 'HOLD', suitabilityScore: 78, rsi: 55.4, macd: 2.1,  currentPrice: 3920.00, changePercent: 0.5,  suggestedAllocation: 39000, rationale: 'Range-bound. Await breakout above 4050 resistance.' },
  { symbol: 'HDFCBANK', signal: 'SELL', suitabilityScore: 45, rsi: 74.5, macd: 5.4,  currentPrice: 1680.75, changePercent: 1.8,  suggestedAllocation: 0,     rationale: 'Overbought on RSI. Momentum weakening near resistance.' },
  { symbol: 'INFY',     signal: 'BUY',  suitabilityScore: 88, rsi: 32.1, macd: -0.5, currentPrice: 1425.30, changePercent: -2.1, suggestedAllocation: 14000, rationale: 'Mean reversion play at 200 DMA with oversold RSI.' },
  { symbol: 'SBIN',     signal: 'BUY',  suitabilityScore: 79, rsi: 36.5, macd: 0.5,  currentPrice: 812.40,  changePercent: 0.9,  suggestedAllocation: 16000, rationale: 'PSU bank showing relative strength vs sector.' },
];
