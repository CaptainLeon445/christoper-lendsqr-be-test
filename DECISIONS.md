# Demo Credit Wallet Service — Technical Decisions & Implementation Notes

> This document records every significant technical decision made during implementation, the reasoning behind each choice, and where applicable the trade-offs that were considered and rejected. It is intended as a reference for reviewers and future contributors.

---

## 1. Database: SQLite instead of MySQL

### Decision
Switched the database layer from MySQL to SQLite.

### Reasoning
The original setup required a running MySQL server, a created database, a user with grants, and correct `.env` credentials before the app could start at all. This creates unnecessary friction for:
- Reviewers evaluating the codebase
- CI pipelines that don't provision a database service
- Any developer cloning the repo for the first time

SQLite is file-based and serverless. Sequelize creates the database file automatically on first boot; no external process, no credentials, no setup script. The app just works.

### How it was done
1. Installed `sqlite3` (the native Node.js binding Sequelize requires for SQLite dialect).
2. Changed `src/config/database.ts`: replaced `dialect: "mysql"` with `dialect: "sqlite"` and replaced the `host / port / username / password` options with a single `storage` path.
3. Simplified `src/config/index.ts`: removed `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` and replaced them with a single `DB_STORAGE` variable that defaults to `./data/demo_credit.sqlite`.
4. Removed the connection pool configuration — SQLite is an in-process library, not a network server, so connection pooling does not apply.
5. Updated `.env.example` and `README.md` to document the new variable.
6. Added `data/*.sqlite` to `.gitignore` so the database file is never committed.

### Production upgrade path
Because Sequelize abstracts the dialect, switching to MySQL or PostgreSQL for production is a one-line change in `database.ts` plus the appropriate driver package. The service layer, repositories, and models need no modification.

### Trade-off acknowledged
SQLite does not support concurrent writes from multiple Node processes (e.g., a cluster). For an MVP / assessment this is not a concern. A production deployment would use MySQL or PostgreSQL.

---

## 2. ENUM columns replaced with VARCHAR(20)

### Decision
`type` and `status` columns in the `transactions` table are stored as `VARCHAR(20)` (Sequelize `DataTypes.STRING(20)`) instead of `DataTypes.ENUM`.

### Reasoning
SQLite has no native `ENUM` type. Sequelize v6 maps `DataTypes.ENUM` to a `TEXT` column with a `CHECK` constraint in SQLite, but this behaviour is undocumented and the constraint is silently dropped on some Sequelize versions, leaving the column completely unconstrained. Using explicit `STRING` with a `validate: { isIn: [[...]] }` Sequelize validator is:
- Explicit about where validation occurs (application layer, not DB layer)
- Consistent across all dialects
- Free of silent failures

The TypeScript enum values (`TransactionType`, `TransactionStatus`) enforce correctness at compile time; the Sequelize `isIn` validator enforces it at runtime. For a production MySQL migration, changing `STRING(20)` back to `ENUM` is a single-field change.

---

## 3. Swagger / OpenAPI 3.0 documentation

### Decision
Added interactive API documentation using `swagger-jsdoc` and `swagger-ui-express`, mounted at `/api-docs`.

### Reasoning
Without documentation, an evaluator or API consumer must read source files to understand request shapes, authentication requirements, and response structures. A live Swagger UI lets anyone explore, authorise, and execute every endpoint from a browser with zero tooling.

### How it was done
1. Created `src/config/swagger.ts` — a single file that contains the entire OpenAPI 3.0 spec as a JavaScript object passed to `swaggerJsdoc`. Using an inline spec (rather than JSDoc annotations scattered across route files) keeps the documentation co-located in one place, easy to review, and easy to update when contracts change.
2. Defined shared schemas (`User`, `Wallet`, `Transaction`, `AuthResult`, `ApiResponse`, `ErrorResponse`) under `components/schemas` so they are referenced by `$ref` rather than duplicated per endpoint.
3. Defined a `BearerAuth` security scheme and applied `security: [{ BearerAuth: [] }]` to every authenticated route. The UI's **Authorize** button accepts a JWT and sends it automatically in subsequent requests.
4. Mounted the UI in `src/app.ts` **before** the API routes but **after** the rate-limiter so docs are also rate-limited.
5. Added `GET /api-docs.json` to expose the raw spec — useful for importing into Postman, Insomnia, or generating client SDKs.

### Why inline spec over JSDoc annotations?
JSDoc annotations (`@swagger` / `@openapi` comments above route handlers) scatter documentation across many files. This makes it harder to see the full API surface at a glance, and comments can drift out of sync with code. An inline spec in one config file is a single source of truth that can be reviewed and updated atomically.

### `persistAuthorization: true`
The Swagger UI option `persistAuthorization` keeps the JWT in `localStorage` so it survives page refreshes during a development session. This is a developer convenience only and has no effect on the API itself.

---

## 4. Sequelize `sync()` instead of migrations at startup

### Decision
The server calls `Database.sync()` on startup rather than running migration scripts.

### Reasoning (pre-existing, documented here for completeness)
`sync()` inspects the model definitions and creates or alters tables to match — no extra CLI tool, no migration runner, no ordering concerns. For an MVP where the schema is still being defined, this is the fastest path to a working database.

The migration scripts in `src/migrations/` exist for production use where `sync({ force: true })` would be destructive and `sync({ alter: true })` is risky on large datasets. They can be run via `sequelize-cli` when the service is deployed to staging or production.

---

## 5. Layered architecture (pre-existing, retained)

### Controller → Service → Repository → Model

| Layer | Responsibility |
|---|---|
| Controller | Parse HTTP request, call service, format HTTP response |
| Service | Business rules, transactions, orchestration |
| Repository | Data access, Sequelize queries |
| Model | Schema definition, associations |

Each layer depends only on the interface of the layer below it (via Inversify injection), never on a concrete implementation. This makes unit testing each layer in isolation straightforward — the test suite for `WalletService`, for example, mocks `IWalletRepository` without touching a database.

---

## 6. Inversify dependency injection (pre-existing, retained)

All services, repositories, and controllers are bound in `src/containers/index.ts`. Route files resolve instances from the container at module load time. This means:
- No `new` calls in business logic
- Interfaces can be swapped (e.g., stub repositories in tests) by rebinding in the container
- The container documents the full dependency graph in one place

---

## 7. Financial precision

`balance` and `amount` columns use `DataTypes.DECIMAL(15, 2)`. Sequelize returns DECIMAL values as strings from the database driver to avoid JavaScript floating-point rounding errors. The service layer coerces to `Number` when doing comparisons (`Number(wallet.balance) < amount`). For a production financial system this should use a decimal library (e.g., `decimal.js`) throughout — left as a known limitation for the MVP.

---

## 8. Race-condition prevention on debit

`WalletRepository.debitBalance` issues an `UPDATE wallets SET balance = balance - :amount WHERE id = :id AND balance >= :amount`. The `WHERE balance >= amount` clause is evaluated atomically inside the database transaction. If two concurrent withdrawals race, only the one whose SQL executes while the balance is still sufficient will succeed; the other will update zero rows and throw `InsufficientFundsError`. This avoids an application-level check-then-act race without requiring advisory locks.

---

## 9. PII-safe logging (pre-existing, retained)

Winston is configured with a custom format that redacts:
- Email addresses (regex)
- Passwords, tokens, secrets (key-name matching)
- Card numbers, phone numbers (regex)

The request logger middleware also redacts sensitive body fields (`password`, `token`, `authorization`) before writing to the log. This means log output is safe to ship to centralised logging infrastructure without pre-filtering.

---

## Summary of files changed in this session

| File | Change |
|---|---|
| `src/config/database.ts` | Switched dialect from MySQL to SQLite; removed host/port/pool config |
| `src/config/index.ts` | Replaced five `DB_*` vars with single `DB_STORAGE` |
| `src/config/swagger.ts` | **New** — full OpenAPI 3.0 spec |
| `src/app.ts` | Mounted Swagger UI at `/api-docs` and raw spec at `/api-docs.json` |
| `src/models/Transaction.ts` | Replaced `DataTypes.ENUM` with `DataTypes.STRING(20)` + `isIn` validator |
| `src/migrations/001-create-tables.ts` | Same ENUM → STRING change for consistency |
| `.env.example` | Replaced MySQL vars with `DB_STORAGE` |
| `.gitignore` | Added `data/*.sqlite` |
| `README.md` | Updated stack description, env vars table, added Swagger UI section |
| `package.json` | Added `sqlite3`, `swagger-jsdoc`, `swagger-ui-express` (+ `@types/*`) |
