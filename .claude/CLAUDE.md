# Klass

Community learning platform for Uzbekistan/CIS market — similar to Skool.com.

## Stack
- **Framework**: Next.js 16 App Router, TypeScript
- **Styling**: Tailwind CSS v4
- **Database + Auth + Realtime**: Supabase (US-East for dev, Frankfurt for prod)
- **Hosting**: Vercel (auto-deploy from GitHub main branch)
- **Payments**: ATMOS payment gateway (Uzbekistan) — to be integrated later
- **File uploads**: Uploadthing (images/docs), YouTube/Vimeo embeds for video

## Key Conventions
- All monetary values stored in tiyins (bigint) — 1 UZS = 100 tiyins
- Currency display: `formatUZS()` from `lib/utils.ts` → "150 000 UZS"
- Russian is the primary UI language
- Supabase service role client ONLY in API routes (never in components)
- All DB writes for payments go through API routes using service role
- Slug identifies communities in URLs: `/c/[slug]`

## Project Structure
- `lib/supabase/` — client.ts (browser), server.ts (RSC), admin.ts (service role)
- `lib/types/database.ts` — all TypeScript DB types
- `lib/utils.ts` — cn(), formatUZS(), slugify()
- `lib/atmos/` — ATMOS API wrappers (stubbed until credentials provided)
- `components/ui/` — base UI primitives
- `supabase/migrations/` — all SQL migrations (apply in order)

## Design Reference
Skool.com layout: top horizontal nav tabs (Community, Classroom, Members, Leaderboard), 2/3 + 1/3 split on community page, collapsible left panel in classroom.
