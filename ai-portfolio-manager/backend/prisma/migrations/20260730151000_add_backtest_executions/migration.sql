CREATE TYPE "BacktestStatus" AS ENUM ('SUCCESS', 'FAILED');

CREATE TABLE "backtest_executions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "short_window" INTEGER NOT NULL,
    "long_window" INTEGER NOT NULL,
    "initial_capital" DECIMAL(15,2) NOT NULL,
    "status" "BacktestStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backtest_executions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "backtest_executions_user_id_idx" ON "backtest_executions"("user_id");
CREATE INDEX "backtest_executions_status_idx" ON "backtest_executions"("status");

ALTER TABLE "backtest_executions" ADD CONSTRAINT "backtest_executions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
