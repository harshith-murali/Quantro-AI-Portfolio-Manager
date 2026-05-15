import { Request, Response } from 'express';
import * as InsightService from '@/services/insight.service';
import { askInsightSchema, stockInsightSchema } from '@/validators/insight.validator';
import { successResponse } from '@/utils/ApiResponse';

const DISCLAIMER = "This is an AI-generated insight and does not constitute financial advice. Always consult with a certified financial planner before making investment decisions.";

export async function getPortfolioSummary(req: Request, res: Response) {
  const userId = req.user!.id;
  
  const insight = await InsightService.getPortfolioSummary(userId);

  res.status(200).json(
    successResponse('Portfolio summary insight generated', {
      insight,
      disclaimer: DISCLAIMER,
    })
  );
}

export async function getStockInsight(req: Request, res: Response) {
  const userId = req.user!.id;
  const { symbol } = stockInsightSchema.parse(req.params);

  const insight = await InsightService.getStockAdvice(userId, symbol);

  res.status(200).json(
    successResponse('Stock insight generated', {
      insight,
      disclaimer: DISCLAIMER,
    })
  );
}

export async function getRiskAnalysis(req: Request, res: Response) {
  const userId = req.user!.id;
  
  const insight = await InsightService.getRiskAnalysis(userId);

  res.status(200).json(
    successResponse('Risk analysis insight generated', {
      insight,
      disclaimer: DISCLAIMER,
    })
  );
}

export async function askQuestion(req: Request, res: Response) {
  const userId = req.user!.id;
  const { question } = askInsightSchema.parse(req.body);

  const insight = await InsightService.askGeneralQA(userId, question);

  res.status(200).json(
    successResponse('General Q&A insight generated', {
      insight,
      disclaimer: DISCLAIMER,
    })
  );
}

export async function getInsightHistory(req: Request, res: Response) {
  const userId = req.user!.id;
  
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const history = await InsightService.getInsightHistory(userId, limit, offset);

  res.status(200).json(
    successResponse('Insight history retrieved', history)
  );
}

export async function getRecommendations(req: Request, res: Response) {
  const userId = req.user!.id;
  const recommendations = await InsightService.getRecommendations(userId);

  res.status(200).json(
    successResponse('Recommendations generated', {
      recommendations,
      disclaimer: DISCLAIMER,
    })
  );
}
