# Artist Home "By the Numbers" — make all KPI tiles live

**Date:** 2026-07-17
**Status:** Design approved, pre-plan
**Surfaces:** `netsa-frontend` (KPI grid) + `netsa-backend/users-service` (new profile-views feature). Payment-service & contracts endpoints are consumed read-only (no backend change there).

## Problem

The artist-home "By the Numbers" grid (`ByTheNumbersArtist.tsx` + `useArtistNumbers.ts`) is visually complete but only **1 of 5 tiles shows real data** (Rating). The rest are either silently broken or hardcoded:

| Tile | State today | Root cause |
|---|---|---|
| Rating | ✅ live | wired to `cached.averageRating` / `totalReviews` |
| Applications (total/active) | ❌ reads 0 | `Array.isArray(appsQ.data)` guard fails on the real `{ meta, data: [...] }` shape; `ACTIVE_STATUSES` lists non-existent `reviewed`/`pending` |
| Delivered | ❌ reads 0 | reads nonexistent `user.cached.totalGigsDelivered` |
| Earned / pending / sparkline | ❌ hardcoded `0`/`[]` | never wired |
| Profile views / delta | ❌ hardcoded `0` | no backend exists (field `Artist.stats.profileViews` never incremented or exposed) |

## Goal

Every tile shows real data. Three parts are frontend-only wiring to existing endpoints; one (profile views) is a new full-stack feature (total + weekly delta).

## Locked decisions

1. **Earnings status sets** (from `Transaction.ts` — no escrow, instant Razorpay Route split): "received" = `{paid, confirmed, completed}`; "pending payout" = `{created, recorded}`. `artistReceived` is the net-of-fee amount; `toUserId` is the recipient.
2. **Profile-view increment** via a dedicated `POST /users/:id/view` called from profile screens on mount (viewer ≠ owner), **not** piggybacked on `getUserById` (which fires on card/list fetches). Deduped per `(viewer, viewed, day)`.
3. **Sparkline** = daily `artistReceived` totals over the last 7 days (7 points).
4. Profile views scope = **total + weekly delta** (not total-only).

## Design

### Part 1 — Applications (frontend fix, `useArtistNumbers.ts`)
- Replace `Array.isArray(appsQ.data) ? appsQ.data : []` with a `safeArr` unwrap (mirror `AppliedSection.unwrapApplications` / `YourStageArtist.safeArr`: accept bare array, `.data`, `.items`).
- `ACTIVE_STATUSES` → `{ applied, shortlisted, hired }` (real `GigApplication` enum is `applied|shortlisted|rejected|hired`). Remove `reviewed`, `pending`.
- Delete dead `deliveredFromApps` (no `completed` status on applications).

### Part 2 — Delivered (frontend, repoint to contracts)
- Source of truth = `Contract.status === 'completed'` (payment-service), where the artist is `artistId`.
- Add a lightweight query: `contractService.getUserContracts({ status: 'completed', pageSize: 1 })` → read `data.data.total`. Key under `queryKeys.artist.contracts()` family (already invalidated on pull-to-refresh). `delivered` = that total.
- Remove `user.cached.totalGigsDelivered` / `gigsDelivered` reads.

### Part 3 — Earnings (frontend, aggregate transactions)
- `paymentService.getMyTransactions({ pageSize })` → `GET /v1/users/me/transactions` (returns `{ data: { transactions, total, page, pageSize } }`, both directions via `$or fromUserId/toUserId`).
- New hook `useArtistEarnings` (`queryKeys.artist.earnings()`), fetch `pageSize=100`, filter `toUserId === me`, then:
  - `earnedThisMonth` = Σ `artistReceived` where `status ∈ {paid,confirmed,completed}` and `createdAt` within the current **IST** month.
  - `sparkline` = per-day Σ `artistReceived` for each of the last 7 days (same status filter), returned as a 7-number array.
  - `pendingPayouts` = count where `status ∈ {created,recorded}`.
- `useArtistNumbers` composes this hook; expose `earnedThisMonth`, `pendingPayouts`, `sparkline`.
- Wire `queryKeys.artist.earnings()` into `artist-home.tsx` `onRefresh`.
- **Known limit:** client-side aggregation over the most recent 100 transactions (endpoint has no date filter/aggregation). Acceptable at launch volume; a server-side `/earnings/summary` endpoint is the future optimization. Logged, not silently capped — if `total > 100` the month sum could undercount for very high-volume artists.

### Part 4 — Profile views (full-stack: total + weekly delta)
**Backend — `users-service`:**
- New model `ProfileView`: `{ viewerId, viewedUserId, day: 'YYYY-MM-DD', at: Date }`.
  - Unique compound index `(viewerId, viewedUserId, day)` → one row per viewer per profile per day (dedup).
  - TTL index on `at` (~90d) to bound growth (weekly delta only needs 7d; 90d gives headroom).
- `POST /users/:id/view` (auth required): if `viewer !== :id`, upsert the day-row; **on insert only** (new unique day) `$inc Artist.stats.profileViews` (lifetime cached counter). Idempotent within a day. Returns `204`.
- `GET /users/me/profile-views` → `{ total, last7 }`:
  - `total` = `Artist.stats.profileViews` (lifetime).
  - `last7` = `ProfileView.countDocuments({ viewedUserId: me, at: >= now-7d })`.

**Frontend:**
- `POST /:id/view` fired on mount of the public-profile screens (`ProfileScreen` / `PerformerProfile`) when `viewer !== profileOwner`. Fire-and-forget, non-blocking.
- New hook `useProfileViews` → `GET /users/me/profile-views`; wire `profileViews = total`, `profileViewsDelta = last7`.

## Data flow (hook composition)

```
useArtistNumbers
├── useApplications      → applicationsTotal, applicationsActive   (Part 1)
├── useHeroData          → rating, reviewCount                     (existing)
├── useDeliveredCount    → delivered            (contracts, Part 2)
├── useArtistEarnings    → earnedThisMonth, pendingPayouts, sparkline (Part 3)
└── useProfileViews      → profileViews, profileViewsDelta          (Part 4)
```

`isLoading` = OR of the underlying fetches. Tiles already degrade to `—` on zero, so partial loads never crash.

## Testing

- **Part 1/2/3:** extend `useArtistNumbers`/`ByTheNumbersArtist` jest tests with mocked wrapped `{data:[...]}` responses, contract totals, and transaction fixtures (month boundary, status filtering, sparkline bucketing, pending count). Assert applications no longer read 0 for the wrapped shape.
- **Part 4 backend:** unit tests for dedup (same viewer/day → one row, counter +1 once), self-view ignored, `last7` window. Integration test for the two endpoints.
- **Part 4 frontend:** hook test for `{ total, last7 }` mapping; verify view POST fires only when viewer ≠ owner.

## Out of scope
- Server-side earnings aggregation endpoint (documented as future optimization).
- Unique-visitor analytics beyond the per-day dedup.
- Backfilling historical profile views (starts counting from ship).
