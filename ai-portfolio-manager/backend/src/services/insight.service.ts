import { Prisma, InsightType } from '@prisma/client';
import prisma from '@/config/db';
import redis from '@/config/redis';
import { AppError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import { generateAIResponse, AIResponseOptions } from '@/services/ai.service';
import { parseRecommendations, recommendationOutputSchema } from '@/utils/recommendations';
import { getLatestMarketPrice } from '@/services/marketPrice.service';
import { getTechnicalSignal } from '@/services/technicalAnalysis.service';
import { normalizeSymbol } from '@/utils/symbol';
import { getSectorForSymbol } from '@/constants/sectors';
import { createHash } from 'node:crypto';
import { getPortfolioSummary as getStats } from '@/services/portfolio.service';
import {
  buildPortfolioSummaryPrompt,
  buildStockAdvicePrompt,
  buildRiskAnalysisPrompt,
  buildGeneralQAPrompt,
  buildRecommendationPrompt,
} from '@/prompts';

const RATE_LIMIT_MAX = 10;
const CACHE_TTL_SECONDS = 3600; // 1 hour

const NIFTY50_LIST = [
  { symbol: "RELIANCE", price: 2845.50 },
  { symbol: "TCS", price: 3920.00 },
  { symbol: "HDFCBANK", price: 1680.75 },
  { symbol: "INFY", price: 1425.30 },
  { symbol: "ICICIBANK", price: 1092.40 },
  { symbol: "HINDUNILVR", price: 2265.80 },
  { symbol: "ITC", price: 462.00 },
  { symbol: "SBIN", price: 812.40 },
  { symbol: "LT", price: 3510.60 },
  { symbol: "BAJFINANCE", price: 6845.20 }
];

/**
 * Ensures the user has not exceeded their AI call rate limit (10 per hour).
 */
async function checkRateLimit(userId: string): Promise<void> {
  try {
    const key = `rate_limit:insights:${userId}`;
    const currentCount = await redis.incr(key);

    if (currentCount === 1) {
      // If it's the first call, set the expiration to 1 hour
      await redis.expire(key, 3600);
    }

    if (currentCount > RATE_LIMIT_MAX) {
      throw new AppError('Rate limit exceeded. You can only make 10 AI insight requests per hour.', 429);
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    logger.warn('Redis unavailable for rate limiting, bypassing.');
  }
}

/**
 * Helper to fetch common user context from the database.
 */
async function getUserContext(userId: string) {
  const [profile, holdings, trades, summaryStats] = await Promise.all([
    prisma.financialProfile.findUnique({ where: { userId } }),
    prisma.holding.findMany({ where: { userId } }),
    prisma.trade.findMany({
      where: { userId },
      orderBy: { tradeDate: 'desc' },
      take: 5,
    }),
    getStats(userId),
  ]);

  return { profile, holdings, trades, summaryStats };
}

/**
 * Core function to handle caching, calling the AI, and logging to DB.
 */
async function processInsight(
  userId: string,
  insightType: InsightType,
  prompt: string,
  cacheKeySuffix: string,
  options: AIResponseOptions = {}
): Promise<string> {
  const cacheKey = `insight:${insightType}:${userId}:${cacheKeySuffix}`;

  // 1. Check Cache
  try {
    const cachedResponse = await redis.get(cacheKey);
    if (cachedResponse) {
      logger.info(`Cache hit for insight ${insightType} for user ${userId}`);
      try {
        return options.validate ? options.validate(cachedResponse) : cachedResponse;
      } catch {
        // Discard legacy prose or malformed output instead of replaying it for an hour.
        await redis.del(cacheKey);
      }
    }
  } catch (err) {
    logger.warn('Redis cache get failed, bypassing cache.');
  }

  // 2. Check Rate Limit (only count if we actually call the API)
  await checkRateLimit(userId);

  // 3. Generate and validate before logging or caching
  logger.info(`Calling AI provider for insight ${insightType} for user ${userId}`);
  const response = await generateAIResponse(prompt, options);

  // 4. Log to Database
  await prisma.insightLog.create({
    data: {
      userId,
      insightType,
      prompt,
      response,
    },
  });

  // 5. Cache the Response
  try {
    await redis.set(cacheKey, response, 'EX', CACHE_TTL_SECONDS);
  } catch (err) {
    logger.warn('Redis cache set failed.');
  }

  return response;
}

// ─── Insight Methods ────────────────────────────────────────────────────────

export async function getPortfolioSummary(userId: string): Promise<string> {
  const { profile, holdings, trades, summaryStats } = await getUserContext(userId);
  const prompt = buildPortfolioSummaryPrompt(profile, holdings, trades, summaryStats);
  
  return processInsight(userId, 'PORTFOLIO_SUMMARY', prompt, 'summary');
}

export async function getStockAdvice(userId: string, symbol: string): Promise<string> {
  const { profile, holdings } = await getUserContext(userId);
  
  const observed = await getTechnicalSignal(symbol);
  const signals = { rsi: observed.rsi, macd: observed.macd, sma50: observed.sma50, marketDate: observed.marketDate, source: observed.dataSource };

  const prompt = buildStockAdvicePrompt(symbol.toUpperCase(), profile, holdings, signals);
  
  return processInsight(userId, 'STOCK_ADVICE', prompt, `stock:${symbol.toUpperCase()}`);
}

export async function getRiskAnalysis(userId: string): Promise<string> {
  const { profile, holdings } = await getUserContext(userId);
  const prompt = buildRiskAnalysisPrompt(profile, holdings);
  
  return processInsight(userId, 'RISK_ANALYSIS', prompt, 'risk');
}

export async function askGeneralQA(userId: string, question: string) {
  const { profile, holdings } = await getUserContext(userId);
  const evidence = await Promise.all(holdings.slice(0, 8).map(async holding => {
    try { const q = await getLatestMarketPrice(holding.symbol); return { symbol: q.symbol, price: q.price, date: q.marketDate, source: q.source, quantity: holding.quantity, marketValue: Number((holding.quantity * q.price).toFixed(2)) }; }
    catch { return { symbol: holding.symbol, status: 'Price unavailable; do not invent a value' }; }
  }));
  const prompt = buildGeneralQAPrompt(question, profile, holdings) + '\nValidated evidence: ' + JSON.stringify(evidence) + '\nCite the symbol, observed date and source for factual market claims. Distinguish supplied facts from interpretation. Do not invent news, prices or certainty. Explain downside and a reasonable alternative.';
  
  // Use the full base64 to ensure uniqueness, or a proper crypto hash. Since max length is 500 chars, 
  // base64 is at most ~670 chars which is fine for a Redis key.
  const questionHash = Buffer.from(question).toString('base64');
  
  const evidenceKey=createHash('sha256').update(JSON.stringify(evidence)).digest('hex').slice(0,16);
  return { insight: await processInsight(userId, 'GENERAL_QA', prompt, `qa:${questionHash}:${evidenceKey}`), evidence };
}

// ─── History ────────────────────────────────────────────────────────────────

export async function getInsightHistory(userId: string, limit = 20, offset = 0) {
  const [logs, total] = await Promise.all([
    prisma.insightLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        insightType: true,
        response: true,
        createdAt: true,
        // Exclude prompt to save bandwidth unless needed
      }
    }),
    prisma.insightLog.count({ where: { userId } })
  ]);

  return { logs, total, limit, offset };
}

export async function getRecommendations(userId: string) {
  const { profile, holdings } = await getUserContext(userId);
  
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const walletBalance = wallet ? Number(wallet.balance) : 0;

  const risk = profile?.riskAppetite || 'MEDIUM';
  const budget = Math.floor(walletBalance * (risk === 'HIGH' ? 0.5 : risk === 'LOW' ? 0.18 : 0.32));
  if (budget <= 0) return [];
  const held = new Set(holdings.map(h => h.symbol));
  const observed = await Promise.all(NIFTY50_LIST.filter(stock => !held.has(stock.symbol)).map(async stock => {
    try { return await getLatestMarketPrice(stock.symbol); } catch { return null; }
  }));
  const quotes = observed.filter((quote): quote is NonNullable<typeof quote> => quote !== null);
  const bySymbol = new Map(quotes.map(q => [q.symbol, q]));
  if (budget <= 0) return [];
  if (!quotes.length) throw new AppError('Observed stock prices are unavailable. Please retry; recommendations will not use invented prices.', 503);
  if (!quotes.some(q => q.price <= budget)) return [];
  const prompt = buildRecommendationPrompt(profile, holdings, budget, quotes) + '\nExplain the downside and alternatives in each rationale. Confidence is qualitative, not a probability or performance guarantee.';
  const contextKey = createHash('sha256').update(JSON.stringify({profile,holdings,budget,quotes})).digest('hex').slice(0,24);
  const normalize = (text: string) => {
    let remaining = budget;
    const seen = new Set<string>();
    return parseRecommendations(text).slice(0,5).flatMap(rec => {
      const symbol = normalizeSymbol(rec.symbol), quote = bySymbol.get(symbol);
      if (!quote || held.has(symbol) || seen.has(symbol)) return [];
      seen.add(symbol);
      const qty = Math.min(rec.qty, Math.floor(remaining / quote.price));
      if (qty < 1) return [];
      const totalCost = Number((qty * quote.price).toFixed(2)); remaining -= totalCost;
      return [{...rec,symbol,sector:getSectorForSymbol(symbol),qty,price:quote.price,totalCost,marketDate:quote.marketDate,source:quote.source,riskImpact:`Uses ${(totalCost / Math.max(walletBalance,1) * 100).toFixed(1)}% of available virtual cash.`,assumptions:`${risk} risk budget: ₹${budget}; latest observed regular-market price. Execution is repriced separately. No guaranteed returns.`}];
    });
  };
  const response = await processInsight(userId, 'STOCK_RECOMMENDATION', prompt, `recs:v2:${contextKey}`, {
    requireProvider: true, outputSchema: recommendationOutputSchema,
    validate: text => JSON.stringify(normalize(text)),
  });
  return normalize(response);
}
