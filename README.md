<p align="center">
  <img src="https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white" />
  <img src="https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge" />
</p>

# Quantro — AI Portfolio Manager & Backtesting Platform

> An intelligent, full-stack stock portfolio platform tailored for the Indian stock market (NSE). Helps investors understand risk exposure, explore AI-driven stock recommendations, execute simulated trades with transparent fees, run deterministic SMA crossover backtests, and monitor portfolios — all wrapped in a high-contrast dark-mode interface.

🔗 **Live Demo:** [quantro-landing.vercel.app](https://quantro-landing.vercel.app)  
📦 **Repository:** [github.com/harshith-murali/Quantro-AI-Portfolio-Manager](https://github.com/harshith-murali/Quantro-AI-Portfolio-Manager)

📋 **Interview walkthrough:** [Demo plan, architecture, debugging story, and current limitations](INTERVIEW_GUIDE.md)

---

## 🌟 Key Features

### 📊 Smart Dashboard
- **Portfolio vs NIFTY 50** comparison chart; illustrative history is shown when trade history is absent
- Key KPI cards: Total Value, P&L (₹ and %), Day Change, and Win Rate
- Sector-wise allocation donut chart (IT, Financials, Energy, Auto, FMCG)
- Animated search bar with instant stock suggestions and day-change badges

### 🤖 AI Financial Advisor
- Natural language chat interface grounded in the user's current portfolio holdings and risk profile
- Groq-hosted inference with structured JSON output and runtime validation for recommendations
- Cached insights and fixed-window request limits to reduce repeated calls and quota usage
- Recommendations currently use a sample stock/price list; stock-enquiry indicators and the market ticker include demo data

### ⚡ Signal Engine
- Technical BUY / HOLD / SELL signals for 50+ NSE stocks
- Real-time technical indicators: 20/50 SMA crossovers, RSI(14), and MACD histogram
- Dynamic suitability scoring (0–100) based on investor risk profile (Conservative, Moderate, Aggressive)
- Per-stock technical breakdown detail view with interactive charts

### 💼 Portfolio Management & Trade Simulation
- Real-time holding allocations with live profit/loss computation
- **Trade simulation** with interactive Buy/Sell modals backed by PostgreSQL transactions
- Server-resolved INR execution prices; the demo deployment uses validated Yahoo Finance quotes
- Complete transaction ledger with one-click **Excel (.xlsx)** export via SheetJS
- Atomic cash wallet deduction: balance rollback if funds are insufficient

### 📈 Deterministic Backtesting Engine
- SMA Crossover strategy simulation executed over chronological OHLCV historical series
- Configurable short/long moving average windows (e.g., 20/50 days) and starting capital
- Visualizations: Equity curve, drawdown chart, and monthly returns heatmap
- Strategy vs Buy & Hold benchmark comparison
- Key quantitative metrics: CAGR, Sharpe Ratio, Win Rate, and Maximum Drawdown (MDD)
- Five successful backtests per account; billing and paid runs are not implemented

### 🔄 Agentic EOD Data Ingestion Pipeline
- Scheduled automated workflow configured for 5:00 PM IST on weekdays (post-NSE market close)
- Orchestrated by a multi-tier `SupervisorAgent` checking market holiday calendars
- Fetches verified OHLCV market data and archives processed CSV datasets into an **AWS S3** data lake
- Three-tier status model (`COMPLETE`, `PARTIAL`, `HOLIDAY/FAILED`) with 10-minute backoff retries
- Recalculates portfolio P&L and updates metrics across all accounts

### 💳 Virtual Wallet System
- Deposit and withdrawal workflows with atomic ledger tracking
- Real-time running balance calculation
- Seamless integration with trade simulation execution

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| **Visualizations** | Recharts (Area, Line, Bar, Pie, Composed charts) |
| **Animations** | Framer Motion, CSS micro-interactions |
| **Backend API** | Node.js, Express.js, TypeScript |
| **Database & ORM** | PostgreSQL 16+, Prisma ORM |
| **Authentication** | JWT (15-min Access Token + 7-day HttpOnly Refresh Token), bcrypt |
| **Compute & Pipeline** | Docker backend on EC2, GitHub Actions scheduled pipeline |
| **Data Lake** | AWS S3 (Historical OHLCV CSV archives) |
| **Caching & Limits** | TTL-aware in-memory caching in the demo deployment; optional Redis support and fixed-window request limits |
| **State Management** | Zustand (with local storage persistence) |
| **Reports** | SheetJS (`xlsx`) for Excel ledger exports |

---

## 📂 Project Structure

```text
quantro/
├── README.md                              # Main platform documentation
├── .github/workflows/                     # EOD data pipeline automation
└── ai-portfolio-manager/
    ├── backend/                           # Express + Prisma REST API
    │   ├── src/
    │   │   ├── server.ts                  # Server bootstrap & middleware
    │   │   ├── routes/                    # Auth, portfolio, signals, backtest, wallet
    │   │   ├── controllers/               # Request handling & input validation
    │   │   ├── services/                  # Business logic (trade execution, backtesting)
    │   │   ├── middlewares/               # JWT auth, rate limiter, error handler
    │   │   └── config/                    # Environment schema & Prisma client
    │   ├── prisma/
    │   │   ├── schema.prisma              # Database schema & relationships
    │   │   └── seed.ts                    # Test accounts & stock seeds
    │   ├── Dockerfile                     # Backend containerization
    │   └── package.json
    └── quantro-landing/                   # Next.js 14 frontend application
        ├── src/
        │   ├── app/                       # App Router pages
        │   │   ├── dashboard/             # Core overview & analytics
        │   │   ├── signals/               # Stock signals & [symbol] detail view
        │   │   ├── portfolio/             # Holdings & trade history ledger
        │   │   ├── watchlist/             # Monitored stock alerts
        │   │   ├── backtest/              # SMA strategy backtesting UI
        │   │   ├── wallet/                # Virtual wallet management
        │   │   ├── ai/                    # Natural language AI advisor chat
        │   │   └── auth/                  # Login & registration flows
        │   ├── components/                # Reusable UI & chart components
        │   └── lib/                       # API clients, Zustand store, stock datasets
        └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 22.x (required by the market-data client)
- **PostgreSQL** ≥ 14.x (or Docker)
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/harshith-murali/Quantro-AI-Portfolio-Manager.git
cd Quantro-AI-Portfolio-Manager
```

### 2. Configure the Database
Create a PostgreSQL database:
```bash
psql -U postgres -c "CREATE DATABASE ai_portfolio_db;"
```

### 3. Setup Environment Variables

**Backend (`ai-portfolio-manager/backend/.env`):**
```env
NODE_ENV=development
PORT=8080
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_portfolio_db"
ACCESS_TOKEN_SECRET="generate-with-openssl-rand-base64-64"
REFRESH_TOKEN_SECRET="generate-different-secret-with-openssl-rand-base64-64"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"
CORS_ORIGIN="http://localhost:3000"
AI_PROVIDER=groq
GROQ_API_KEY="your-groq-api-key"
GROQ_MODEL=openai/gpt-oss-20b
```

The AI Advisor defaults to Groq using `openai/gpt-oss-20b`, which is listed in
[Groq's Free Plan limits](https://console.groq.com/docs/rate-limits). Create a key
at [Groq API Keys](https://console.groq.com/keys), add it to the backend `.env`,
and restart the backend. For Docker production, set the same variables in
`backend/.env.production` and recreate the container. Keep the Groq account on
the Free plan to avoid paid usage; free requests are subject to account quotas.
`AI_PROVIDER=groq` never falls back to Hugging Face, SageMaker, or Anthropic.
Recommendation responses use a strict JSON schema and are validated before caching.

For simulated execution and valuation without S3 credentials, set
`MARKET_PRICE_PROVIDER=yahoo`. The interview demo uses `BYPASS_MARKET_HOURS=true`
to allow virtual orders after hours at the latest available regular-market quote.
Balance, quantity, holdings, and quote-freshness checks still apply. Historical
backtests and the S3 ingestion pipeline require separate AWS access.

**Frontend (`ai-portfolio-manager/quantro-landing/.env`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 4. Install Dependencies & Start Services

**Terminal 1 — Backend API:**
```bash
cd ai-portfolio-manager/backend
npm install
npm run db:migrate
npm run db:seed      # Seeds demo users and default stock listings
npm run dev
# Server running at http://localhost:8080
```

**Terminal 2 — Frontend Application:**
```bash
cd ai-portfolio-manager/quantro-landing
npm install
npm run dev
# Frontend running at http://localhost:3000
```

### 5. Access the Platform
Open **http://localhost:3000** in your browser. You can register a new account or sign in with seeded credentials:
- `user@quantro.dev` / `Quantro@Secure123!`
- `admin@quantro.dev` / `Quantro@Secure123!`

---

## 📡 REST API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create new investor account |
| `POST` | `/api/auth/login` | Public | Authenticate and issue access + refresh cookies |
| `POST` | `/api/auth/refresh` | Cookie | Rotate refresh token and issue new access token |
| `POST` | `/api/auth/logout` | Bearer | Revoke current session and invalidate tokens |
| `GET` | `/api/auth/me` | Bearer | Fetch current user profile and risk tier |
| `GET` | `/api/signals` | Bearer | Fetch AI technical signals for monitored universe |
| `GET` | `/api/signals/:symbol`| Bearer | Detailed technical breakdown (RSI, SMA, MACD) |
| `GET` | `/api/portfolio` | Bearer | Fetch portfolio snapshot, holdings, and allocations |
| `POST` | `/api/portfolio/trade` | Bearer | Execute atomic trade simulation (Buy/Sell) |
| `POST` | `/api/backtest` | Bearer | Execute SMA crossover simulation over OHLCV data |
| `GET` | `/api/wallet` | Bearer | Query wallet cash balance and transaction ledger |
| `POST` | `/api/wallet/deposit` | Bearer | Deposit simulated cash funds |
| `POST` | `/api/wallet/withdraw`| Bearer | Withdraw funds from available cash balance |

---

## 🔒 Security Architecture

- **Token Lifecycle**: Short-lived (15 min) HS256 access tokens paired with long-lived (7 day) refresh tokens stored as HttpOnly, Secure, SameSite=Strict cookies.
- **Session Revocation & Reuse Detection**: Refresh tokens carry unique JWT IDs and are hashed (SHA-256) in PostgreSQL. Reuse of a revoked token revokes the user's refresh tokens. Logout increments the user's token version to invalidate outstanding access tokens as well.
- **Password Security**: Passwords hashed with bcrypt using a workload factor of 12.
- **Data Integrity**: Financial ledger transactions and virtual trades execute within isolated PostgreSQL transactions (`prisma.$transaction`) to prevent partial balance updates.
- **Sanitization & Validation**: All incoming requests strictly validated using Zod schemas.

---

## 📄 License
This project is licensed under the MIT License. Built for demonstration and educational purposes.


## Interview build and verified scope

Use [INTERVIEW_GUIDE.md](INTERVIEW_GUIDE.md) for the demonstration and [AUDIT_IMPLEMENTATION.md](AUDIT_IMPLEMENTATION.md) for the feature checklist, limitations and release evidence. Start from the website's interview-sandbox button for an isolated account with virtual funds. All trades are simulations.

The current backend runs Express, PostgreSQL/Prisma, Groq for hosted inference and Yahoo Finance for the interview deployment's quotes and daily history. Docker uses Node 22 and lockfile-based dependency installation. Email delivery is optional and deliberately disabled for this interview setup.

For an existing database without Prisma migration history, the audit's two additive tables can be applied with `node -r tsconfig-paths/register scripts/applyAuditMigration.cjs` after compiling the backend. Do not run `migrate reset` against an existing deployment. New clean development databases can use the normal Prisma migration workflow.
