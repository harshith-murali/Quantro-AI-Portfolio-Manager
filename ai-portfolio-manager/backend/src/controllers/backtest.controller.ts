import { Request, Response } from "express";
import prisma from "@/config/db";
import { Prisma } from "@prisma/client";
import { AppError } from "@/utils/AppError";
import { successResponse } from "@/utils/ApiResponse";
import { backtestSchema } from "@/validators/backtest.validator";
import { simulateBacktest } from "@/services/backtest.service";
import { loadBacktestHistory } from "@/services/backtestData.service";
import type { OhlcvBar } from "@/services/marketPrice.service";
import { randomUUID } from "node:crypto";

export async function executeBacktest(req: Request, res: Response) {
  const params = backtestSchema.parse(req.query),
    userId = req.user!.id;
  const [runs, sandbox] = await Promise.all([
    prisma.backtestExecution.count({ where: { userId, status: "SUCCESS" } }),
    prisma.userArtifact.findUnique({
      where: { userId_kind_key: { userId, kind: "DEMO", key: "session" } },
    }),
  ]);
  if (runs >= 5 && !sandbox)
    throw new AppError(
      "Your five saved backtests have been used. Start a fresh interview sandbox to continue; paid billing is not enabled.",
      402,
    );
  const source = await loadBacktestHistory(params.symbol);
  const bars = source.data as OhlcvBar[];
  const result = simulateBacktest(params, bars);
  const selected = bars.filter(
    (b) =>
      (!params.startDate || b.date >= params.startDate) &&
      (!params.endDate || b.date <= params.endDate),
  );
  const split = selected[Math.floor(selected.length * 0.7)]?.date;
  const oos =
    split && selected.length >= 60
      ? {
          splitDate: split,
          training: simulateBacktest(
            {
              ...params,
              endDate: selected[Math.floor(selected.length * 0.7) - 1].date,
            },
            bars,
          ).summary,
          test: simulateBacktest({ ...params, startDate: split }, bars).summary,
          note: "Chronological 70/30 split with fixed parameters. No tuning on the test period; not evidence of future profitability.",
        }
      : null;
  const comparison = [
    { shortWindow: 10, longWindow: 30 },
    { shortWindow: 20, longWindow: 50 },
    { shortWindow: 30, longWindow: 100 },
  ].map((w) => ({
    parameters: { ...params, ...w },
    summary: simulateBacktest({ ...params, ...w }, bars).summary,
  }));
  const id = randomUUID();
  const output = {
    ...result,
    id,
    metadata: {
      ...result.metadata,
      dataSource: source.key,
      provenance: source.provenance,
      computedAt: new Date().toISOString(),
    },
    outOfSample: oos,
    comparison,
    usage: {
      successfulRuns: runs + 1,
      freeLimit: sandbox ? null : 5,
      billingImplemented: false,
      sandbox: Boolean(sandbox),
    },
  };
  await prisma.$transaction(async (tx) => {
    await tx.backtestExecution.create({
      data: {
        userId,
        symbol: params.symbol,
        shortWindow: params.shortWindow,
        longWindow: params.longWindow,
        initialCapital: new Prisma.Decimal(params.initialCapital),
        status: "SUCCESS",
      },
    });
    await tx.userArtifact.create({
      data: {
        userId,
        kind: "BACKTEST",
        key: id,
        value: JSON.parse(JSON.stringify(output)),
      },
    });
  });
  res.json(
    successResponse(
      "Backtest completed with execution costs and next-open fills",
      output,
    ),
  );
}
