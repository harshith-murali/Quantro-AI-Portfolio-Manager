import prisma from '@/config/db';
import { ConflictError, NotFoundError } from '@/utils/AppError';
import { normalizeSupportedSymbol } from '@/utils/symbol';
import { getTechnicalSignal } from '@/services/technicalAnalysis.service';

export async function listWatchlist(userId: string) {
  const items = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const enriched = await Promise.all(items.map(async (item) => {
    try {
      const signal = await getTechnicalSignal(item.symbol);
      return { ...item, signal };
    } catch {
      return { ...item, signal: null };
    }
  }));

  return { items: enriched };
}

export async function addWatchlistItem(userId: string, symbolInput: string) {
  const symbol = normalizeSupportedSymbol(symbolInput);
  const existing = await prisma.watchlistItem.findUnique({
    where: { userId_symbol: { userId, symbol } },
  });
  if (existing) {
    throw new ConflictError(`${symbol} is already in your watchlist`);
  }

  const item = await prisma.watchlistItem.create({ data: { userId, symbol } });
  let signal = null;
  try {
    signal = await getTechnicalSignal(symbol);
  } catch {
    signal = null;
  }
  return { item: { ...item, signal } };
}

export async function removeWatchlistItem(userId: string, symbolInput: string) {
  const symbol = normalizeSupportedSymbol(symbolInput);
  const existing = await prisma.watchlistItem.findUnique({
    where: { userId_symbol: { userId, symbol } },
  });
  if (!existing) {
    throw new NotFoundError('Watchlist item');
  }
  await prisma.watchlistItem.delete({ where: { userId_symbol: { userId, symbol } } });
}
