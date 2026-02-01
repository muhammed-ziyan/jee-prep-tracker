# Syllatra – JEE Prep Tracker

Track JEE preparation progress: syllabus, study sessions, revision, backlog, and mock tests.

## Stack

- **Next.js 16** (App Router)
- **Supabase** (Auth, Postgres)
- **Tailwind CSS**, **Radix UI**, **React Query**

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` – Service role key (server-only; never expose)
   - `ADMIN_EMAILS` – Comma-separated emails for admin access (optional)

3. **Database**

   Run Supabase migrations in order (see `supabase/migrations/RUN_IN_SUPABASE_SQL_EDITOR.md`), or use:

   ```bash
   npx supabase link
   npx supabase db push
   ```

## Scripts

- `npm run dev` – Development server
- `npm run build` – Production build
- `npm run start` – Start production server
- `npm run check` – TypeScript check

## License

MIT
