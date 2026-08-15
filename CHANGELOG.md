## 0.1.0 -- e2e ticket mirror 0.1.0

# Changelog

## [0.1.0] - 2026-08-15

### Added
- Minimal Next.js 14 (App Router, TypeScript) scaffold that renders a static, kanban-style ticket list read from `data/tickets.json` -- no database, no API routes. (`463e671` feat: List the tickets, #331)
- Three fixed-order status headings -- To Do, In Progress, Done -- each labeled with a live count of the tickets in that group. (`463e671`)
- `lib/group.ts` exporting `groupByStatus(tickets)` as the single authoritative grouping implementation: fixed bucket order, stable in-bucket ordering, and safe exclusion of tickets with an unrecognized status (never throws). (`12920ca` feat: Grouping in its own module, #332)
- Vitest unit test suite (`lib/group.test.ts`) covering bucket order, per-bucket counts, stable ordering, unrecognized-status exclusion, and the empty-array case. (`12920ca`)
- `app/Chip.tsx`: a small assignee chip rendered right-aligned on each ticket row, showing the assignee's full name or a visually muted "Unassigned" label when absent. (`d1f408e` feat: The assignee chip and the README, #333)
- README section documenting the `tickets.json` data shape with one complete example ticket (including `assignee: string`), and stating that `npm ci && npm run build` must succeed. (`d1f408e`)

### Changed
- `app/page.tsx` now imports and renders from `groupByStatus` in `lib/group.ts` instead of computing/duplicating status-grouping logic inline. (`12920ca`)

### Fixed
- N/A -- first release.
