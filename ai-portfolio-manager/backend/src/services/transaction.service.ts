import { Prisma, TransactionType } from '@prisma/client';
import prisma from '@/config/db';
import redis from '@/config/redis';
import { AppError, NotFoundError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import { WalletActionInput } from '@/validators/transaction.validator';
import { invalidateDashboardCache } from '@/services/analytics.service';

/**
 * Ensures a user has a wallet, creates it if it doesn't exist.
 */
export async function getOrCreateWallet(tx: Prisma.TransactionClient, userId: string) {
  const wallet = await tx.wallet.findUnique({ where: { userId } });
  if (wallet) return wallet;

  return tx.wallet.create({
    data: {
      userId,
      balance: new Prisma.Decimal(0.0),
    },
  });
}

/**
 * Add virtual cash to user wallet.
 */
export async function deposit(userId: string, input: WalletActionInput) {
  const { amount, description } = input;

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await getOrCreateWallet(tx, userId);

    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        balance: { increment: new Prisma.Decimal(amount) },
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        amount: new Prisma.Decimal(amount),
        description: description || 'Wallet deposit',
        status: 'SUCCESS',
      },
    });

    return { wallet: updatedWallet, transaction };
  });

  logger.info('Wallet DEPOSIT executed', { userId, amount });

  await Promise.all([
    invalidateWalletCache(userId),
    invalidateDashboardCache(userId),
  ]);
  return result;
}

/**
 * Deduct virtual cash from user wallet.
 */
export async function withdraw(userId: string, input: WalletActionInput) {
  const { amount, description } = input;

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await getOrCreateWallet(tx, userId);

    if (Number(wallet.balance) < amount) {
      throw new AppError('Insufficient wallet balance for withdrawal', 400);
    }

    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        balance: { decrement: new Prisma.Decimal(amount) },
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: 'WITHDRAWAL',
        amount: new Prisma.Decimal(amount),
        description: description || 'Wallet withdrawal',
        status: 'SUCCESS',
      },
    });

    return { wallet: updatedWallet, transaction };
  });

  logger.info('Wallet WITHDRAWAL executed', { userId, amount });

  await Promise.all([
    invalidateWalletCache(userId),
    invalidateDashboardCache(userId),
  ]);
  return result;
}

/**
 * Get current wallet balance.
 */
export async function getBalance(userId: string) {
  const cacheKey = `wallet:balance:${userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return { balance: parseFloat(cached) };
  }

  const wallet = await prisma.$transaction(async (tx) => {
    return getOrCreateWallet(tx, userId);
  });

  const balance = Number(wallet.balance);
  await redis.set(cacheKey, balance.toString(), 'EX', 3600);
  return { balance };
}

/**
 * INTERNAL: Process a trade debit (called from Portfolio Service during BUY).
 */
export async function processTradeDebit(
  tx: Prisma.TransactionClient,
  userId: string,
  amount: number,
  referenceId: string,
  description: string
) {
  const wallet = await getOrCreateWallet(tx, userId);

  if (Number(wallet.balance) < amount) {
    throw new AppError(`Insufficient wallet balance to execute trade. Required: ${amount}, available: ${wallet.balance}`, 400);
  }

  await tx.wallet.update({
    where: { userId },
    data: {
      balance: { decrement: new Prisma.Decimal(amount) },
    },
  });

  await tx.transaction.create({
    data: {
      userId,
      type: 'TRADE_DEBIT',
      amount: new Prisma.Decimal(amount),
      referenceId,
      description,
      status: 'SUCCESS',
    },
  });
}

/**
 * INTERNAL: Process trade credit and P&L settlement (called from Portfolio Service during SELL).
 */
export async function processTradeCredit(
  tx: Prisma.TransactionClient,
  userId: string,
  amount: number,
  referenceId: string,
  description: string,
  realizedPnl?: number
) {
  await getOrCreateWallet(tx, userId);

  await tx.wallet.update({
    where: { userId },
    data: {
      balance: { increment: new Prisma.Decimal(amount) },
    },
  });

  await tx.transaction.create({
    data: {
      userId,
      type: 'TRADE_CREDIT',
      amount: new Prisma.Decimal(amount),
      referenceId,
      description,
      status: 'SUCCESS',
    },
  });

  // Logized realized P&L as internal settlement if applicable
  if (realizedPnl && realizedPnl !== 0) {
    await tx.transaction.create({
      data: {
        userId,
        type: 'PNL_CREDIT',
        amount: new Prisma.Decimal(Math.abs(realizedPnl)),
        referenceId,
        description: `Realized P&L settlement for ${referenceId} (P&L: ${realizedPnl >= 0 ? '+' : '-'}${Math.abs(realizedPnl)})`,
        status: 'SUCCESS',
      },
    });
  }
}

/**
 * Get all transactions for user.
 */
export async function getUserTransactions(userId: string, limit = 50, offset = 0) {
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return { transactions, total, limit, offset };
}

/**
 * Get single transaction by ID.
 */
export async function getTransactionById(userId: string, transactionId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction');
  }

  return transaction;
}

/**
 * Aggregate summary stats (credits vs debits).
 */
export async function getTransactionSummary(userId: string) {
  const cacheKey = `wallet:summary:${userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const aggregates = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId, status: 'SUCCESS' },
    _sum: {
      amount: true,
    },
  });

  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalTradeDebits = 0;
  let totalTradeCredits = 0;
  let totalPnlCredits = 0;

  aggregates.forEach((group) => {
    const val = Number(group._sum.amount || 0);
    switch (group.type) {
      case 'DEPOSIT':
        totalDeposits = val;
        break;
      case 'WITHDRAWAL':
        totalWithdrawals = val;
        break;
      case 'TRADE_DEBIT':
        totalTradeDebits = val;
        break;
      case 'TRADE_CREDIT':
        totalTradeCredits = val;
        break;
      case 'PNL_CREDIT':
        totalPnlCredits = val;
        break;
    }
  });

  const summary = {
    totalDeposited: totalDeposits,
    totalWithdrawn: totalWithdrawals,
    totalInvested: totalTradeDebits,
    totalSaleProceeds: totalTradeCredits,
    totalPnlSettled: totalPnlCredits,
    netCashFlow: totalDeposits - totalWithdrawals,
  };

  await redis.set(cacheKey, JSON.stringify(summary), 'EX', 3600);
  return summary;
}

/**
 * Cache invalidator for wallet and transactions.
 */
export async function invalidateWalletCache(userId: string) {
  const keys = await redis.keys(`wallet:*:${userId}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
