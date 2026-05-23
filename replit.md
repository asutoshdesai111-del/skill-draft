# Fresher Resume Builder

A full-stack web app for fresh graduates to build professional resumes with an 8-step guided wizard, 5 beautiful templates, live preview, ATS score checker, and PDF export.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, serves under `/api`)
- `pnpm --filter @workspace/fresher-resume run dev` — run the frontend (Vite dev server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run seed` — seed templates and demo user into DB
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Wouter (routing), TanStack Query, react-hook-form, Zod, Tailwind CSS v4
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (`jsonwebtoken`) + `bcryptjs` — token stored in `localStorage` as `fresher_resume_token`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks
- `lib/db/src/schema/` — Drizzle ORM table definitions
- `artifacts/api-server/src/routes/` — Express route handlers (auth, resumes, sections, templates)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT `requireAuth` middleware + `generateToken`
- `artifacts/fresher-resume/src/pages/` — All frontend pages
- `artifacts/fresher-resume/src/components/resume-preview.tsx` — 5 resume template renderers
- `artifacts/fresher-resume/src/lib/auth.ts` — localStorage token helpers

## Architecture decisions

- Contract-first API: OpenAPI spec → codegen → typed React Query hooks and Zod schemas
- JWT stored in localStorage, injected via `setAuthTokenGetter` on app startup (not cookies)
- No native modules: used `bcryptjs` (pure JS) instead of `bcrypt` to avoid build script issues in pnpm sandbox
- PDF export returns base64-encoded HTML; user opens in browser and uses Ctrl+P to save as PDF (WeasyPrint/Puppeteer not available in sandbox)
- Resume sections stored as separate tables (not JSONB) for flexibility and future querying

## Product

- **Landing page**: marketing page at `/` with features, templates, and quick tips for freshers
- **Auth**: register (`/register`) and login (`/login`) with JWT; demo account: `demo@fresherresume.com / demo123456`
- **Dashboard** (`/dashboard`): resume list with stats, create/edit/duplicate/delete actions
- **Builder** (`/builder/:resumeId`): 8-step wizard (Personal Info → Career Objective → Education → Skills → Projects → Experience → Certifications → Languages)
- **Preview** (`/builder/:resumeId/preview`): live resume preview with 5 switchable templates, ATS score widget, and HTML download
- **5 Templates**: Modern Professional, Minimalist, Creative, Corporate, Technical

## User preferences

_No explicit user preferences recorded yet._

## Gotchas

- Always run `pnpm run typecheck:libs` before artifact typechecks (rebuilds lib declarations needed by Express routes)
- `bcrypt` (native) is blocked in pnpm sandbox — use `bcryptjs` only
- Export endpoint (`GET /api/resumes/:id/export/pdf`) returns base64-encoded HTML, not a real PDF binary
- `useExportResumePdf` is a query (not mutation) — use `refetch` to trigger lazily

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
