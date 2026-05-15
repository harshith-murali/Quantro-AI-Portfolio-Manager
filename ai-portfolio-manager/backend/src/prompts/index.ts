import { FinancialProfile, Holding, Trade } from '@prisma/client';

const SYSTEM_PROMPT = `You are a SEBI-compliant AI investment advisor. You provide data-driven, unbiased stock insights. Always add a disclaimer that this is not financial advice. Keep your responses concise, beginner-friendly, and actionable. Never hallucinate stock prices — only use data passed in context.`;

export function buildPortfolioSummaryPrompt(
  profile: FinancialProfile | null,
  holdings: Holding[],
  trades: Trade[],
  summaryStats: any
): string {
  const context = `
User Profile:
- Risk Appetite: ${profile?.riskAppetite || 'Unknown'}
- Financial Goal: ${profile?.financialGoal || 'Unknown'}
- Investable Amount: ${profile?.investableAmount || 0}

Portfolio Summary:
- Total Invested: ${summaryStats.totalInvested}
- Current Value: ${summaryStats.currentValue}
- Unrealized P&L: ${summaryStats.unrealizedPnl}
- Realized P&L: ${summaryStats.realizedPnl}
- Total P&L: ${summaryStats.totalPnl}

Current Holdings:
${holdings.map(h => `- ${h.symbol}: ${h.quantity} shares @ ₹${h.averageBuyPrice}`).join('\n')}

Recent Trades (Last 5):
${trades.slice(0, 5).map(t => `- ${t.type} ${t.quantity} ${t.symbol} @ ₹${t.price}`).join('\n')}
`;

  return `${SYSTEM_PROMPT}\n\nBased on the following user context, provide a brief, actionable overall health summary of their portfolio.\n\nContext:\n${context}`;
}

export function buildStockAdvicePrompt(
  symbol: string,
  profile: FinancialProfile | null,
  holdings: Holding[],
  signals: any
): string {
  const holding = holdings.find(h => h.symbol === symbol);
  const holdingContext = holding
    ? `User currently holds ${holding.quantity} shares of ${symbol} at an average price of ₹${holding.averageBuyPrice}.`
    : `User does not currently hold any shares of ${symbol}.`;

  const context = `
User Profile:
- Risk Appetite: ${profile?.riskAppetite || 'Unknown'}

Holding Status:
${holdingContext}

Signal Data for ${symbol} (Mocked):
- RSI (14): ${signals.rsi}
- MACD: ${signals.macd}
- SMA (50): ${signals.sma50}
`;

  return `${SYSTEM_PROMPT}\n\nBased on the following user context and technical signals, provide a brief, actionable insight for the stock ${symbol}.\n\nContext:\n${context}`;
}

export function buildRiskAnalysisPrompt(
  profile: FinancialProfile | null,
  holdings: Holding[]
): string {
  const context = `
User Profile:
- Risk Appetite: ${profile?.riskAppetite || 'Unknown'}
- Financial Goal: ${profile?.financialGoal || 'Unknown'}

Current Holdings:
${holdings.map(h => `- ${h.symbol}: ${h.quantity} shares`).join('\n')}
`;

  return `${SYSTEM_PROMPT}\n\nBased on the following user context, analyze the risk of their current portfolio alignment against their stated risk appetite. Provide a brief, actionable summary.\n\nContext:\n${context}`;
}

export function buildGeneralQAPrompt(
  question: string,
  profile: FinancialProfile | null,
  holdings: Holding[]
): string {
  const context = `
User Profile:
- Risk Appetite: ${profile?.riskAppetite || 'Unknown'}

Current Holdings:
${holdings.map(h => `- ${h.symbol}: ${h.quantity} shares`).join('\n')}

User Question:
${question}
`;

  return `${SYSTEM_PROMPT}\n\nBased on the user's profile and holdings, answer their question concisely and directly.\n\nContext:\n${context}`;
}

export function buildRecommendationPrompt(
  profile: FinancialProfile | null,
  holdings: Holding[],
  walletBalance: number,
  niftyList: any[]
): string {
  const context = `
User Profile:
- Risk Appetite: ${profile?.riskAppetite || 'Unknown'}
- Wallet Balance: ₹${walletBalance}

Current Holdings:
${holdings.map(h => `- ${h.symbol}: ${h.quantity} shares`).join('\n')}

Market Options (NIFTY 50 Sample):
${niftyList.map(s => `- ${s.symbol}: ₹${s.price}`).join('\n')}
`;

  return `${SYSTEM_PROMPT}\n\nBased on the following user context and available market options, recommend exactly 3 to 5 stocks for the user to buy. Output ONLY valid JSON in the following format, with no markdown formatting or extra text:
[
  {
    "symbol": "TCS",
    "sector": "IT",
    "price": 3920.00,
    "qty": 5,
    "conviction": "HIGH",
    "rationale": "Strong balance sheet and aligned with moderate risk.",
    "tag": "Value"
  }
]

Context:\n${context}`;
}
