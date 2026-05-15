-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('PORTFOLIO_SUMMARY', 'STOCK_ADVICE', 'RISK_ANALYSIS', 'GENERAL_QA');

-- CreateTable
CREATE TABLE "insight_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "insight_type" "InsightType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "insight_logs_user_id_idx" ON "insight_logs"("user_id");

-- CreateIndex
CREATE INDEX "insight_logs_insight_type_idx" ON "insight_logs"("insight_type");

-- AddForeignKey
ALTER TABLE "insight_logs" ADD CONSTRAINT "insight_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
