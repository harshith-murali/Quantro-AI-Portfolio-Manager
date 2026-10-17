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

---

## 🌟 Key Features

### 📊 Smart Dashboard
- **Portfolio vs NIFTY 50** real-time comparison chart with performance differential
- Key KPI cards: Total Value, P&L (₹ and %), Day Change, and Win Rate
- Sector-wise allocation donut chart (IT, Financials, Energy, Auto, FMCG)
- Animated search bar with instant stock suggestions and day-change badges

### 🤖 AI Financial Advisor
- Natural language chat interface grounded in the user's current portfolio holdings and risk profile
- Multi-agent architecture with private VPC / Hugging Face inference endpoints
- Redis token-bucket rate limiters protecting against prompt injection and quota exhaustion
- Translates technical signals and macro trends into actionable advice

### ⚡ Signal Engine
- Technical BUY / HOLD / SELL signals for 50+ NSE stocks
- Real-time technical indicators: 20/50 SMA crossovers, RSI(14), and MACD histogram
- Dynamic suitability scoring (0–100) based on investor risk profile (Conservative, Moderate, Aggressive)
- Per-stock technical breakdown detail view with interactive charts

### 💼 Portfolio Management & Trade Simulation
- Real-time holding allocations with live profit/loss computation
- **Trade simulation** with interactive Buy/Sell modals backed by PostgreSQL transactions
- **Transparent fee model**: 0.1% or ₹20 minimum per executed trade
- Complete transaction ledger with one-click **Excel (.xlsx)** export via SheetJS
- Atomic cash wallet deduction: balance rollback if funds are insufficient

### 📈 Deterministic Backtesting Engine
- SMA Crossover strategy simulation executed over chronological OHLCV historical series
- Configurable short/long moving average windows (e.g., 20/50 days) and starting capital
- Visualizations: Equity curve, drawdown chart, and monthly returns heatmap
- Strategy vs Buy & Hold benchmark comparison
- Key quantitative metrics: CAGR, Sharpe Ratio, Win Rate, and Maximum Drawdown (MDD)
- Freemium model: 5 complimentary backtests, then pay-per-run

### 🔄 Agentic EOD Data Ingestion Pipeline
- Scheduled automated workflow executing at 5:30 PM IST (post-NSE market close)
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
| **Compute & Pipeline** | AWS Lambda, GitHub Actions automated cron |
| **Data Lake** | AWS S3 (Historical OHLCV CSV archives) |
| **Caching & Limits** | Redis (token bucket rate limiting & query caching) |
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
- **Node.js** ≥ 18.x
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
```

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
- **Session Revocation & Reuse Detection**: Refresh tokens are cryptographically hashed (SHA-256) in PostgreSQL. If a revoked token is reused, all active sessions for that user are immediately invalidated.
- **Password Security**: Passwords hashed with bcrypt using a workload factor of 12.
- **Data Integrity**: Financial ledger transactions and virtual trades execute within isolated PostgreSQL transactions (`prisma.$transaction`) to prevent partial balance updates.
- **Sanitization & Validation**: All incoming requests strictly validated using Zod schemas.

---

## 📄 License
This project is licensed under the MIT License. Built for demonstration and educational purposes.
