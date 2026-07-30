import { Request, Response } from 'express';
import { successResponse } from '@/utils/ApiResponse';
import { getTechnicalSignal, listTechnicalSignals } from '@/services/technicalAnalysis.service';

export async function listSignals(req: Request, res: Response): Promise<void> {
  const requestedLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 50;
  const signals = await listTechnicalSignals(limit);
  res.status(200).json(successResponse('Signals retrieved successfully', { signals }));
}

export async function getSignal(req: Request, res: Response): Promise<void> {
  const signal = await getTechnicalSignal(req.params.symbol);
  res.status(200).json(successResponse('Signal retrieved successfully', { signal }));
}
