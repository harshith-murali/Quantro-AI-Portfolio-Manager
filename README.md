<p align="center">
  <img src="https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge" />
</p>

# Quantro — AI Portfolio Manager

> An intelligent, full-stack stock portfolio platform that helps beginner investors understand how much they can safely invest, explore AI-driven stock recommendations, simulate trades, run backtests, and monitor their portfolio — all in a stunning, premium dark-mode interface.

---

## Key Features

### Smart Dashboard
- **Portfolio vs NIFTY 50** real-time comparison chart
- KPI cards showing total value, P&L, day change, and win rate
- Sector-wise allocation donut chart
- Animated search bar with stock suggestions dropdown

### AI Advisor
- Natural language chat interface powered by AI
- Personalized investment advice based on risk profile
- Explains complex signals in simple terms

### Signal Engine
- AI-generated BUY / HOLD / SELL signals for 50+ NSE stocks
- Technical indicators: RSI, MACD, SMA crossovers
- Suitability scoring (0–100) based on user risk profile
- Per-stock signal detail page with full technical breakdown

### Portfolio Management
- Real-time portfolio tracking with holdings breakdown
- **Trade simulation** with interactive Buy/Sell modals
- **Platform fee**: 0.1% or ₹20 minimum (whichever is higher)
- Trade history ledger with **Excel (.xlsx) export**
- Fee transparency — every trade shows subtotal, fee, and total

### AI Watchlist
- Add stocks for continuous AI monitoring
- Status indicators: All Clear, Watch, Action Needed
- AI-generated notes explaining each alert
- One-click add from search dropdown

### Backtesting Engine
- SMA Crossover strategy simulation on historical NSE data
- **5 free backtests**, then ₹49/run premium pricing
- Equity curve, drawdown chart, monthly returns heatmap
- Strategy vs Buy & Hold benchmark comparison
- Full trade table, Sharpe ratio, CAGR, win rate metrics

### Wallet System
- Virtual wallet with deposit/withdraw functionality
- Transaction history with running balance
- Supports trade execution from wallet balance

### Smart Search
- Global search dropdown in navbar with **45+ Indian stocks**
- Shows trending stocks by sector on focus
- Real-time filtering by symbol or company name
- Day change % indicators on every result

---

## Tech Stack

| Layer        | Technology                                              |
|-------------|--------------------------------------------------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS         |
| **Charts**   | Recharts (Area, Line, Bar, Pie, Composed)               |
| **Animations** | Framer Motion, CSS transitions                        |
| **Backend**  | Node.js, Express, Prisma ORM                            |
| **Database** | PostgreSQL 18                                           |
| **Auth**     | JWT (access + refresh tokens), bcrypt                   |
| **Export**   | SheetJS (xlsx) for Excel report generation              |
| **State**    | Zustand (with persistence)                              |

---

## Project Structure

```
ai-portfolio-manager/
├── README.md                    # This file
├── backend/                     # Express API server
│   ├── src/
│   │   ├── server.ts            # App bootstrap & routes
│   │   ├── routes/              # Auth, portfolio, signals, backtest
│   │   ├── services/            # Business logic
│   │   └── middleware/          # JWT auth middleware
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   └── .env                     # DB connection & JWT secrets
├── quantro-landing/             # Next.js frontend
│   ├── src/
│   │   ├── app/                 # Pages (App Router)
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── signals/         # Signal list + [symbol] detail
│   │   │   ├── portfolio/       # Portfolio + trade history
│   │   │   ├── watchlist/       # AI watchlist
│   │   │   ├── backtest/        # Backtesting engine
│   │   │   ├── wallet/          # Wallet management
│   │   │   ├── ai/              # AI advisor chat
│   │   │   ├── profile/         # User profile
│   │   │   └── auth/            # Login & register
│   │   ├── components/          # Shared UI components
│   │   │   ├── Navbar.tsx       # Global nav with search dropdown
│   │   │   ├── FeatureShowcase  # Landing page showcase
│   │   │   └── dashboard/       # Dashboard-specific components
│   │   └── lib/                 # Utilities
│   │       ├── api.ts           # API client
│   │       ├── store.ts         # Zustand state management
│   │       ├── stockData.ts     # 45+ stock database
│   │       ├── types.ts         # TypeScript interfaces
│   │       └── validations.ts   # Zod schemas
│   └── .env                     # API URL config
```

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** or **yarn**

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/ai-portfolio-manager.git
cd ai-portfolio-manager
```

### 2. Setup the database
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE ai_portfolio_db;"
```

### 3. Configure environment variables

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://postgres:1234@localhost:5432/ai_portfolio_db"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3001
```

**Frontend** (`quantro-landing/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Install dependencies & start

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend (new terminal)
cd quantro-landing
npm install
npm run dev
```

### 5. Open the app
Navigate to **http://localhost:3000** and register a new account.

---

## API Endpoints

| Method | Endpoint                  | Description                        | Auth |
|--------|---------------------------|------------------------------------|------|
| POST   | `/api/auth/register`       | Create new user account            | No   |
| POST   | `/api/auth/login`          | Login & get tokens                 | No   |
| POST   | `/api/auth/refresh`        | Refresh access token               | Yes  |
| GET    | `/api/auth/me`             | Get current user profile           | Yes  |
| POST   | `/api/auth/logout`         | Invalidate tokens                  | Yes  |
| GET    | `/api/signals`             | Get AI stock signals               | Yes  |
| GET    | `/api/signals/:symbol`     | Get detailed signal for a stock    | Yes  |
| GET    | `/api/portfolio`           | Get portfolio snapshot             | Yes  |
| POST   | `/api/portfolio/trade`     | Execute a trade (buy/sell)         | Yes  |
| POST   | `/api/backtest`            | Run a backtest simulation          | Yes  |
| GET    | `/api/wallet`              | Get wallet balance & transactions  | Yes  |
| POST   | `/api/wallet/deposit`      | Add funds to wallet                | Yes  |
| POST   | `/api/wallet/withdraw`     | Withdraw funds from wallet         | Yes  |

---

## Design Principles

- **Frontend-first**: Built to look & feel like a real product, not a school project
- **Dark mode only**: High-contrast, premium quantro aesthetic with gold accents
- **Glass morphism**: Frosted glass panels with subtle borders and backdrop blur
- **Micro-animations**: Framer Motion for smooth page transitions and interactive feedback
- **Data-dense**: Professional-grade charts and tables that show real metrics
- **Mobile-responsive**: Adaptive layouts for all screen sizes

---

## Security

- JWT-based authentication with access + refresh token rotation
- Passwords hashed with bcrypt (12 rounds)
- Protected API routes via middleware
- HTTP-only considerations for production deployment

---

## Roadmap

- [x] Dashboard with portfolio vs NIFTY chart
- [x] AI signal engine with technical indicators
- [x] Trade simulation with platform fees
- [x] Backtesting with freemium pricing
- [x] Excel ledger export
- [x] AI Watchlist with monitoring alerts
- [x] Smart search dropdown with 45+ stocks
- [ ] Real-time WebSocket price updates
- [ ] Options chain analysis
- [ ] Multi-strategy backtesting
- [ ] Push notifications for watchlist alerts

---

## License

This project is built for educational and demonstration purposes.

---

<p align="center">
  <sub>Built for the AI Portfolio Hackathon</sub>
</p>
