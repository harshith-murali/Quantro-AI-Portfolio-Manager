import { Prisma, InsightType } from '@prisma/client';
import prisma from '@/config/db';
import redis from '@/config/redis';
import { AppError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import { generateAIResponse } from '@/services/ai.service';
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
  { symbol: "LARSEN", price: 3510.60 },
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
  cacheKeySuffix: string
): Promise<string> {
  const cacheKey = `insight:${insightType}:${userId}:${cacheKeySuffix}`;

  // 1. Check Cache
  try {
    const cachedResponse = await redis.get(cacheKey);
    if (cachedResponse) {
      logger.info(`Cache hit for insight ${insightType} for user ${userId}`);
      return cachedResponse;
    }
  } catch (err) {
    logger.warn('Redis cache get failed, bypassing cache.');
  }

  // 2. Check Rate Limit (only count if we actually call the API)
  await checkRateLimit(userId);

  // 3. Call Claude API
  logger.info(`Calling Claude API for insight ${insightType} for user ${userId}`);
  const response = await generateAIResponse(prompt);

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
  
  // Mocking signal data for now
  const signals = {
    rsi: Math.floor(Math.random() * 100),
    macd: (Math.random() * 4 - 2).toFixed(2),
    sma50: (Math.random() * 100 + 100).toFixed(2),
  };

  const prompt = buildStockAdvicePrompt(symbol.toUpperCase(), profile, holdings, signals);
  
  return processInsight(userId, 'STOCK_ADVICE', prompt, `stock:${symbol.toUpperCase()}`);
}

export async function getRiskAnalysis(userId: string): Promise<string> {
  const { profile, holdings } = await getUserContext(userId);
  const prompt = buildRiskAnalysisPrompt(profile, holdings);
  
  return processInsight(userId, 'RISK_ANALYSIS', prompt, 'risk');
}

export async function askGeneralQA(userId: string, question: string): Promise<string> {
  const { profile, holdings } = await getUserContext(userId);
  const prompt = buildGeneralQAPrompt(question, profile, holdings);
  
  // Use the full base64 to ensure uniqueness, or a proper crypto hash. Since max length is 500 chars, 
  // base64 is at most ~670 chars which is fine for a Redis key.
  const questionHash = Buffer.from(question).toString('base64');
  
  return processInsight(userId, 'GENERAL_QA', prompt, `qa:${questionHash}`);
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

  const prompt = buildRecommendationPrompt(profile, holdings, walletBalance, NIFTY50_LIST);

  const response = await processInsight(userId, 'STOCK_RECOMMENDATION', prompt, `recs:bal${Math.floor(walletBalance)}`);
  
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;
    return JSON.parse(jsonStr);
  } catch (e) {
    logger.error('Failed to parse Claude recommendation JSON', { response });
    throw new AppError('AI returned an invalid format. Please try again.', 500);
  }
}

