## Performance and Scalability Plan

This document outlines how we’ll keep the app fast as data and users grow. It summarizes current behavior, risks, and the recommended approach in phases.

### Current state (observed)
- **Client‑side fetching first**: Pages like `settings/page.tsx` and `thread/[id]/page.tsx` fetch after mount, so initial render shows placeholders/zeros.
- **Minimal caching**: Most dynamic API responses are not cached; some routes instantiate fresh Prisma clients.
- **Counting and lists**: Multiple COUNT queries in places (e.g., pending shares), lists request full datasets.

### Risks as we scale
- Higher TTFB/TTI due to multiple round‑trips and cold DB connections.
- Long lists becoming slow to render/scroll without pagination/virtualization.
- Expensive relational counts (`_count`) on popular threads.

## Strategy overview
1. **Server render initial data** and hydrate with SWR (stale‑while‑revalidate) on the client.
2. **Cache public data** with ISR/revalidation-by-tag; **short private cache** for per-user data.
3. **Paginate everything** that can grow; add list virtualization.
4. **Trim DB work**: group counts, denormalize hot counters, and standardize a single Prisma client.
5. **Perceived performance**: optimistic UI, skeletons, and prefetching.
6. **Measure**: add basic timings and track p95 latency to guide work.

## Quick wins (low risk, immediate)
- Use a single Prisma client everywhere (`src/lib/prisma.ts`) and remove local `new PrismaClient()` instances in API routes.
- Replace multiple COUNT calls with one grouped query where possible (e.g., `/api/pending-shares/count`).
- Add SWR to per‑user endpoints (counts, pending shares) so last values show immediately and refresh in background.
- Set cache headers:
  - Per-user JSON: `Cache-Control: private, max-age=30`.
  - Public JSON/HTML: `s-maxage=60, stale-while-revalidate=600`.

## Server rendering and ISR
- Convert heavy pages to server components or hybrid:
  - `src/app/thread/[id]/page.tsx`: server-fetch thread and contributions; stream; hydrate client controls.
  - `src/app/settings/page.tsx`: server-fetch initial counts and first page of saved conversations.
- Public content (threads): use ISR with tags. On mutations (new contribution, vote count changes if denormalized), call `revalidateTag('thread:<id>')`.

## Pagination and virtualization
- Never fetch all items for lists. Use cursor pagination by `createdAt`:
  - `GET /api/pending-shares?status=pending&cursor=<createdAt>&limit=20`
  - Ensure indexes exist (we already have `@@index([userId])`, `@@index([status])`, `@@index([createdAt])`).
- Add list virtualization for long lists (e.g., `react-virtualized` or `react-virtual`), especially for threads and saved conversations.

## Database efficiency
- Grouped counts instead of multiple queries (return `{ pending, completed }` in one call; `total = pending + completed`).
- Avoid heavy `_count` on hot paths; introduce denormalized counters:
  - Add `upvoteCount`, `downvoteCount`, `commentCount` to `Thread`.
  - Update counts in the same transaction as the write.

## API consolidation and batching
- Create a single settings bootstrap endpoint (or server loader) that returns:
  - Invite codes
  - API key flags
  - Pending shares (first page)
  - Counts (pending/completed/total)
- Keep client code concurrent and memoized; SWR keys for each section.

## Perceived performance
- Aggressive skeletons for lists and side panels.
- Optimistic updates for actions (mark complete, delete, vote) with rollback on failure.
- Prefetch likely next resources: Next.js Link prefetch for pages; small API prefetch on hover/intention.

## Observability
- Add Server‑Timing headers in API routes (query timing, total).
- Log route latency and DB query durations; track p95 and p99.
- Set SLOs: p95 API < 300ms for cached reads, < 700ms for uncached reads.

## Rollout plan (suggested order)
1. Quick wins (counts query, Prisma client unification, cache headers, SWR for per‑user data).
2. Pagination + virtualization for saved conversations and threads.
3. Convert thread page to server-render + ISR with tag invalidation.
4. Denormalize counters and remove hot `_count`.
5. Consolidate settings bootstrap and remove extra round trips.
6. Add metrics dashboards and alarms on p95 regressions.

## References (code)
- Shared Prisma client: `src/lib/prisma.ts`
- Pending shares routes: `src/app/api/pending-shares/*`
- Thread route: `src/app/api/threads/[id]/route.ts`
- Settings page: `src/app/settings/page.tsx`

This plan keeps initial renders fast, reduces repeated work, and gives us room to grow to thousands of items without the UI feeling sluggish.


