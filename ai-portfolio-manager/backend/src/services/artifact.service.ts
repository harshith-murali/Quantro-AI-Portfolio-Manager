import prisma from "@/config/db";
import { Prisma } from "@prisma/client";

export async function saveArtifact(
  userId: string,
  kind: string,
  key: string,
  value: Prisma.InputJsonValue,
) {
  return prisma.userArtifact.upsert({
    where: { userId_kind_key: { userId, kind, key } },
    create: { userId, kind, key, value },
    update: { value },
  });
}
