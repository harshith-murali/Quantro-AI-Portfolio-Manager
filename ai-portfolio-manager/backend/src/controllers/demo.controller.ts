import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import prisma from "@/config/db";
import { registerGetRefreshToken } from "@/services/auth.service";
import { deposit } from "@/services/transaction.service";
import { saveArtifact } from "@/services/artifact.service";
import { successResponse } from "@/utils/ApiResponse";

export async function createDemo(req: Request, res: Response) {
  const result = await registerGetRefreshToken(
    {
      name: "Interview Sandbox",
      email: `sandbox-${randomUUID()}@sandbox.quantro.invalid`,
      password: `Demo!9${randomUUID()}`,
    },
    req.ip || "",
  );
  const userId = result.user.id;
  await prisma.financialProfile.create({
    data: {
      userId,
      monthlyIncome: 100000,
      monthlyExpenses: 40000,
      currentSavings: 100000,
      investableAmount: 40000,
      riskAppetite: "MEDIUM",
      financialGoal:
        "Explore paper investing in an isolated interview sandbox.",
    },
  });
  await deposit(userId, {
    amount: 100000,
    description: "Interview sandbox virtual starting cash",
  });
  await saveArtifact(userId, "DEMO", "session", {
    createdAt: new Date().toISOString(),
    virtual: true,
  });
  res.cookie("rt", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 86400000,
    path: "/api/auth",
  });
  res
    .status(201)
    .json(
      successResponse("Isolated interview sandbox created", {
        user: result.user,
        accessToken: result.accessToken,
        sandbox: true,
      }),
    );
}
