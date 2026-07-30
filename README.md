# Quantro - AI Portfolio Manager

Quantro is a full-stack AI-assisted portfolio manager and paper-trading platform for Indian equities. It combines secure authentication, market-data-backed portfolio valuation, deterministic technical signals, watchlists, backtesting, wallet-based paper trading, and an AI advisor experience in a polished Next.js interface.

> Educational/demo project only. Quantro does not provide financial advice, brokerage services, or live trade execution.

## Highlights

- Secure JWT auth with short-lived access tokens and HttpOnly refresh-token cookies
- Server-authoritative paper-trade execution using backend market data
- Portfolio valuation engine for holdings, P&L, day change, dashboard analytics, and snapshots
- Technical signal API powered by OHLCV data, RSI, SMA, EMA, MACD, volume, and price-change indicators
- Persistent user watchlists with signal enrichment
- Wallet and transaction ledger for simulated deposits, withdrawals, and trades
- Authenticated backtest flow with free-tier usage tracking
- AI advisor surface for explaining portfolio context and investment concepts
- Daily market-data pipeline designed for GitHub Actions, Yahoo Finance, and AWS S3
- CI workflow for backend build/tests/Prisma checks and frontend production build

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| UI/Data Viz | Recharts, Framer Motion, Lightweight Charts, Lucide Icons |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT access tokens, HttpOnly refresh-token cookies, bcrypt |
| Market Data | Yahoo Finance ingestion, AWS S3 OHLCV storage |
| AI | Anthropic SDK integration |
| Cache | Redis via ioredis, with TTL-aware in-memory fallback for local/dev |
| CI | GitHub Actions |

## Architecture

```text
Quantro-AI-Portfolio-Manager/
├── README.md
├── .github/workflows/
│   ├── ci.yml
│   └── daily-pipeline.yml
└── ai-portfolio-manager/
    ├── backend/
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   └── migrations/
    │   └── src/
    │       ├── controllers/
    │       ├── middlewares/
    │       ├── routes/
    │       ├── services/
    │       ├── utils/
    │       └── validators/
    └── quantro-landing/
        └── src/
            ├── app/
            ├── components/
            └── lib/
```

## Core Domains

### Authentication

Quantro uses access tokens for API authorization and refresh tokens for session renewal. Refresh tokens are delivered through HttpOnly cookies so they are not readable by frontend JavaScript. State-changing requests are protected with origin/referer validation.

### Paper Trading

The frontend submits only the symbol and quantity. The backend validates the symbol, resolves the latest available market price from S3 OHLCV data, and executes the simulated trade against that server-authoritative price. Wallet debits use a balance-guarded atomic update to reduce overspend race risk.

### Portfolio Valuation

Portfolio valuation is centralized in one backend service. Dashboard analytics, portfolio summaries, holdings, sector allocation, top movers, snapshots, realized P&L, unrealized P&L, and data-coverage metadata all flow through the same valuation path.

### Technical Signals

Signals are generated deterministically from OHLCV data instead of static frontend mocks. The signal engine calculates:

- RSI 14
- SMA 20 / 50 / 200
- EMA 12 / 26
- MACD, signal line, and histogram
- Latest volume and average volume
- Daily price change
- Signal rationale and confidence

### Watchlists

Watchlist items are persisted per user through Prisma and enriched with the latest available technical signal data when loaded.

### Backtesting

Backtests require authentication and are tracked per user. The current implementation enforces a free usage limit for successful runs. The simulation engine is functional, but still needs deeper production hardening around look-ahead bias, slippage, transaction costs, integer share sizing, and benchmark rigor.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL
- Optional: Redis
- Optional for market data: AWS S3 bucket and AWS credentials
- Optional for AI advisor: Anthropic API key

### Clone

```bash
git clone https://github.com/harshith-murali/Quantro-AI-Portfolio-Manager.git
cd Quantro-AI-Portfolio-Manager
```

### Backend Setup

```bash
cd ai-portfolio-manager/backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma generate
npm run dev
```

The backend runs on `http://localhost:8080` by default.

### Frontend Setup

In a second terminal:

```bash
cd ai-portfolio-manager/quantro-landing
npm install
cp .env.example .env.local
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

## Environment Variables

Backend `.env`:

```env
NODE_ENV=development
PORT=8080
DATABASE_URL="postgresql://quantro_user:quantro_password@localhost:5432/quantro_db?schema=public"
ACCESS_TOKEN_SECRET=replace-with-32-plus-char-secret
REFRESH_TOKEN_SECRET=replace-with-different-32-plus-char-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
REFRESH_COOKIE_SAMESITE=lax
CORS_ORIGIN=http://localhost:3000
BCRYPT_ROUNDS=12

# Optional Redis
REDIS_URL=redis://localhost:6379

# Market data
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-market-data-bucket
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
MARKET_DATA_MAX_STALENESS_DAYS=10

# AI advisor
ANTHROPIC_API_KEY=

# Demo/testing override
BYPASS_MARKET_HOURS=true
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Useful Commands

Backend:

```bash
cd ai-portfolio-manager/backend
npm run dev
npm run build
npm test
npx prisma format --check
npx prisma validate
npx prisma migrate dev
npm run pipeline
npm run pipeline:force
```

Frontend:

```bash
cd ai-portfolio-manager/quantro-landing
npm run dev
npm run build
```

## API Surface

| Area | Endpoints |
| --- | --- |
| Auth | `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me` |
| Financial profile | `/api/financial-profile`, `/api/financial-profile/me` |
| Portfolio | `/api/portfolio`, `/api/portfolio/summary`, `/api/portfolio/history`, `/api/holdings`, `/api/holdings/:symbol` |
| Trades | `/api/trade/buy`, `/api/trade/sell`, `/api/trade/history` |
| Analytics | `/api/dashboard/*` |
| Signals | `/api/signals`, `/api/signals/:symbol` |
| Watchlist | `/api/watchlist` |
| Backtest | `/api/backtest` |
| Wallet | `/api/wallet/balance`, `/api/wallet/deposit`, `/api/wallet/withdraw`, `/api/transactions` |
| Health | `/api/health` |

Most application endpoints require a bearer access token. Refresh uses the HttpOnly refresh cookie.

## Database Changes

Recent production-readiness work added:

- `WatchlistItem` for persisted user watchlists
- `BacktestExecution` and `BacktestStatus` for authenticated usage tracking
- Portfolio, wallet, transaction, trade, insight, and summary models for the core app domain

For deployment:

```bash
cd ai-portfolio-manager/backend
npx prisma migrate deploy
npx prisma generate
```

## Validation

Current branch validation:

```bash
cd ai-portfolio-manager/backend
npx prisma format --check
npx prisma validate
npm run build
npm test

cd ../quantro-landing
npm run build
```

## Deployment

Recommended deployment:

- Backend on Render using `render.yaml`
- PostgreSQL on AWS RDS
- Frontend on Vercel with root directory `ai-portfolio-manager/quantro-landing`
- AWS S3 for OHLCV market data

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the exact Render/Vercel steps and required secrets.

## Resume-Friendly Summary

Built and hardened a full-stack AI portfolio-management platform with secure cookie-based refresh-token auth, server-authoritative paper-trading execution, market-data-backed portfolio valuation, deterministic technical signals, persisted watchlists, authenticated backtest usage tracking, Redis cache fallback, CI, and backend test coverage.

## Roadmap

- Add deeper backtest correctness: look-ahead protection, slippage, transaction costs, integer shares, and benchmark validation
- Ground AI advisor responses with stricter schemas, citations, and safer financial disclaimers
- Add integration tests for auth, trades, watchlists, backtests, and portfolio valuation
- Add frontend component and E2E tests
- Improve market-data observability and stale-data alerting
- Add dependency security upgrades and vulnerability triage

## License

This project is for educational and demonstration purposes.
