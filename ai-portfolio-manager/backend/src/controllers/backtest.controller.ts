import { Request, Response } from 'express';
import { runBacktest, BacktestParams } from '@/services/backtest.service';
import prisma from '@/config/db';
import { Prisma } from '@prisma/client';
import { AppError } from '@/utils/AppError';
import { successResponse } from '@/utils/ApiResponse';
import { logger } from '@/utils/logger';

const FREE_BACKTEST_LIMIT = 5;

export async function executeBacktest(req: Request, res: Response) {
  const symbol = req.query.symbol as string;
  
  if (!symbol) {
    throw new AppError('Symbol parameter is required', 400);
  }

  const shortWindow = req.query.shortWindow ? parseInt(req.query.shortWindow as string, 10) : 20;
  const longWindow = req.query.longWindow ? parseInt(req.query.longWindow as string, 10) : 50;
  const initialCapital = req.query.initialCapital ? parseFloat(req.query.initialCapital as string) : 100000;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  if (isNaN(shortWindow) || isNaN(longWindow) || isNaN(initialCapital)) {
    throw new AppError('Numeric parameters must be valid numbers', 400);
  }

  if (shortWindow >= longWindow) {
    throw new AppError('shortWindow must be less than longWindow', 400);
  }

  const successfulRuns = await prisma.backtestExecution.count({
    where: { userId: req.user!.id, status: 'SUCCESS' },
  });
  if (successfulRuns >= FREE_BACKTEST_LIMIT) {
    throw new AppError('Free backtest limit reached. Billing is not implemented in this educational version.', 402);
  }

  const params: BacktestParams = {
    symbol,
    shortWindow,
    longWindow,
    initialCapital,
    startDate,
    endDate
  };

  try {
    const result = await runBacktest(params);

    if (result.error) {
      throw new AppError(result.error, result.status || 500);
    }

    await prisma.backtestExecution.create({
      data: {
        userId: req.user!.id,
        symbol,
        shortWindow,
        longWindow,
        initialCapital: new Prisma.Decimal(initialCapital),
        status: 'SUCCESS',
      },
    });

    res.status(200).json(successResponse('Backtest executed successfully', {
      ...result,
      usage: {
        successfulRuns: successfulRuns + 1,
        freeLimit: FREE_BACKTEST_LIMIT,
        billingImplemented: false,
      },
    }));
  } catch (error) {
    logger.error('Backtest execution failed', { error, userId: req.user?.id, symbol });
    throw error;
  }
}
