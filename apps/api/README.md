# Bookmarks API

A secure, local-first bookmarks backend built with Bun and Hono. It provides authentication, encrypted vault storage primitives, and a simple SQLite database via Drizzle.

## Getting Started (Quick Setup)

Run the following from `apps/api` to install dependencies, generate a secure JWT secret, initialize the database, and start the server:

```bash
# 1) Install dependencies
bun install

# 2) Create .env with database and a strong JWT secret
echo "DATABASE_URL=sqlite.db" > .env
bun run generate:secret | grep '^JWT_SECRET=' >> .env

# 3) Run database migrations
bun run db:migrate

# 4) Start the API (hot reload)
bun run dev
```

The server binds to `127.0.0.1` on port `3500` by default:

- Base URL: `http://127.0.0.1:3500`

## Scripts

```bash
# Generate a secure JWT secret (prints a JWT_SECRET=... line)
bun run generate:secret

# Database migrations
bun run db:generate      # Generate a new migration
bun run db:migrate       # Apply migrations
bun run db:generate:run  # Generate and immediately apply

# Development server
bun run dev
```

## Environment Variables

```bash
DATABASE_URL=sqlite.db
JWT_SECRET=hex-encoded-32-bytes-secret   # Use output from generate:secret
HOST=127.0.0.1                           # Optional
PORT=3500                                # Optional
```

## Available Routes

Base URL: `http://127.0.0.1:3500`

```text
# Auth
POST   /auth/register
POST   /auth/login
POST   /auth/logout            (requires Bearer token)
GET    /auth/session           (requires Bearer token)

# User
POST   /user/wmk               (requires Bearer token)

# Vault
GET    /vault                  (requires Bearer token)
GET    /vault/manifest         (requires Bearer token)
HEAD   /vault/manifest         (requires Bearer token)
PUT    /vault/manifest         (requires Bearer token; If-Match for updates)

# Bookmarks
GET    /bookmarks              (requires Bearer token; query params: cursor, limit, includeDeleted, updatedAfter)
POST   /bookmarks              (requires Bearer token)
GET    /bookmarks/:id          (requires Bearer token)
PUT    /bookmarks/:id          (requires Bearer token; If-Match header)
DELETE /bookmarks/:id          (requires Bearer token; If-Match header)
GET    /bookmarks/:id/tags     (requires Bearer token)

# Tags
GET    /tags                   (requires Bearer token; query params: cursor, limit, includeDeleted, updatedAfter, byToken)
POST   /tags                   (requires Bearer token)
GET    /tags/:id               (requires Bearer token)
PUT    /tags/:id               (requires Bearer token; If-Match header)

# Bookmark-Tag links
POST   /bookmark-tags          (requires Bearer token)
DELETE /bookmark-tags          (requires Bearer token)
```
