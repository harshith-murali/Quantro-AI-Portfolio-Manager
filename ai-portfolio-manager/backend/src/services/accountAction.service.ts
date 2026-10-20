import { createHash, randomBytes } from "node:crypto";
import prisma from "@/config/db";
import { AppError } from "@/utils/AppError";
import { hashPassword } from "@/utils/hash";
import { registerSchema } from "@/validators/auth.validator";
import { saveArtifact } from "@/services/artifact.service";
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function requestAccountAction(
  email: string,
  kind: "reset" | "verify",
) {
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM)
    throw new AppError(
      "Email delivery is not configured for this demo. Use an interview sandbox, or contact the project owner for account recovery.",
      503,
    );
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user) return;
  const token = randomBytes(32).toString("hex"),
    key = `${kind}:${digest(token)}`;
  await saveArtifact(user.id, "ACCOUNT_ACTION", key, {
    kind,
    expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
  });
  const base =
    process.env.PUBLIC_APP_URL || "https://quantro-landing.vercel.app";
  const url = `${base}/auth/recovery?kind=${kind}&token=${token}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: [user.email],
      subject:
        kind === "reset"
          ? "Reset your Quantro password"
          : "Verify your Quantro email",
      text: `Open this single-use link within 30 minutes: ${url}\nIf you did not request this, ignore this email.`,
    }),
  });
  if (!response.ok) {
    await prisma.userArtifact.deleteMany({
      where: { userId: user.id, kind: "ACCOUNT_ACTION", key },
    });
    throw new AppError(
      "The account email could not be delivered. Please retry later.",
      503,
    );
  }
}
export async function completeAccountAction(
  token: string,
  kind: "reset" | "verify",
  password?: string,
) {
  const key = `${kind}:${digest(token)}`;
  const record = await prisma.userArtifact.findFirst({
    where: { kind: "ACCOUNT_ACTION", key },
  });
  if (
    !record ||
    new Date((record.value as any).expiresAt).getTime() < Date.now()
  )
    throw new AppError("This link is invalid, expired or already used.", 400);
  const hashed =
    kind === "reset"
      ? await hashPassword(registerSchema.shape.password.parse(password))
      : undefined;
  await prisma.$transaction(async (tx) => {
    const consumed = await tx.userArtifact.deleteMany({
      where: { id: record.id },
    });
    if (consumed.count !== 1)
      throw new AppError("This link has already been used.", 400);
    if (hashed) {
      await tx.user.update({
        where: { id: record.userId },
        data: { hashedPassword: hashed, tokenVersion: { increment: 1 } },
      });
      await tx.refreshToken.updateMany({
        where: { userId: record.userId },
        data: { revoked: true },
      });
    } else
      await tx.userArtifact.upsert({
        where: {
          userId_kind_key: {
            userId: record.userId,
            kind: "SECURITY",
            key: "emailVerified",
          },
        },
        create: {
          userId: record.userId,
          kind: "SECURITY",
          key: "emailVerified",
          value: { verifiedAt: new Date().toISOString() },
        },
        update: { value: { verifiedAt: new Date().toISOString() } },
      });
  });
}
