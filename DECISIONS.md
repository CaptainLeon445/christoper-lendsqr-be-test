# User Flow & Backend Decisions

## User Flow

### 1. Registration
A new user submits their name, email, and password. Before the account is created, the email is checked against the **Lendsqr Adjutor Karma blacklist**. If the email is flagged, registration is rejected with a `403`. If clean, the password is hashed with PBKDF2, the user record is saved, and a wallet with a zero balance is automatically created alongside it. A JWT token is returned immediately so the user does not need to log in separately after registering.

### 2. Login
The user submits their email and password. The stored PBKDF2 hash is verified. On success, a signed JWT (24-hour expiry by default) is returned. All subsequent requests include this token in the `Authorization: Bearer` header.

### 3. Funding a Wallet
The authenticated user sends an amount. The backend credits their wallet inside a database transaction and records a `FUNDING` transaction entry. The transaction record is returned as the response.

### 4. Transferring Funds
The user supplies a recipient email and an amount. The backend:
1. Confirms the sender has sufficient balance
2. Resolves the recipient by email and finds their wallet
3. Inside a single database transaction: debits the sender, credits the recipient, and writes two transaction records (one debit for the sender, one credit for the recipient sharing the same reference)

If the balance check passes but the database write fails, the transaction rolls back atomically — neither wallet is affected.

### 5. Withdrawing Funds
The user supplies an amount. The backend debits the wallet and records a `WITHDRAWAL` transaction, again inside an atomic transaction.

### 6. Viewing Balance & History
Two read-only endpoints: one returns the wallet object (including current balance), the other returns all transactions for that wallet ordered newest-first.

---

## Backend Decisions

### Layered Architecture (Controller → Service → Repository → Model)
Each layer has one job. Controllers only parse HTTP and format responses. Services own all business rules. Repositories own all database queries. This means business logic can be unit-tested without a database, and the database layer can be swapped without touching services.

### Dependency Injection (Inversify)
All classes are wired through an IoC container rather than instantiated with `new`. This makes it trivial to swap a real repository for a mock in tests, and keeps the dependency graph explicit and auditable in one file (`containers/index.ts`).

### Atomic Transactions for All Wallet Mutations
Every operation that changes a balance (fund, transfer, withdraw) runs inside a Sequelize managed transaction. The debit query includes a `WHERE balance >= amount` clause evaluated atomically by SQLite, which prevents a race condition where two concurrent withdrawals both pass the balance check before either commits.

### SQLite for Zero-Config Deployment
The original MySQL setup required a running server, a created database, and correct credentials before the app could start. SQLite is file-based — Sequelize creates the database on first boot with no external dependencies. The Sequelize dialect abstraction means switching to MySQL or PostgreSQL for production is a one-line change with no service-layer impact.

### JWT Authentication
Stateless token auth. The server signs a payload containing `userId` and `email`; no session store is needed. The `authMiddleware` verifies the signature and attaches the decoded payload to the request so downstream handlers never re-query the user table just to identify the caller.

### Karma Blacklist Check at Registration Only
The blacklist check happens once — at the point the account is created. Checking it on every login would add latency and an external API dependency to the critical auth path. If a user is added to the blacklist after registration, that is an operational concern handled outside this service.

### PII-Safe Logging
Winston is configured to redact emails, passwords, tokens, and card patterns from all log output before it is written. This means logs can be shipped to any centralised log aggregator without a pre-filtering step, and there is no risk of credentials appearing in dashboards or alerts.
