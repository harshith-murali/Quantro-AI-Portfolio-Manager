# Deployment Guide

This repo is deployment-ready for a split frontend/backend setup:

- Frontend: Vercel
- Backend: Render
- Database: AWS RDS PostgreSQL
- Market data: AWS S3

## 1. Backend on Render

Use the root `render.yaml` Blueprint.

The Blueprint uses a Render free web service for easy demo deployment. Render free web services can spin down after inactivity. Upgrade before treating this as a long-lived production deployment.

1. In Render, choose **New > Blueprint**.
2. Connect `harshith-murali/Quantro-AI-Portfolio-Manager`.
3. Select the `fix/quantro-production-readiness` branch or merge this branch into `main` first.
4. Render will create:
   - `quantro-api`
5. Fill the prompted secret/environment values.

Required backend environment values:

```env
DATABASE_URL=your-aws-rds-postgres-url
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
CORS_ORIGIN=https://your-vercel-app.vercel.app
AWS_REGION=your-aws-region
AWS_S3_BUCKET=your-s3-bucket
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
ANTHROPIC_API_KEY=optional-anthropic-key
BYPASS_MARKET_HOURS=true
```

To require OTP verification for new registrations, also configure SMTP and enable the feature:

```env
EMAIL_VERIFICATION_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM="Quantro <no-reply@your-domain.com>"
```

The Blueprint already sets:

```env
NODE_ENV=production
REFRESH_COOKIE_SAMESITE=none
ACCESS_TOKEN_EXPIRY=30m
REFRESH_TOKEN_EXPIRY=7d
MARKET_DATA_MAX_STALENESS_DAYS=10
EMAIL_VERIFICATION_ENABLED=false
EMAIL_OTP_EXPIRY_MINUTES=10
EMAIL_OTP_RESEND_COOLDOWN_SECONDS=60
```

For separate Vercel and Render domains, `REFRESH_COOKIE_SAMESITE=none` is required so refresh-token cookies are sent on cross-site API requests. Render serves HTTPS, so the backend will also set `Secure` cookies in production.

## 2. Frontend on Vercel

1. In Vercel, import the same GitHub repo.
2. Set the project root directory to:

```text
ai-portfolio-manager/quantro-landing
```

3. Set the frontend environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-render-api.onrender.com/api
```

4. Deploy.

## 3. Verify

After both services are live:

1. Open the Render health endpoint:

```text
https://your-render-api.onrender.com/api/health
```

2. Open the Vercel frontend.
3. Register a user.
4. Confirm login persists after refresh.
5. Create/update the financial profile.
6. Test wallet deposit.
7. Test signals/watchlist/trading only after S3 contains OHLCV CSVs.

## 4. S3 Market Data Format

The backend expects CSV files under:

```text
ohlcv/SYMBOL.csv
```

Examples:

```text
ohlcv/RELIANCE.csv
ohlcv/TCS.csv
ohlcv/INFY.csv
```

The CSV must include valid OHLCV rows with positive prices. If market data is stale beyond `MARKET_DATA_MAX_STALENESS_DAYS`, trades and signals can reject the data.

## 5. Common Issues

### Login works but refresh/logout fails

Check:

- `CORS_ORIGIN` exactly matches the Vercel app URL.
- `NEXT_PUBLIC_API_URL` exactly matches the Render API URL with `/api`.
- Backend has `REFRESH_COOKIE_SAMESITE=none`.
- Frontend requests include credentials. The API client is already configured for this.

### Trades or signals fail

Check:

- S3 bucket name and region are correct.
- AWS credentials can read the bucket.
- Files exist under `ohlcv/`.
- CSV data is recent enough for `MARKET_DATA_MAX_STALENESS_DAYS`.

### Prisma migration fails on Render

Check:

- `DATABASE_URL` points to the AWS RDS PostgreSQL database and the database is reachable from Render.
- The Render service start command is:

```bash
npx prisma migrate deploy && npm start
```
