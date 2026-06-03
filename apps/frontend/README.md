# @tread-trails/frontend (Phase 5)

Customer storefront — Next.js 14 App Router.

**Current location:** The live storefront still runs from the **repository root** (`tread-trails/package.json`) during the strangler migration.

Phase 5 will:

1. Move root `app/`, `components/`, `public/`, etc. here (excluding `app/admin` and `app/api`).
2. Add `services/api/*` using `NEXT_PUBLIC_API_URL`.
3. Remove all Prisma and server-only imports.

See [MIGRATION_PLAN.md](../../MIGRATION_PLAN.md).
