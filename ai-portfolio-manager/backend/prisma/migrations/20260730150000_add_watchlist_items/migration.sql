CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "watchlist_items_user_id_symbol_key" ON "watchlist_items"("user_id", "symbol");
CREATE INDEX "watchlist_items_user_id_idx" ON "watchlist_items"("user_id");
CREATE INDEX "watchlist_items_symbol_idx" ON "watchlist_items"("symbol");

ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
