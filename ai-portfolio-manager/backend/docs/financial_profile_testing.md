# Financial Profile Module — Architecture & API Guide

The Financial Profile module allows retail investors to submit their financial numbers and safely calculate their dynamic investable capacity.

---

## 🏗️ Folder Structure & Connection Flow

The files are integrated cleanly into the existing modular architectural skeleton:

1.  **DB Schema**: `prisma/schema.prisma`  
    👉 Defines the `FinancialProfile` table (using standard `Decimal(15, 2)` constraints for precision) and links it **1-to-1** with the `User` model.
    
2.  **Input Validation**: `src/validators/profile.validator.ts`  
    👉 Runs standard **Zod validation** checks on client requests. Ensures numbers are non-negative and maps lowercase risk string levels (low, medium, high) into their canonical database format (`LOW`, `MEDIUM`, `HIGH`).

3.  **Service Layer**: `src/services/profile.service.ts`  
    👉 House of pure business logic. Calculates the safe investable capacity applying the **20% emergency buffer** constraint (`Math.max(0, income - expenses - buffer)`), and communicates safely with PostgreSQL.

4.  **Controller Layer**: `src/controllers/profile.controller.ts`  
    👉 Orchestrates the HTTP layer. Extracts `req.user.id` securely populated by our JWT middleware and ensures proper REST status codes (201, 200, 404, etc.).

5.  **Routes**: `src/routes/profile.routes.ts` & `src/routes/index.ts`  
    👉 Groups endpoints and locks them globally behind `verifyAccessTokenMiddleware`, completely insulating user accounts from cross-access.

---

## ⚙️ Business Logic Mechanics

Calculates how much capital is safely usable for stock investing.
*   **Input**: `monthly_income`, `monthly_expenses`
*   **Constraint**: `emergency_buffer = 20% of monthly_income`
*   **Math**: `investable_amount = monthly_income - monthly_expenses - emergency_buffer`
*   **Safety Catch**: If math generates a negative value (user overspending), database saves **0.00**.

---

## 🧪 Postman & cURL Endpoint Examples

### Base Pre-requisite
Ensure you include your `Authorization: Bearer <JWT_TOKEN>` header on every call!

### 1. Create Profile (POST)
Creates the profile for the logged-in account.

*   **Endpoint**: `POST /api/financial-profile`
*   **Payload**:
    ```json
    {
      "monthly_income": 5000.00,
      "monthly_expenses": 2000.00,
      "current_savings": 15000.00,
      "financial_goal": "Downpayment for a condo and retirement",
      "risk_appetite": "medium"
    }
    ```
*   **Calculation Math Behind-the-Scenes**:
    *   `Income` = 5,000
    *   `Expenses` = 2,000
    *   `Buffer (20%)` = 1,000
    *   `Result` = 5000 - 2000 - 1000 = **2000.00**
*   **Expected Output (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Financial profile created successfully",
      "data": {
        "profile": {
          "id": "clyp...",
          "userId": "clyo...",
          "monthlyIncome": "5000",
          "monthlyExpenses": "2000",
          "currentSavings": "15000",
          "financialGoal": "Downpayment for a condo and retirement",
          "riskAppetite": "MEDIUM",
          "investableAmount": "2000",
          "createdAt": "2026-05-14T13:00:00.000Z",
          "updatedAt": "2026-05-14T13:00:00.000Z"
        }
      }
    }
    ```

### 2. Get My Profile (GET)
Retrieves the currently authenticated user's financials.

*   **Endpoint**: `GET /api/financial-profile/me`
*   **Expected Output (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Financial profile retrieved successfully",
      "data": {
        "profile": { ... }
      }
    }
    ```

### 3. Update & Recalculate (PUT)
Overwrites previous numbers and recalculates new investment capacities instantly.

*   **Endpoint**: `PUT /api/financial-profile/me`
*   **Payload (Upgraded Income)**:
    ```json
    {
      "monthly_income": 10000,
      "monthly_expenses": 3000,
      "current_savings": 25000,
      "financial_goal": "Aggressive wealth creation",
      "risk_appetite": "high"
    }
    ```
*   **Recalculation**:
    *   `Income` = 10,000
    *   `Expenses` = 3,000
    *   `Buffer` = 2,000
    *   `New Capacity` = 10000 - 3000 - 2000 = **5000.00**
*   **Expected Output (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Financial profile updated and recalculated successfully",
      "data": {
        "profile": {
          "investableAmount": "5000.00",
          ...
        }
      }
    }
    ```

---

## 💡 Common Error Scenarios

| Action | Status Code | Return JSON payload |
| :--- | :--- | :--- |
| Negative numbers in payload | `422 Unprocessable Entity` | `{"success": false, "errors": {"monthly_income": ["Monthly income must be >= 0"]}}` |
| Creating twice (duplicate profile) | `409 Conflict` | `{"success": false, "message": "Financial profile already exists. Use PUT /me to update."}` |
| Invalid appetite ("ultra") | `422 Unprocessable Entity` | `{"success": false, "errors": {"risk_appetite": ["Risk appetite must be low, medium, or high"]}}` |
| GET before creating profile | `404 Not Found` | `{"success": false, "message": "Financial profile not found"}` |
