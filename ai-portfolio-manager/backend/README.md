# Quantro — Backend API & Authentication Service

> Production-grade Node.js / Express REST API and authentication service for the **Quantro** AI-powered stock portfolio manager. Built with TypeScript, Prisma ORM, PostgreSQL, and strict JWT rotation.

🔗 **Parent Project & Live Demo:** [quantro-landing.vercel.app](https://quantro-landing.vercel.app)  
📦 **Repository:** [github.com/harshith-murali/Quantro-AI-Portfolio-Manager](https://github.com/harshith-murali/Quantro-AI-Portfolio-Manager)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (v18+) + TypeScript (strict mode) |
| **Framework** | Express.js |
| **ORM** | Prisma ORM |
| **Database** | PostgreSQL 16+ |
| **Authentication** | HS256 JWT (Access + HttpOnly Refresh Token) |
| **Security** | bcrypt (workload 12), Helmet, CORS whitelist |
| **Validation** | Zod schema validation |
| **Logging** | Winston (structured error and combined logs) |
| **Containers** | Docker & Docker Compose |

---

## 📂 Project Structure

```text
backend/
├── src/
│   ├── config/           # Zod-validated environment config & Prisma singleton
│   ├── types/            # Auth types & Express request user extensions
│   ├── utils/            # Custom AppError, ApiResponse, logger, jwt, hash
│   ├── validators/       # Zod schemas for register, login, and trade inputs
│   ├── middlewares/      # verifyAccessToken, verifyAdmin, asyncHandler,
│   │                     # errorHandler, rateLimiter, requestLogger
│   ├── services/         # auth.service.ts, token.service.ts, portfolio.service.ts
│   ├── controllers/      # auth.controller.ts, portfolio.controller.ts
│   ├── routes/           # auth.routes.ts, portfolio.routes.ts, index.ts
│   └── server.ts         # Server bootstrap, middleware pipeline & graceful shutdown
├── prisma/
│   ├── schema.prisma     # Relational schema (Users, Wallets, Trades, RefreshTokens)
│   └── seed.ts           # Demo users & stock seeds
├── Dockerfile            # Container build specification
└── docker-compose.yml    # Local PostgreSQL & Redis stack
```

---

## 🚀 Quick Start

### 1. Installation

```bash
cd ai-portfolio-manager/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
PORT=8080
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_portfolio_db"
ACCESS_TOKEN_SECRET="generate-with-openssl-rand-base64-64"
REFRESH_TOKEN_SECRET="generate-with-openssl-rand-base64-64"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"
CORS_ORIGIN="http://localhost:3000"
```

### 3. Spin up PostgreSQL (Optional Docker)

```bash
docker compose up -d
```

### 4. Run Migrations & Seed Database

```bash
npm run db:migrate
npm run db:seed
```

Seeded credentials for testing:
- **Regular User**: `user@quantro.dev` / `Quantro@Secure123!`
- **Admin**: `admin@quantro.dev` / `Quantro@Secure123!`

### 5. Start Development Server

```bash
npm run dev
# Server listening at http://localhost:8080
```

---

## 📡 API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new account |
| `POST` | `/api/auth/login` | Public | Login and receive JWT access + refresh tokens |
| `POST` | `/api/auth/logout` | Bearer | Revoke refresh token & invalidate active session |
| `POST` | `/api/auth/refresh` | Cookie | Rotate refresh token and issue new access token |
| `GET` | `/api/auth/me` | Bearer | Retrieve profile of authenticated user |
| `GET` | `/api/health` | Public | Service health & database connectivity check |
| `GET` | `/api/portfolio` | Bearer | Retrieve current user's portfolio and holdings |
| `POST` | `/api/portfolio/trade` | Bearer | Execute buy/sell simulation inside transaction |
| `GET` | `/api/admin/users` | Bearer + ADMIN | Manage registered user accounts |

---

## 🔒 Security Design

| Feature | Implementation Detail |
|---|---|
| **Access Token** | Short-lived (15 min) HS256 JWT passed in `Authorization: Bearer` |
| **Refresh Token** | 7-day HS256 JWT stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookie |
| **Token Storage** | SHA-256 cryptographic hash persisted in database; raw token never stored |
| **Token Rotation** | Fresh refresh token issued upon every invocation of `/refresh`; prior token revoked |
| **Reuse Detection** | Presenting an already-revoked refresh token revokes all active sessions for that user |
| **Password Hash** | bcrypt with work factor cost 12 |
| **Atomic Operations** | Balance updates and trade allocations wrapped in PostgreSQL transactions |
| **Input Validation** | Runtime validation via Zod; invalid requests rejected before business logic |

---

## 📜 Available Scripts

```bash
npm run dev          # Start local dev server (ts-node-dev / nodemon)
npm run build        # Compile TypeScript to dist/
npm run start        # Run production build from dist/
npm run lint         # Run TypeScript typecheck without emitting files
npm run db:migrate   # Apply pending Prisma migrations
npm run db:generate  # Regenerate Prisma Client types
npm run db:seed      # Seed test accounts and initial data
npm run db:studio    # Open Prisma Studio web GUI
```

---

## 📄 License
MIT License. Built for Quantro Portfolio Manager.
