# Demo Credit Wallet Service

MVP wallet service for the Demo Credit mobile lending application. Built with NodeJS, TypeScript, Express, Sequelize, and SQLite.

## Architecture

```
src/
├── config/          # App configuration and database setup
├── containers/      # Inversify DI container bindings
├── controllers/     # Request handlers (BaseController pattern)
├── middlewares/      # Auth, logging (PII-compliant), validation, error handling
├── models/          # Sequelize model definitions
├── migrations/      # Database migration scripts
├── repositories/    # Data access layer (Repository pattern)
├── routes/          # Express route definitions
├── services/        # Business logic layer
├── types/           # TypeScript interfaces, enums, DI symbols
└── utils/           # Logger, error classes, helpers
```

### Design Decisions

- **Layered Architecture**: Controller → Service → Repository → Model. Each layer has a single responsibility.
- **Dependency Injection**: Inversify container manages all class dependencies, enabling testability and loose coupling.
- **Repository Pattern**: Abstracts Sequelize queries behind interfaces. `BaseRepository` provides CRUD; specialized repos add domain-specific queries.
- **Transaction Scoping**: All wallet mutations (fund, transfer, withdraw) run inside Sequelize managed transactions. Debit uses `WHERE balance >= amount` to prevent race conditions at the database level.
- **PII Compliance**: Winston logger strips emails, phone numbers, card numbers, passwords, and tokens from all log output. Request logger middleware redacts sensitive body fields before logging.
- **Faux Auth**: JWT-based token authentication. Passwords hashed with PBKDF2 (salt + 10k iterations).
- **Karma Blacklist**: Adjutor API integration checks email against Lendsqr blacklist during registration. Users on the blacklist are rejected with 403.
- **SQLite over MySQL**: Development and evaluation use SQLite — zero-config, file-based, no server required. Sequelize's dialect abstraction means a production switch to MySQL/PostgreSQL requires only a one-line config change (see [Database section](#database)).

## E-R Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────┐
│     users        │       │     wallets      │       │    transactions     │
├─────────────────┤       ├─────────────────┤       ├─────────────────────┤
│ id (PK, UUID)   │──1:1──│ id (PK, UUID)   │──1:N──│ id (PK, UUID)       │
│ email (UNIQUE)  │       │ user_id (FK, UQ) │       │ wallet_id (FK)      │
│ first_name      │       │ balance DECIMAL  │       │ type VARCHAR(20)    │
│ last_name       │       │ created_at       │       │ amount DECIMAL      │
│ password         │       │ updated_at       │       │ status VARCHAR(20)  │
│ created_at      │       └─────────────────┘       │ reference (UNIQUE)  │
│ updated_at      │                                  │ narration           │
└─────────────────┘                                  │ counterparty_wallet │
                                                     │   _id (FK, NULL)    │
                                                     │ created_at          │
                                                     │ updated_at          │
                                                     └─────────────────────┘
```

**Relationships:**
- `users` 1:1 `wallets` — each user has exactly one wallet
- `wallets` 1:N `transactions` — each wallet has many transactions
- `transactions.counterparty_wallet_id` — nullable FK to `wallets` for transfer records

## API Endpoints

| Method | Endpoint                     | Auth | Description              |
|--------|------------------------------|------|--------------------------|
| POST   | `/api/v1/auth/register`      | No   | Create account           |
| POST   | `/api/v1/auth/login`         | No   | Login, receive token     |
| GET    | `/api/v1/users/profile`      | Yes  | Get user profile         |
| GET    | `/api/v1/wallet/balance`     | Yes  | Get wallet balance       |
| POST   | `/api/v1/wallet/fund`        | Yes  | Fund wallet              |
| POST   | `/api/v1/wallet/transfer`    | Yes  | Transfer to another user |
| POST   | `/api/v1/wallet/withdraw`    | Yes  | Withdraw from wallet     |
| GET    | `/api/v1/wallet/transactions`| Yes  | Transaction history      |
| GET    | `/health`                    | No   | Health check             |

### Interactive API Docs (Swagger UI)

Once the server is running, open **http://localhost:3000/api-docs** in your browser for the full interactive Swagger UI. The raw OpenAPI JSON is available at `GET /api-docs.json`.

Click **Authorize** and paste your JWT (obtained from `/auth/login` or `/auth/register`) to unlock authenticated endpoints directly in the browser.

## Setup

```bash
# Install dependencies
make install

# Copy env and configure
cp .env.example .env

# Run in development (tables auto-created on first start via sequelize.sync())
make dev

# Build for production
make build

# Run tests
make test

# Run unit tests only
make test-unit
```

> **No database server needed.** The SQLite file is created automatically at `./data/demo_credit.sqlite` on first start.

## Database

The app uses **SQLite** via Sequelize. Tables are created automatically by `sequelize.sync()` at startup — no manual migration step needed for development.

**Switching to MySQL/PostgreSQL for production:**
1. Install the driver: `npm install mysql2` (already present) or `npm install pg pg-hstore`
2. In `src/config/database.ts`, change:
   ```ts
   dialect: "sqlite", storage: "..."
   // to:
   dialect: "mysql",  // or "postgres"
   host: ..., port: ..., database: ..., username: ..., password: ...
   ```
3. Update the `DB_*` env vars accordingly.

The migration scripts in `src/migrations/` can be run via `sequelize-cli` if you need reproducible schema management in staging/production.

## Environment Variables

| Variable          | Description                                      | Default                      |
|-------------------|--------------------------------------------------|------------------------------|
| `NODE_ENV`        | Environment (`development` / `production`)       | `development`                |
| `PORT`            | Server port                                      | `3000`                       |
| `DB_STORAGE`      | Path to the SQLite database file                 | `./data/demo_credit.sqlite`  |
| `JWT_SECRET`      | Secret for JWT signing                           | *(required in production)*   |
| `JWT_EXPIRY`      | Token lifetime (e.g., `24h`)                     | `24h`                        |
| `ADJUTOR_BASE_URL`| Lendsqr Adjutor API base URL                     | `https://adjutor.lendsqr.com/v2` |
| `ADJUTOR_API_KEY` | Adjutor API key                                  | *(required)*                 |
| `LOG_LEVEL`       | Winston log level                                | `info`                       |

## Request/Response Examples

### Register
```json
POST /api/v1/auth/register
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "securepassword"
}
```

### Fund Wallet
```json
POST /api/v1/wallet/fund
Authorization: Bearer <token>
{
  "amount": 5000.00
}
```

### Transfer
```json
POST /api/v1/wallet/transfer
Authorization: Bearer <token>
{
  "recipientEmail": "jane@example.com",
  "amount": 1000.00,
  "narration": "Payment for services"
}
```

### Withdraw
```json
POST /api/v1/wallet/withdraw
Authorization: Bearer <token>
{
  "amount": 2000.00
}
```

## Tech Stack

- **Runtime**: Node.js (LTS)
- **Language**: TypeScript
- **Framework**: Express
- **ORM**: Sequelize v6
- **Database**: SQLite (via `sqlite3`) — zero-config, file-based
- **API Docs**: swagger-jsdoc + swagger-ui-express (OpenAPI 3.0)
- **DI Container**: Inversify
- **Logging**: Winston (PII-compliant)
- **Testing**: Jest with ts-jest
- **Security**: Helmet, CORS, express-rate-limit
