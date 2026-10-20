CREATE TABLE IF NOT EXISTS "user_artifacts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "kind" VARCHAR(40) NOT NULL,
  "key" VARCHAR(100) NOT NULL,
  "value" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_artifacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_artifacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_artifacts_user_id_kind_key_key" ON "user_artifacts"("user_id", "kind", "key");
CREATE INDEX IF NOT EXISTS "user_artifacts_user_id_kind_idx" ON "user_artifacts"("user_id", "kind");
CREATE TABLE IF NOT EXISTS "waitlist_signups" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "consent" BOOLEAN NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "waitlist_signups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_signups_email_key" ON "waitlist_signups"("email");
