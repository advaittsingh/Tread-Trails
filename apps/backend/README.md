# @tread-trails/backend

Express API — single owner of Prisma, payments, and email.

## Setup

```bash
# From repo root (with pnpm via npx if needed)
cp apps/backend/.env.example apps/backend/.env
# Or rely on ../../.env.local DATABASE_URL

npx pnpm install
npx pnpm --filter @tread-trails/backend dev
```

## Endpoints (Phase 1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + DB ping |

Auth and domain routes return `501` until Phases 2–4.
