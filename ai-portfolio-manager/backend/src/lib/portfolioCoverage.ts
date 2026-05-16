import { Holding } from '@prisma/client';
import { logger } from '../utils/logger';

export interface CoverageResult {
  isSufficient: boolean;
  coveragePercent: number;
  availableValue: number;
  totalValue: number;
  availableSymbols: string[];
  missingSymbols: string[];
}

/**
 * Calculates the value-weighted coverage of a user's portfolio.
 * Policy: If at least 80% of the total portfolio value is covered by available market data, it is considered sufficient.
 */
export function calculatePortfolioCoverage(
  holdings: Holding[],
  availablePrices: Record<string, number>
): CoverageResult {
  if (holdings.length === 0) {
    return {
      isSufficient: true,
      coveragePercent: 100,
      availableValue: 0,
      totalValue: 0,
      availableSymbols: [],
      missingSymbols: []
    };
  }

  let totalEstimatedValue = 0;
  let availableValue = 0;
  const availableSymbols: string[] = [];
  const missingSymbols: string[] = [];

  for (const holding of holdings) {
    // We use averageBuyPrice as a proxy for weight if current price is missing,
    // but the goal is to see how much of their REAL current value we can track.
    // However, if we don't have the current price, we can't know the REAL current value.
    // So we use (quantity * averageBuyPrice) as the denominator for the weighting.
    const investedWeight = Number(holding.quantity) * Number(holding.averageBuyPrice);
    totalEstimatedValue += investedWeight;

    if (availablePrices[holding.symbol] !== undefined) {
      availableValue += investedWeight;
      availableSymbols.push(holding.symbol);
    } else {
      missingSymbols.push(holding.symbol);
    }
  }

  const coveragePercent = totalEstimatedValue > 0 ? (availableValue / totalEstimatedValue) * 100 : 0;
  const isSufficient = coveragePercent >= 80;

  return {
    isSufficient,
    coveragePercent,
    availableValue,
    totalValue: totalEstimatedValue,
    availableSymbols,
    missingSymbols
  };
}
