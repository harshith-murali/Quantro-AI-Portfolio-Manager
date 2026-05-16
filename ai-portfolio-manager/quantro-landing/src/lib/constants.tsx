export const FEATURES = [
  {
    id: 1, title: "Financial Profiling", icon: "profile", tag: "FOUNDATION",
    description: "Input income, expenses, and risk appetite. We compute your investable capacity and assign a personalised risk score.",
  },
  {
    id: 2, title: "AI Signal Engine", icon: "signal", tag: "INTELLIGENCE",
    description: "RSI, MACD, SMA, and Bollinger Bands converge into a composite BUY/SELL/HOLD signal — scored for your exact risk profile.",
  },
  {
    id: 3, title: "Virtual Portfolio", icon: "portfolio", tag: "SIMULATION",
    description: "Place virtual trades on 36 NSE stocks. Your P&L updates live via WebSockets — no real money, full mechanics.",
  },
  {
    id: 4, title: "Real-Time P&L", icon: "realtime", tag: "LIVE",
    description: "Socket.IO pushes portfolio updates every second. Watch holdings move in real time — no live feed required.",
  },
  {
    id: 5, title: "Backtesting Engine", icon: "backtest", tag: "WOW",
    description: "Run any strategy across 3 years of historical OHLCV data. Get Sharpe ratio, max drawdown, win rate, and equity curve.",
  },
  {
    id: 6, title: "Claude AI Rationale", icon: "ai", tag: "AI",
    description: "Every recommendation includes a plain-English explanation from Claude — why this stock, why now, what risks to watch.",
  },
];

export const STATS = [
  { value: "36", label: "NSE Stocks" },
  { value: "3yr", label: "Historical Data" },
  { value: "<2s", label: "P&L Latency" },
  { value: "4×", label: "Signal Indicators" },
];

export const NSE_SYMBOLS = [
  "RELIANCE","TCS","INFY","HDFCBANK","ICICIBANK","HDFC","KOTAKBANK","LT",
  "HINDUNILVR","BAJFINANCE","SBIN","BHARTIARTL","ASIANPAINT","MARUTI","TITAN",
  "AXISBANK","SUNPHARMA","NESTLEIND","WIPRO","ULTRACEMCO","TECHM","POWERGRID",
  "NTPC","JSWSTEEL","TATASTEEL","M&M","HCLTECH","DIVISLAB","DRREDDY","CIPLA",
  "NIFTYBEES","BANKBEES","GOLDBEES","LIQUIDBEES","JUNIORBEES","ITBEES",
];

// Fallback for legacy components
export const features: { title: string; description: string; icon: string }[] = FEATURES.map(f => ({
  title: f.title,
  description: f.description,
  icon: f.icon === 'profile' ? '◌' : f.icon === 'signal' ? '△' : f.icon === 'portfolio' ? '◇' : f.icon === 'realtime' ? '□' : f.icon === 'backtest' ? '✦' : '✧'
}));