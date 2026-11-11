# CRAVER | Modern Restaurant Discovery Platform

CRAVER is a community-driven restaurant discovery platform inspired by classic restaurant directories—focused on venue profiles, digital menus, neighborhood discovery, food photography, personal collections, and honest dining reviews across Jakarta.

## Tech Stack

- **Framework**: Next.js 15 App Router, React 18, TypeScript, Tailwind CSS v4
- **Framer Component Integration**: `urlImports` + `unframer` runtime integrating the 4 required Framer modules (`Slot-Text-with-3D`, `Morphing-Mega-Menu`, `Motion-Minimal-Navs`, `NudgeFooter`)
- **Backend & Auth**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`) with PostgreSQL, Row Level Security (RLS), Storage buckets, and server-side Admin API routes (`/api/admin/*`)
- **Validation**: Zod schemas across client forms and admin endpoints

## Supabase Setup

1. Create a Supabase project and copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Populate:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, never prefixed with `NEXT_PUBLIC_`)
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

2. Apply the SQL migrations in order using the Supabase SQL Editor (or CLI):
   1. `supabase/migrations/001_schema.sql`
   2. `supabase/migrations/002_rls_policies.sql`
   3. `supabase/migrations/003_storage.sql`
   4. `supabase/seed.sql` (populates 10 Jakarta restaurants, categorized menus, signature dishes, photos, collections, and approved updates)

3. Optional demo accounts & sample reviews:

```bash
node scripts/seed-demo-users.mjs
```

This creates:
- Admin account: `admin@craver.id` (`CraverAdmin2026!`)
- Member account: `diner@craver.id` (`CraverDiner2026!`)

Or promote any existing registered email via SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

## Development & Verification

```bash
npm.cmd run dev          # Starts Next.js development server (Webpack required for Framer urlImports)
npm.cmd run typecheck    # TypeScript check
npm.cmd run lint         # ESLint check
npm.cmd test             # Unit, validation & schema/Framer invariant tests
npm.cmd run test:supabase # Live Supabase CRUD & RLS integration tests (requires .env.local + migrations)
npm.cmd run build        # Production build
```

