ALTER TABLE "users"
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "email_otp_hash" TEXT,
  ADD COLUMN "email_otp_expires_at" TIMESTAMP(3),
  ADD COLUMN "email_otp_last_sent_at" TIMESTAMP(3);

UPDATE "users" SET "email_verified" = true;
