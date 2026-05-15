import { Request, Response } from 'express';
import * as TransactionService from '@/services/transaction.service';
import { walletActionSchema } from '@/validators/transaction.validator';
import { successResponse } from '@/utils/ApiResponse';

/**
 * POST /wallet/deposit
 */
export async function depositCash(req: Request, res: Response) {
  const userId = req.user!.id;
  const validatedData = walletActionSchema.parse(req.body);

  const result = await TransactionService.deposit(userId, validatedData);

  res.status(200).json(
    successResponse('Deposit successful', {
      balance: result.wallet.balance,
      transaction: result.transaction,
    })
  );
}

/**
 * POST /wallet/withdraw
 */
export async function withdrawCash(req: Request, res: Response) {
  const userId = req.user!.id;
  const validatedData = walletActionSchema.parse(req.body);

  const result = await TransactionService.withdraw(userId, validatedData);

  res.status(200).json(
    successResponse('Withdrawal successful', {
      balance: result.wallet.balance,
      transaction: result.transaction,
    })
  );
}

/**
 * GET /wallet/balance
 */
export async function getWalletBalance(req: Request, res: Response) {
  const userId = req.user!.id;
  const result = await TransactionService.getBalance(userId);

  res.status(200).json(
    successResponse('Wallet balance retrieved', result)
  );
}

/**
 * GET /transactions
 */
export async function getTransactions(req: Request, res: Response) {
  const userId = req.user!.id;

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const result = await TransactionService.getUserTransactions(userId, limit, offset);

  res.status(200).json(
    successResponse('Transactions retrieved', result)
  );
}

/**
 * GET /transactions/summary
 */
export async function getSummary(req: Request, res: Response) {
  const userId = req.user!.id;
  const result = await TransactionService.getTransactionSummary(userId);

  res.status(200).json(
    successResponse('Transaction summary retrieved', { summary: result })
  );
}

/**
 * GET /transactions/:id
 */
export async function getTransaction(req: Request, res: Response) {
  const userId = req.user!.id;
  const transactionId = req.params.id;

  const result = await TransactionService.getTransactionById(userId, transactionId);

  res.status(200).json(
    successResponse('Transaction details retrieved', { transaction: result })
  );
}
