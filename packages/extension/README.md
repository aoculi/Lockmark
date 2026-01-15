# Sanctuar Extension

React + WXT browser extension for encrypted bookmarks. Everything is encrypted client-side before reaching the API.

## Features

- **Client-side encryption**: Argon2id KDF + XChaCha20-Poly1305 + HKDF-SHA-256
- **Local API integration**: Default `http://127.0.0.1:3500`
- **Vault sync**: Optimistic concurrency with ETag support
- **Bookmark & tag management**: Encrypted storage with metadata

## Requirements

- pnpm (workspace manager)
- Node.js 18+
- Running Sanctuar API (`packages/api`) on `http://127.0.0.1:3500` or your configured host
- Firefox Nightly or Firefox ZEN for unsigned builds (Chrome/Chromium unsigned not yet tested)

## Install dependencies

From the repo root (preferred):

```bash
pnpm install
```

Or from `packages/extension` if you are working only here:

```bash
pnpm install
```

## Development

```bash
pnpm run dev            # Chrome/Chromium target
pnpm run dev:firefox    # Firefox target
```

## Build & package

```bash
pnpm run build              # Chrome build
pnpm run build:firefox      # Firefox build
pnpm run build:prod         # Chrome production build
pnpm run build:firefox:prod # Firefox production build

pnpm run zip                # Chrome ZIP
pnpm run zip:firefox        # Firefox ZIP
pnpm run zip:firefox:prod   # Firefox production ZIP
```

ZIP outputs can be loaded directly into browsers for testing or side-loading.

## Configure the API URL

1. Start the API (`packages/api`, defaults to `http://127.0.0.1:3500`).
2. Install/load the extension (see Firefox instructions below).
3. Open extension settings → set API URL (if different from default) → save.

## Firefox loading without the Add-on Store

1. Visit `about:config` and accept the warning.
2. Set `xpinstall.signatures.required` to `false`.
3. Open `about:addons` → gear icon → “Install Add-on From File…” → select the ZIP (or unpacked dir).

## Usage flow

1. Ensure the API is running and reachable.
2. Load the extension.
3. Register a new account (gets KDF params, wraps your master key).
4. Log in and start adding bookmarks/tags; everything is encrypted before leaving the browser.

## Security

- **KDF**: Argon2id (512 MiB, 3 iterations) derives the User Encryption Key
- **Master key**: Generated client-side, wrapped with UEK; only ciphertext/nonces sent to API
- **Session handling**: JWT refresh with background scripts (`entrypoints/lib/background/`)

---

Built with [WXT](https://wxt.dev).

## License

MIT
