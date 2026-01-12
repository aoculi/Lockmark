# LockMark API

Local-only, encrypted bookmarks backend. Stores only ciphertext in SQLite via Drizzle.

## Features

- **Local-only**: Binds to `127.0.0.1:3500` by default
- **JWT sessions**: 1h expiry with revocation support
- **Rate limiting**: 5 auth attempts/min per IP and per login
- **Optimistic concurrency**: ETags/If-Match on manifests and items
- **Zero-knowledge**: Only encrypted data, wrapped master key, and Argon2id hashes stored

## Requirements

- Bun (runtime + package manager)
- SQLite (file-based; `sqlite.db` by default)
- Optional: pnpm if you prefer workspace installs from the repo root

## Quick start (from `packages/api`)

```bash
# 1) Install dependencies
bun install

# 2) Create .env with database path and JWT secret
echo "DATABASE_URL=sqlite.db" > .env
bun run generate:secret | grep '^JWT_SECRET=' >> .env

# 3) Run migrations
bun run db:migrate

# 4) Start the API (hot reload)
bun run dev
```

Defaults: `HOST=127.0.0.1`, `PORT=3500` → `http://127.0.0.1:3500`.

## Configuration

Set these in `.env` (or `.env.production` for prod):

```bash
DATABASE_URL=sqlite.db
JWT_SECRET=hex-encoded-32-bytes-secret   # use bun run generate:secret
HOST=127.0.0.1                           # optional
PORT=3500                                # optional
```

## Scripts

```bash
bun run generate:secret   # prints JWT_SECRET=... line

# Migrations
bun run db:generate       # create a new migration from schema
bun run db:migrate        # apply migrations
bun run db:generate:run   # generate and immediately apply

# Dev and tests
bun run dev               # start API with hot reload
bun test                  # run test suite
```

## Storage model

| Table | Data |
|-------|------|
| `users` | Argon2id hash, KDF/HKDF salts, wrapped master key |
| `sessions` | JWT jti with expiry/revocation |
| `vaults` + `manifests` | Encrypted manifest blob with ETag + version |
| `bookmarks`, `tags`, `bookmark_tags` | Encrypted items, per-item DEK wrapped and versioned |

All data is base64-validated and size-bounded (manifest 5 MB, item 64 KB).

## Security

- **Auth hashing**: Server-side Argon2id for password verification
- **Client KDF**: Argon2id (512 MiB, 3 iters) → UEK; master key wrapped client-side
- **Transport**: Loopback by default; adjust `HOST`/`PORT` to expose
- **Rate limiting**: Per IP and per login on auth; refresh limited per user
- **JWT**: HS256, 1h default, requires non-revoked session

## Example usage (manual)

```bash
# Register
curl -X POST http://127.0.0.1:3500/auth/register \
  -H "content-type: application/json" \
  -d '{"login":"alice","password":"correct horse battery staple"}'

# Login (returns token, kdf params, wrapped_mk)
curl -X POST http://127.0.0.1:3500/auth/login \
  -H "content-type: application/json" \
  -d '{"login":"alice","password":"correct horse battery staple"}'

# Get vault metadata
curl -H "authorization: Bearer <token>" http://127.0.0.1:3500/vault
```

## Available routes

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
GET    /bookmarks              (requires Bearer token; query: cursor, limit, includeDeleted, updatedAfter)
POST   /bookmarks              (requires Bearer token)
GET    /bookmarks/:id          (requires Bearer token)
PUT    /bookmarks/:id          (requires Bearer token; If-Match header)
DELETE /bookmarks/:id          (requires Bearer token; If-Match header)
GET    /bookmarks/:id/tags     (requires Bearer token)

# Tags
GET    /tags                   (requires Bearer token; query: cursor, limit, includeDeleted, updatedAfter, byToken)
POST   /tags                   (requires Bearer token)
GET    /tags/:id               (requires Bearer token)
PUT    /tags/:id               (requires Bearer token; If-Match header)

# Bookmark-Tag links
POST   /bookmark-tags          (requires Bearer token)
DELETE /bookmark-tags          (requires Bearer token)
```

## License

MIT
