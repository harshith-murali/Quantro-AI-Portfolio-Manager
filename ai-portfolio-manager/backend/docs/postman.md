# FinTech Auth API — Postman Testing Guide

Base URL: `http://localhost:8080/api`

---

## 1. Register

**POST** `/auth/register`

```json
{
  "name": "Alice Finance",
  "email": "alice@fintech.dev",
  "password": "FinTech@Secure123!"
}
```

**Expected response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "clx...",
      "name": "Alice Finance",
      "email": "alice@fintech.dev",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGci..."
  }
}
```
> Refresh token is set as `rt` HttpOnly cookie on path `/api/auth`.

---

## 2. Login

**POST** `/auth/login`

```json
{
  "email": "alice@fintech.dev",
  "password": "FinTech@Secure123!"
}
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGci..."
  }
}
```

---

## 3. Get Profile (Protected)

**GET** `/auth/me`

Headers:
```
Authorization: Bearer <accessToken>
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "user": { "id": "...", "name": "Alice Finance", "email": "...", "role": "USER" }
  }
}
```

**Error (no token):**
```json
{ "success": false, "message": "Authorization header missing or malformed" }
```

---

## 4. Refresh Tokens

**POST** `/auth/refresh`

> No body needed — reads the `rt` cookie automatically.
> In Postman, enable **"Send cookies"** or use the Cookie Manager.

**Expected response (200):**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": { "accessToken": "eyJhbGci..." }
}
```

> New `rt` cookie is set. Old refresh token is revoked (rotation).

---

## 5. Logout

**POST** `/auth/logout`

Headers:
```
Authorization: Bearer <accessToken>
```

**Expected response (200):**
```json
{ "success": true, "message": "Logged out successfully", "data": null }
```

> Cookie is cleared. `tokenVersion` is incremented — all active sessions are invalidated.

---

## 6. Protected Portfolio Route (Example)

**GET** `/portfolio`

Headers:
```
Authorization: Bearer <accessToken>
```

---

## 7. Admin Route (Example)

**GET** `/admin/users`

Headers:
```
Authorization: Bearer <adminAccessToken>
```

> Must be logged in as a user with `role: ADMIN`. Seed users include `admin@fintech.dev`.

---

## Security Test Cases

| Test | Expected |
|------|----------|
| Login with wrong password | 401 `Invalid email or password` |
| Register with existing email | 409 `An account with this email already exists` |
| Weak password (no special char) | 422 Validation error |
| Access `/me` after logout | 401 `Session has been invalidated` |
| Replay old refresh token (after rotation) | 401 `Refresh token has been revoked` |
| Call admin route as USER | 403 `Administrator access required` |
| Exceed rate limit (>10 req/15min) | 429 `Too many requests` |
