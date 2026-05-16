# Quantro Auth Backend

Production-grade JWT authentication backend for the Quantro AI-powered stock portfolio manager.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript (strict) |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken) |
| Password | bcrypt (cost 12) |
| Validation | Zod |
| Logging | Winston |
| Containers | Docker + Docker Compose |

---

## Project Structure

```
src/
├── config/           # env.ts (Zod-validated), db.ts (Prisma singleton)
├── types/            # auth.types.ts, express.d.ts (req.user)
├── utils/            # AppError, ApiResponse, logger, jwt, hash
├── validators/       # Zod schemas for register & login
├── middlewares/      # verifyAccessToken, verifyAdmin, asyncHandler,
│                     # errorHandler, rateLimiter, requestLogger
├── services/         # auth.service.ts, token.service.ts
├── controllers/      # auth.controller.ts
├── routes/           # auth.routes.ts, index.ts
└── server.ts         # Express app factory + graceful shutdown
prisma/
├── schema.prisma
└── seed.ts
logs/                 # error.log, combined.log (auto-created)
docs/
└── postman.md        # Testing guide
```

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo>
cd fidelity-stock-manager
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL` — PostgreSQL connection string
- `ACCESS_TOKEN_SECRET` — at least 32 random chars
- `REFRESH_TOKEN_SECRET` — at least 32 random chars (different from access)

Generate secure secrets:
```bash
openssl rand -base64 64
```

### 3. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL on `5432` and Redis on `6379`.

### 4. Run database migrations

```bash
npm run db:migrate
# Enter a migration name, e.g. "init"
```

Generate Prisma client:
```bash
npm run db:generate
```

### 5. (Optional) Seed test data

```bash
npm run db:seed
```

Creates:
- `admin@quantro.dev` / `Quantro@Secure123!` (ADMIN)
- `user@quantro.dev` / `Quantro@Secure123!` (USER)

### 6. Start development server

```bash
npm run dev
```

Server starts at `http://localhost:8080`.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | — | Register new account |
| `POST` | `/api/auth/login` | — | Login, receive tokens |
| `POST` | `/api/auth/logout` | Bearer | Revoke session |
| `POST` | `/api/auth/refresh` | Cookie | Rotate tokens |
| `GET` | `/api/auth/me` | Bearer | Get profile |
| `GET` | `/api/health` | — | Health check |
| `GET` | `/api/portfolio` | Bearer | Example protected route |
| `GET` | `/api/admin/users` | Bearer + ADMIN | Example admin route |

Full request/response examples: [`docs/postman.md`](./docs/postman.md)

---

## Security Design

| Feature | Implementation |
|---------|---------------|
| Access token | HS256 JWT, 15-min TTL, `Authorization: Bearer` |
| Refresh token | HS256 JWT, 7-day TTL, HttpOnly + Secure + SameSite=Strict cookie |
| Token storage | SHA-256 hash stored in DB — raw JWT only in cookie |
| Token rotation | New refresh token on every `/refresh`, old revoked |
| Session invalidation | `tokenVersion` incremented on logout — invalidates all sessions |
| Reuse detection | Presenting a revoked token revokes **all** user sessions |
| Password hashing | bcrypt, cost factor 12 |
| Rate limiting | 10 req / 15 min on auth routes |
| Email enumeration | Same error for wrong email and wrong password |
| Input validation | Zod schemas with strong password policy |
| Env validation | Zod on startup — hard crash if vars missing |

---

## Available Scripts

```bash
npm run dev          # Start dev server (nodemon + ts-node)
npm run build        # Compile TypeScript → dist/
npm run start        # Run compiled output
npm run lint         # TypeScript type-check (no emit)
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Regenerate Prisma client
npm run db:seed      # Seed test users
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset DB and re-run migrations
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment |
| `PORT` | No | `8080` | Server port |
| `DATABASE_URL` | **Yes** | — | PostgreSQL URL |
| `ACCESS_TOKEN_SECRET` | **Yes** | — | Min 32 chars |
| `REFRESH_TOKEN_SECRET` | **Yes** | — | Min 32 chars |
| `ACCESS_TOKEN_EXPIRY` | No | `15m` | Access token TTL |
| `REFRESH_TOKEN_EXPIRY` | No | `7d` | Refresh token TTL |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Comma-separated allowed origins |
| `BCRYPT_ROUNDS` | No | `12` | bcrypt cost factor (10–14) |
