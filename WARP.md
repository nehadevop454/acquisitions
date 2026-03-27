# Acquisitions API

A Node.js REST API backend built with Express 5, using Neon PostgreSQL (serverless) via Drizzle ORM. Implements JWT-based authentication with secure cookie delivery.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM, `"type": "module"`) |
| Framework | Express 5 |
| Database | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Validation | Zod v4 |
| Logging | Winston + Morgan |
| Security | Helmet, CORS, cookie-parser |
| Linting/Formatting | ESLint 10 + Prettier 3 |

## Project Structure

```
acquisitions/
├── src/
│   ├── index.js                  # Entry point — loads dotenv, imports server.js
│   ├── server.js                 # Binds Express app to PORT, logs startup
│   ├── app.js                    # Express app: middleware stack, routes, error handlers
│   ├── config/
│   │   ├── database.js           # Neon + Drizzle ORM connection (exports `db`, `sql`)
│   │   └── logger.js             # Winston logger (file + console transports)
│   ├── controllers/
│   │   └── auth.controller.js    # signup, signIn, signOut handlers
│   ├── middleware/
│   │   └── error.middleware.js   # notFound (404) + global errorHandler
│   ├── models/
│   │   └── user.model.js         # Drizzle `users` table schema
│   ├── routes/
│   │   └── auth.routes.js        # Auth route definitions (sign-up wired; sign-in/sign-out are stubs)
│   ├── services/
│   │   └── auth.service.js       # hashPassword, comparePassword, createUser, authenticateUser
│   ├── utils/
│   │   ├── cookies.js            # Cookie get/set/clear helpers (`cookies` object)
│   │   ├── format.js             # Zod validation error formatter
│   │   └── jwt.js                # JWT sign/verify wrapper (`jwttoken` object)
│   └── validations/
│       └── auth.validation.js    # Zod schemas: signupSchema, signInSchema
├── drizzle/
│   ├── 0000_black_magik.sql      # Initial migration (users table)
│   └── meta/                     # Drizzle migration metadata
├── logs/
│   ├── combined.log              # All log output (gitignored)
│   └── error.log                 # Error-level logs only (gitignored)
├── drizzle.config.js             # Drizzle Kit config (globs src/models/*.js)
├── eslint.config.js              # ESLint flat config
├── .prettierc                    # Prettier config (note: filename missing one 'r')
├── .prettierignore               # Prettier ignore rules
├── .env.example                  # Environment variable template
└── package.json
```

## Setup & Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — see Environment Variables section below

# 3. Run database migrations
npm run db:migrate

# 4. Start development server (with file watching)
npm run dev
```

## Environment Variables

All variables are defined in `.env` (copy from `.env.example`):

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `3000` |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `LOG_LEVEL` | Winston log level (`info`, `debug`, `warn`, `error`) | `info` |
| `DATABASE_URL` | Neon PostgreSQL connection string (with `sslmode=require`) | — |
| `JWT_SECRET` | Secret key for signing JWTs | Falls back to a hardcoded default — **must be set in production** |

> **Warning:** The fallback `JWT_SECRET` in `src/utils/jwt.js` is insecure. Always set a strong `JWT_SECRET` in production.

> **Security note:** `.gitignore` currently patterns `.env.*`, which does **not** match `.env` itself. Ensure `.env` is explicitly added to `.gitignore` to prevent committing secrets.

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `node --watch src/index.js` | Start server with hot reload |
| `lint` | `eslint .` | Run ESLint |
| `lint:fix` | `eslint . --fix` | Auto-fix lint errors |
| `format` | `prettier --write` | Format files with Prettier |
| `format:check` | `prettier --check .` | Check formatting |
| `db:generate` | `drizzle-kit generate` | Generate new migration from schema changes |
| `db:migrate` | `drizzle-kit migrate` | Apply pending migrations to database |
| `db:studio` | `drizzle-kit studio` | Open Drizzle Studio (database GUI) |

## API Endpoints

### Base

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health greeting — returns plain text `"Hello from Acquisitions!"` |
| `GET` | `/health` | Health check — returns `status`, `timestamp`, `uptime` |
| `GET` | `/api` | API status message |

### Auth — `/api/auth`

| Method | Path | Status | Description |
|---|---|---|---|
| `POST` | `/api/auth/sign-up` | Implemented | Register a new user |
| `POST` | `/api/auth/sign-in` | Route stub (controller ready) | Sign in with email + password |
| `POST` | `/api/auth/sign-out` | Route stub (controller ready) | Sign out (clears token cookie) |

> **Note:** `signIn` and `signOut` are fully implemented in `auth.controller.js` and `auth.service.js`, but `auth.routes.js` still uses inline stub handlers. Wiring them up requires importing the controllers and replacing the stubs.

#### POST `/api/auth/sign-up`

**Request body** (JSON):
```json
{
  "name": "string (2–255 chars)",
  "email": "string (valid email, max 255)",
  "password": "string (6–128 chars)",
  "role": "user | admin  (optional, default: user)"
}
```

**Success response** `201`:
```json
{
  "message": "User registered",
  "user": { "id": 1, "name": "...", "email": "...", "role": "user" }
}
```
A JWT token is also set as an `httpOnly` cookie (`token`) with a 15-minute TTL.

**Error responses:**
- `400` — Validation failed (returns field-level messages as a comma-joined string)
- `409` — Email already registered

#### POST `/api/auth/sign-in` *(controller implemented, route is stub)*

**Request body** (JSON):
```json
{
  "email": "string (valid email)",
  "password": "string (min 1 char)"
}
```

**Success response** `200`:
```json
{
  "message": "User signed in",
  "user": { "id": 1, "name": "...", "email": "...", "role": "user" }
}
```
A JWT token cookie is set on success.

**Error responses:**
- `400` — Validation failed
- `401` — Invalid credentials

#### POST `/api/auth/sign-out` *(controller implemented, route is stub)*

**Success response** `200`:
```json
{ "message": "User signed out" }
```
Clears the `token` cookie.

## Database Schema

### `users` table

| Column | Type | Constraints |
|---|---|---|
| `id` | `serial` | Primary key, auto-increment |
| `name` | `varchar(255)` | NOT NULL |
| `email` | `varchar(255)` | NOT NULL, UNIQUE |
| `password` | `varchar(255)` | NOT NULL (bcrypt hash, 10 rounds) |
| `role` | `varchar(50)` | NOT NULL, DEFAULT `'user'` |
| `created_at` | `timestamp` | NOT NULL, DEFAULT `now()` |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT `now()` |

> `updated_at` is not automatically updated on record changes — this needs to be handled manually or via a DB trigger.

## Architecture & Key Design Decisions

### Startup Sequence
`index.js` → loads `dotenv/config` → imports `server.js` → imports `app.js` → binds to `PORT`.

### Module Aliases
`package.json` uses Node's `imports` field to define path aliases, avoiding relative import chains:
```
#config/*        → ./src/config/*
#controllers/*   → ./src/controllers/*
#middleware/*    → ./src/middleware/*
#models/*        → ./src/models/*
#routes/*        → ./src/routes/*
#services/*      → ./src/services/*
#utils/*         → ./src/utils/*
#validations/*   → ./src/validations/*
```

### Middleware Stack (app.js, in order)
1. `helmet()` — security headers (CSP, HSTS, etc.)
2. `cors()` — cross-origin resource sharing (default config, all origins)
3. `express.json()` — JSON body parsing
4. `express.urlencoded({ extended: true })` — URL-encoded body parsing
5. `cookieParser()` — cookie parsing
6. `morgan('combined', ...)` — HTTP request logging piped through Winston
7. Route handlers
8. `notFound` — catches unmatched routes, returns `404`
9. `errorHandler` — global error handler

### Authentication Flow

**Sign-up:**
1. `POST /api/auth/sign-up` → `auth.routes.js` → `signup` controller
2. Request body validated with Zod `signupSchema`
3. `createUser()` service: checks for duplicate email → hashes password (bcrypt, 10 rounds) → inserts user, returning `{id, name, email, role, created_at}`
4. JWT signed with `{id, email, role}` payload, 1-day expiry
5. Token delivered via `httpOnly` + `sameSite: strict` cookie (secure in production)
6. User object (no password) returned in JSON response

**Sign-in (controller ready, route stub):**
1. `POST /api/auth/sign-in` → `signIn` controller
2. Validated with Zod `signInSchema`
3. `authenticateUser()` service: queries user by email → compares bcrypt hash → strips password field from returned object
4. JWT signed and set as cookie, same as sign-up flow

**Sign-out (controller ready, route stub):**
1. `POST /api/auth/sign-out` → `signOut` controller
2. Calls `cookies.clear(res, 'token')`

### JWT & Cookie TTL Mismatch
The JWT token is signed with `expiresIn: '1d'` (1 day), but the cookie `maxAge` is `15 * 60 * 1000` ms (15 minutes). The cookie expires before the token — after 15 minutes the browser stops sending the token even though the JWT itself remains valid. Consider aligning these values.

### Error Handling
- Controller-level: known business errors (`'User with this email already exists'`, `'Invalid credentials'`) return explicit status codes (`409`, `401`)
- Unhandled errors forwarded via `next(e)` to the global `errorHandler` middleware
- `errorHandler` reads `err.status ?? err.statusCode ?? 500`; hides internals for 5xx (returns `"Internal server error"`), surfaces `err.message` for 4xx
- `notFound` returns `{ error: "Route not found: METHOD /path" }`

### Validation & Error Formatting
Zod schemas in `src/validations/auth.validation.js`:
- `signupSchema`: name (2–255, trimmed), email (valid, max 255, lowercased, trimmed), password (6–128), role (enum, default `'user'`)
- `signInSchema`: email (valid, lowercased, trimmed), password (min 1)

`formatValidationError` in `src/utils/format.js` maps `errors.issues` to a comma-joined string of messages. This produces a flat string, not a per-field error map.

### Logging
- Winston writes structured JSON logs to `logs/combined.log` and `logs/error.log`
- In non-production environments, colorized simple-format logs are also output to the console
- HTTP request logs captured by Morgan and piped through Winston at `info` level
- `defaultMeta: { service: 'acquisitions-api' }` is attached to every log entry
- Log level configurable via `LOG_LEVEL` env var

### Cookie Configuration
| Option | Value |
|---|---|
| `httpOnly` | `true` (not accessible via JS) |
| `secure` | `true` in production only |
| `sameSite` | `strict` |
| `maxAge` | 15 minutes (`15 * 60 * 1000` ms) |

### Database Connection
`src/config/database.js` uses `@neondatabase/serverless` with `drizzle-orm/neon-http`. Exports both `db` (Drizzle query builder) and `sql` (raw Neon SQL executor). Drizzle Kit is configured via `drizzle.config.js`, which globs all `src/models/*.js` files for schema discovery.

## Code Style

Enforced by ESLint (flat config) and Prettier. Key rules:
- 2-space indentation (`SwitchCase: 1`)
- Single quotes
- Semicolons required
- `const` over `let`; no `var`
- `prefer-arrow-callback` and `object-shorthand` enforced
- Unix line endings (LF)
- `no-unused-vars` allows `_`-prefixed args
- Prettier: `printWidth: 80`, `trailingComma: "es5"`, `arrowParens: "avoid"`, `bracketSpacing: true`

> **Note:** Prettier config is stored in `.prettierc` (missing one `r`). Prettier may not auto-discover it — if formatting behaves unexpectedly, rename it to `.prettierrc`.

Run before committing:
```bash
npm run lint:fix && npm run format:check
```

## What's Not Yet Implemented

- `POST /api/auth/sign-in` route — controller exists, needs wiring in `auth.routes.js`
- `POST /api/auth/sign-out` route — controller exists, needs wiring in `auth.routes.js`
- `updated_at` auto-update on record mutation
- Authentication middleware (protect private routes using `jwttoken.verify`)
- Test suite (ESLint config references `tests/**` with Jest globals, but no tests exist yet)
- Per-field validation error responses (currently returns a flat comma-joined string)
- JWT/cookie TTL alignment (JWT: 1 day, cookie: 15 min)
- `.env` added to `.gitignore` explicitly
