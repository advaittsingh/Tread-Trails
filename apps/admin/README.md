# @tread-trails/admin (Phase 6)

Admin panel — Vite + React, based on `admin panel template/`.

**Current location:** Production admin UI is still in the monolith at `app/admin/` + `components/admin/`.

Phase 6 will:

1. Scaffold Vite app from `admin panel template/client/`.
2. Map all 28 admin routes to React Router pages.
3. Consume `VITE_API_URL` only (no Prisma).
4. Wire dashboard, tables, charts, live map to `/api/admin/*`.

See [MIGRATION_PLAN.md](../../MIGRATION_PLAN.md).
