# Artist Home "By the Numbers" — Make All KPI Tiles Live — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stubbed/broken metrics in the artist-home KPI grid so every tile shows real data — Applications, Delivered, Earnings (all frontend wiring) and Profile Views (new full-stack feature: total + weekly delta).

**Architecture:** Frontend aggregation lives in pure, unit-tested helpers (`artistNumbers.helpers.ts`) consumed by thin React-Query hooks; `useArtistNumbers` composes them. Profile Views adds a `ProfileView` dedup collection + two endpoints in `users-service`, a fire-and-forget POST from the profile screens, and a read hook.

**Tech Stack:** React Native / Expo + TanStack Query + Zustand (frontend); Node/Express + Mongoose + jest/ts-jest/supertest (netsa-backend/users-service). Frontend tests: jest via `npx jest`. Backend tests: `npm test` (`ENABLE_SOCKET_REDIS=false jest`) in `netsa-backend/users-service`.

## Global Constraints

- **Response envelope (users-service):** there is NO shared `sendResponse` helper — return `res.status(n).json({ meta: { status, message }, data, errors: [] })` inline (mirror `savedTalent.controller.ts`). Do NOT import `sendResponse` in users-service.
- **Backend mount prefix is `/api/users`** (not `/v1`). Frontend calls the users-service via `authService`'s `API` whose paths start `/users/...` (e.g. `authService` GETs `/users/:id`). Match that: frontend paths are `/users/:id/view` and `/users/me/profile-views`.
- **Route ordering:** in `routes/users.ts`, literal routes MUST precede `router.get('/:id', ...)` (established, commented convention).
- **Auth:** `import { protect } from '../middleware/auth'`; caller id is `req.user!._id`; typed handlers use `AuthRequest` from `'../middleware/auth'`.
- **Artist doc:** one per user keyed by `userId` (unique), created on signup for `artist`/`creative_lead` only. Role-switchers may lack one — increment must be a graceful no-op when absent (NO upsert-create of Artist docs for non-artists).
- **Earnings status sets:** received = `{paid, confirmed, completed}`; pending = `{created, recorded}`. `artistReceived` is the net amount; `toUserId` is the recipient.
- **Existing services:** `contractService.getUserContracts` and `transactionService.getUserTransactions` already exist in `src/services/paymentService.ts` (both return `res.data` = the `{meta,data,errors}` envelope). Do NOT add new service methods for them.
- **Git:** if the working tree is not a git repo, treat each **Commit** step as a logical checkpoint (skip the git command); otherwise commit as written.

---

## File Structure

**Phase A — Frontend KPI wiring (independently shippable; no backend dependency)**
- Create: `netsa-frontend/src/hooks/artistNumbers.helpers.ts` — pure aggregation functions (safeArr, computeApplications, countDeliveredContracts, aggregateEarnings).
- Create: `netsa-frontend/src/hooks/__tests__/artistNumbers.helpers.test.ts` — unit tests for the helpers.
- Create: `netsa-frontend/src/hooks/useDeliveredCount.ts` — completed-contracts count for me-as-artist.
- Create: `netsa-frontend/src/hooks/useArtistEarnings.ts` — transaction aggregation hook.
- Modify: `netsa-frontend/src/constants/queryKeys.ts` — add `earnings()`, `deliveredCount()`, `profileViews()`.
- Modify: `netsa-frontend/src/hooks/useArtistNumbers.ts` — use helpers + new hooks; fix Applications/Delivered.
- Modify: `netsa-frontend/app/(app)/dashboard/artist-home.tsx` — invalidate the new keys on refresh.

**Phase B — Profile Views full-stack (independently shippable after Phase A or alone)**
- Create: `netsa-backend/users-service/src/models/ProfileView.ts` — dedup collection.
- Create: `netsa-backend/users-service/src/controllers/profileView.controller.ts` — record + summary handlers.
- Modify: `netsa-backend/users-service/src/routes/users.ts` — register two routes.
- Create: `netsa-backend/users-service/src/tests/profileView.test.ts` — endpoint tests.
- Modify: `netsa-frontend/src/services/authService.ts` — `recordProfileView` + `getMyProfileViews`.
- Create: `netsa-frontend/src/hooks/useProfileViews.ts` — read hook.
- Modify: `netsa-frontend/src/hooks/useArtistNumbers.ts` — wire profileViews + delta.
- Modify: `netsa-frontend/src/features/profile/PerformerProfile.tsx` — fire view POST.
- Modify: `netsa-frontend/src/features/profile/ProfileScreen.tsx` — fire view POST (gated).

> Run all frontend `npx jest` commands from `netsa-frontend/`; all backend commands from `netsa-backend/users-service/`.

---

# PHASE A — Frontend KPI wiring

### Task 1: Aggregation helpers (pure functions)

**Files:**
- Create: `netsa-frontend/src/hooks/artistNumbers.helpers.ts`
- Test: `netsa-frontend/src/hooks/__tests__/artistNumbers.helpers.test.ts`

**Interfaces:**
- Produces:
  - `safeArr(x: any): any[]`
  - `computeApplications(appsData: any): { applicationsTotal: number; applicationsActive: number }`
  - `countDeliveredContracts(contractsData: any, myId: string): number`
  - `aggregateEarnings(txData: any, myId: string, now: Date): { earnedThisMonth: number; pendingPayouts: number; sparkline: number[] }`

- [ ] **Step 1: Write the failing test**

Create `netsa-frontend/src/hooks/__tests__/artistNumbers.helpers.test.ts`:

```ts
import {
  safeArr,
  computeApplications,
  countDeliveredContracts,
  aggregateEarnings,
} from '../artistNumbers.helpers';

describe('safeArr', () => {
  it('handles bare array, {data}, {items}, and junk', () => {
    expect(safeArr([1, 2])).toEqual([1, 2]);
    expect(safeArr({ data: [3] })).toEqual([3]);
    expect(safeArr({ items: [4] })).toEqual([4]);
    expect(safeArr(null)).toEqual([]);
    expect(safeArr({ nope: 1 })).toEqual([]);
  });
});

describe('computeApplications', () => {
  it('unwraps the wrapped {meta,data:[...]} shape (the real backend shape)', () => {
    const wrapped = { meta: {}, data: [{ status: 'applied' }, { status: 'rejected' }], errors: [] };
    expect(computeApplications(wrapped)).toEqual({ applicationsTotal: 2, applicationsActive: 1 });
  });
  it('counts active = applied|shortlisted|hired only', () => {
    const apps = [
      { status: 'applied' }, { status: 'shortlisted' }, { status: 'hired' },
      { status: 'rejected' }, { status: 'reviewed' /* not a real status */ },
    ];
    const r = computeApplications(apps);
    expect(r.applicationsTotal).toBe(5);
    expect(r.applicationsActive).toBe(3);
  });
});

describe('countDeliveredContracts', () => {
  const me = '507f1f77bcf86cd799439011';
  it('counts only completed contracts where I am the artist', () => {
    const data = { meta: {}, data: { contracts: [
      { artistId: me, status: 'completed' },
      { artistId: me, status: 'active' },
      { artistId: 'someoneelse', status: 'completed' },
      { hirerId: me, artistId: 'x', status: 'completed' }, // I'm the hirer here — must NOT count
    ], total: 4 } };
    expect(countDeliveredContracts(data, me)).toBe(1);
  });
});

describe('aggregateEarnings', () => {
  const me = '507f1f77bcf86cd799439011';
  const now = new Date(2026, 6, 17, 12, 0, 0); // 2026-07-17 local
  const iso = (y: number, m: number, d: number) => new Date(y, m, d, 12, 0, 0).toISOString();
  const tx = { meta: {}, data: { transactions: [
    { toUserId: me, status: 'completed', artistReceived: 1000, createdAt: iso(2026, 6, 15) }, // this month, in-week
    { toUserId: me, status: 'paid',      artistReceived: 500,  createdAt: iso(2026, 6, 2) },  // this month, older than 7d
    { toUserId: me, status: 'created',   artistReceived: 999,  createdAt: iso(2026, 6, 16) }, // pending, not earned
    { toUserId: me, status: 'refunded',  artistReceived: 200,  createdAt: iso(2026, 6, 10) }, // excluded
    { toUserId: 'other', status: 'completed', artistReceived: 777, createdAt: iso(2026, 6, 15) }, // not mine
    { toUserId: me, status: 'confirmed', artistReceived: 300,  createdAt: iso(2026, 5, 20) }, // last month, not this month
  ], total: 6 } };

  it('sums this-month received to earnedThisMonth', () => {
    const r = aggregateEarnings(tx, me, now);
    expect(r.earnedThisMonth).toBe(1500); // 1000 + 500 (not the 300 from June, not pending/refunded/other)
  });
  it('counts pending (created|recorded) that are mine', () => {
    expect(aggregateEarnings(tx, me, now).pendingPayouts).toBe(1);
  });
  it('produces a 7-number sparkline, oldest→newest, with the in-week receipt bucketed', () => {
    const r = aggregateEarnings(tx, me, now);
    expect(r.sparkline).toHaveLength(7);
    // 2026-07-15 is 2 days before 07-17 → index 4 of 7 (indices 0..6 map to days -6..0)
    expect(r.sparkline[4]).toBe(1000);
    expect(r.sparkline.reduce((a, b) => a + b, 0)).toBe(1000); // only the 07-15 receipt falls in the last 7 days
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd netsa-frontend && npx jest artistNumbers.helpers --silent`
Expected: FAIL — "Cannot find module '../artistNumbers.helpers'".

- [ ] **Step 3: Write the implementation**

Create `netsa-frontend/src/hooks/artistNumbers.helpers.ts`:

```ts
/**
 * Pure aggregation helpers for the artist-home "By the Numbers" grid.
 * Kept framework-free so they are trivially unit-testable; the hooks in
 * useArtistNumbers / useArtistEarnings / useDeliveredCount wrap them.
 */

/** Unwrap the various response shapes into an array (bare | {data} | {items}). */
export function safeArr(x: any): any[] {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (Array.isArray(x.data)) return x.data;
  if (Array.isArray(x.items)) return x.items;
  return [];
}

const ACTIVE_APP_STATUSES = new Set(['applied', 'shortlisted', 'hired']);

/** Applications total + active. Handles the wrapped `{ meta, data: [...] }` shape. */
export function computeApplications(appsData: any): {
  applicationsTotal: number;
  applicationsActive: number;
} {
  const apps = safeArr(appsData);
  return {
    applicationsTotal: apps.length,
    applicationsActive: apps.filter((a: any) =>
      ACTIVE_APP_STATUSES.has(String(a?.status ?? '').toLowerCase()),
    ).length,
  };
}

/**
 * Delivered = completed contracts where I am the ARTIST. The endpoint returns
 * contracts where I'm hirer OR artist ($or), so we filter client-side by
 * artistId rather than trusting the server `total`.
 */
export function countDeliveredContracts(contractsData: any, myId: string): number {
  const contracts = safeArr(contractsData?.data?.contracts);
  return contracts.filter(
    (c: any) =>
      String(c?.artistId) === String(myId) &&
      String(c?.status ?? '').toLowerCase() === 'completed',
  ).length;
}

const RECEIVED_STATUSES = new Set(['paid', 'confirmed', 'completed']);
const PENDING_STATUSES = new Set(['created', 'recorded']);

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Aggregate the caller's earnings from the transactions envelope.
 * - earnedThisMonth: Σ artistReceived for received-status txns dated this (local) month.
 * - pendingPayouts:  count of created|recorded txns addressed to me.
 * - sparkline:       7 daily Σ artistReceived buckets, oldest→newest, for the last 7 days.
 * `now` is injected for deterministic tests. Month boundary is device-local
 * (IST on target devices).
 */
export function aggregateEarnings(
  txData: any,
  myId: string,
  now: Date,
): { earnedThisMonth: number; pendingPayouts: number; sparkline: number[] } {
  const txs = safeArr(txData?.data?.transactions ?? txData);
  const mine = txs.filter((t: any) => String(t?.toUserId) === String(myId));

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    keys.push(dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)));
  }
  const buckets: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));

  let earnedThisMonth = 0;
  let pendingPayouts = 0;

  for (const t of mine) {
    const status = String(t?.status ?? '').toLowerCase();
    const amt = Number(t?.artistReceived ?? 0) || 0;
    if (PENDING_STATUSES.has(status)) pendingPayouts += 1;
    if (!RECEIVED_STATUSES.has(status)) continue;
    const created = t?.createdAt ? new Date(t.createdAt) : null;
    if (!created || Number.isNaN(created.getTime())) continue;
    if (created >= monthStart) earnedThisMonth += amt;
    const k = dayKey(created);
    if (k in buckets) buckets[k] += amt;
  }

  return { earnedThisMonth, pendingPayouts, sparkline: keys.map((k) => buckets[k]) };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd netsa-frontend && npx jest artistNumbers.helpers --silent`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
cd netsa-frontend && git add src/hooks/artistNumbers.helpers.ts src/hooks/__tests__/artistNumbers.helpers.test.ts
git commit -m "feat(artist-home): add pure KPI aggregation helpers"
```

---

### Task 2: Query keys + Delivered & Earnings hooks

**Files:**
- Modify: `netsa-frontend/src/constants/queryKeys.ts` (artist namespace, after line 52 `conversations`)
- Create: `netsa-frontend/src/hooks/useDeliveredCount.ts`
- Create: `netsa-frontend/src/hooks/useArtistEarnings.ts`

**Interfaces:**
- Consumes: `countDeliveredContracts`, `aggregateEarnings` (Task 1); `contractService`, `transactionService` from `../services/paymentService`; `useAuthStore`; `queryKeys`.
- Produces:
  - `queryKeys.artist.earnings(): ['artist','earnings']`, `deliveredCount(): ['artist','deliveredCount']`, `profileViews(): ['artist','profileViews']`
  - `useDeliveredCount(): UseQueryResult<number>`
  - `useArtistEarnings(): UseQueryResult<{ earnedThisMonth; pendingPayouts; sparkline }>`

- [ ] **Step 1: Add the query keys**

In `netsa-frontend/src/constants/queryKeys.ts`, inside the `artist:` object, add after the `conversations` member:

```ts
    conversations: () => ['artist', 'conversations'] as const,
    earnings: () => ['artist', 'earnings'] as const,
    deliveredCount: () => ['artist', 'deliveredCount'] as const,
    profileViews: () => ['artist', 'profileViews'] as const,
```

- [ ] **Step 2: Create the Delivered hook**

Create `netsa-frontend/src/hooks/useDeliveredCount.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { contractService } from '../services/paymentService';
import { useAuthStore } from '../stores/authStore';
import { queryKeys } from '../constants/queryKeys';
import { countDeliveredContracts } from './artistNumbers.helpers';

/**
 * Delivered = completed contracts where I am the artist. The endpoint returns
 * contracts where I'm hirer OR artist, so `select` filters client-side.
 * KNOWN LIMIT: aggregates the most recent 100 completed contracts.
 */
export function useDeliveredCount() {
  const myId = useAuthStore((s) => s.user?._id);
  return useQuery({
    queryKey: queryKeys.artist.deliveredCount(),
    queryFn: () => contractService.getUserContracts({ status: 'completed', pageSize: 100 }),
    enabled: !!myId,
    staleTime: 1000 * 60 * 2,
    select: (raw) => countDeliveredContracts(raw, myId ?? ''),
  });
}

export default useDeliveredCount;
```

- [ ] **Step 3: Create the Earnings hook**

Create `netsa-frontend/src/hooks/useArtistEarnings.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../services/paymentService';
import { useAuthStore } from '../stores/authStore';
import { queryKeys } from '../constants/queryKeys';
import { aggregateEarnings } from './artistNumbers.helpers';

/**
 * Earnings for the KPI grid, aggregated client-side from the transactions feed.
 * KNOWN LIMIT: sums the most recent 100 transactions (endpoint has no date/aggregate).
 */
export function useArtistEarnings() {
  const myId = useAuthStore((s) => s.user?._id);
  return useQuery({
    queryKey: queryKeys.artist.earnings(),
    queryFn: () => transactionService.getUserTransactions({ pageSize: 100 }),
    enabled: !!myId,
    staleTime: 1000 * 60 * 2,
    select: (raw) => aggregateEarnings(raw, myId ?? '', new Date()),
  });
}

export default useArtistEarnings;
```

- [ ] **Step 4: Typecheck the new files**

Run: `cd netsa-frontend && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "useDeliveredCount|useArtistEarnings|queryKeys" || echo "no type errors in new files"`
Expected: `no type errors in new files`.
(If `tsc` crashes with a stack overflow, use `node --stack-size=8000 node_modules/typescript/lib/tsc.js --noEmit` instead.)

- [ ] **Step 5: Commit**

```bash
cd netsa-frontend && git add src/constants/queryKeys.ts src/hooks/useDeliveredCount.ts src/hooks/useArtistEarnings.ts
git commit -m "feat(artist-home): add delivered + earnings query hooks and keys"
```

---

### Task 3: Wire the hooks into useArtistNumbers (Applications + Delivered + Earnings)

**Files:**
- Modify: `netsa-frontend/src/hooks/useArtistNumbers.ts` (full rewrite of the compute body)
- Test: `netsa-frontend/src/components/dashboard/artist/__tests__/ByTheNumbersArtist.smoke.test.tsx` (already mocks `useArtistNumbers`; extend to assert the shape still holds — no change required unless the interface changes; it does not)

**Interfaces:**
- Consumes: `computeApplications` (Task 1), `useDeliveredCount` + `useArtistEarnings` (Task 2), existing `useApplications`, `useHeroData`.
- Produces: unchanged `ArtistNumbers` interface (already has all fields).

- [ ] **Step 1: Rewrite useArtistNumbers body**

Replace the body of `netsa-frontend/src/hooks/useArtistNumbers.ts` from the imports through the end of `useArtistNumbers` with:

```ts
import { useMemo } from 'react';
import useApplications from './useApplications';
import useHeroData from './useHeroData';
import useDeliveredCount from './useDeliveredCount';
import useArtistEarnings from './useArtistEarnings';
import { computeApplications } from './artistNumbers.helpers';

export interface ArtistNumbers {
  earnedThisMonth: number;
  profileViews: number;
  profileViewsDelta: number;
  applicationsTotal: number;
  applicationsActive: number;
  delivered: number;
  rating: number;
  reviewCount: number;
  pendingPayouts: number;
  sparkline: number[];
}

export function useArtistNumbers(): { data: ArtistNumbers; isLoading: boolean } {
  const appsQ = useApplications();
  const heroQ = useHeroData();
  const deliveredQ = useDeliveredCount();
  const earningsQ = useArtistEarnings();

  const data = useMemo<ArtistNumbers>(() => {
    const { applicationsTotal, applicationsActive } = computeApplications(appsQ.data);
    const user: any = heroQ.data ?? {};
    const earnings = earningsQ.data ?? { earnedThisMonth: 0, pendingPayouts: 0, sparkline: [] };

    return {
      earnedThisMonth: earnings.earnedThisMonth,
      profileViews: 0, // wired in Phase B
      profileViewsDelta: 0, // wired in Phase B
      applicationsTotal,
      applicationsActive,
      delivered: deliveredQ.data ?? 0,
      rating: user?.cached?.averageRating ?? 0,
      reviewCount: user?.cached?.totalReviews ?? 0,
      pendingPayouts: earnings.pendingPayouts,
      sparkline: earnings.sparkline,
    };
  }, [appsQ.data, heroQ.data, deliveredQ.data, earningsQ.data]);

  // isLoading tracks the primary fetches; secondary tiles degrade to "—" individually.
  return { data, isLoading: appsQ.isLoading || heroQ.isLoading };
}

export default useArtistNumbers;
```

- [ ] **Step 2: Run the existing smoke test to verify the interface still renders**

Run: `cd netsa-frontend && npx jest ByTheNumbersArtist.smoke --silent`
Expected: PASS (2/2 — the component + its mocked hook are unchanged).

- [ ] **Step 3: Run the helper tests again (regression)**

Run: `cd netsa-frontend && npx jest artistNumbers.helpers --silent`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd netsa-frontend && git add src/hooks/useArtistNumbers.ts
git commit -m "feat(artist-home): wire applications fix, delivered, earnings into useArtistNumbers"
```

---

### Task 4: Invalidate the new keys on pull-to-refresh

**Files:**
- Modify: `netsa-frontend/app/(app)/dashboard/artist-home.tsx` (the `onRefresh` `Promise.all`, ~lines 78-89)

**Interfaces:**
- Consumes: `queryKeys.artist.earnings/deliveredCount/profileViews` (Task 2).

- [ ] **Step 1: Add invalidations**

In `netsa-frontend/app/(app)/dashboard/artist-home.tsx`, inside `onRefresh`'s `Promise.all([...])`, add these three lines alongside the existing artist invalidations (before the shared-reads comment):

```ts
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.earnings() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.deliveredCount() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.profileViews() }),
```

- [ ] **Step 2: Run the artist-home / dashboard tests (regression)**

Run: `cd netsa-frontend && npx jest artist-home dashboard --silent 2>&1 | tail -5`
Expected: PASS (or "No tests found" — acceptable; the change is a pure additive invalidation).

- [ ] **Step 3: Commit**

```bash
cd netsa-frontend && git add "app/(app)/dashboard/artist-home.tsx"
git commit -m "feat(artist-home): refresh invalidates earnings/delivered/profile-view keys"
```

**Phase A checkpoint:** Applications, Delivered, and Earnings now show real data. Profile Views still reads 0 until Phase B.

---

# PHASE B — Profile Views (full-stack: total + weekly delta)

### Task 5: ProfileView model

**Files:**
- Create: `netsa-backend/users-service/src/models/ProfileView.ts`

**Interfaces:**
- Produces: default-exported Mongoose model `ProfileView` with fields `{ viewerId, viewedUserId, day, at }`; unique index `(viewerId, viewedUserId, day)`; TTL index on `at` (90d); lookup index `(viewedUserId, at)`.

- [ ] **Step 1: Create the model**

Create `netsa-backend/users-service/src/models/ProfileView.ts` (mirrors `PasswordResetSession.ts` + `SavedTalent.ts` patterns):

```ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProfileView extends Document {
  viewerId: mongoose.Types.ObjectId;
  viewedUserId: mongoose.Types.ObjectId;
  day: string; // 'YYYY-MM-DD' (UTC) — per-day dedup bucket
  at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileViewSchema = new Schema<IProfileView>(
  {
    viewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    day: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One row per (viewer, viewed, day) — dedups repeat views within a day.
ProfileViewSchema.index({ viewerId: 1, viewedUserId: 1, day: 1 }, { unique: true });
// Weekly-delta lookups: "views of me in the last 7 days".
ProfileViewSchema.index({ viewedUserId: 1, at: -1 });
// TTL: auto-remove ~90 days after the view to bound growth.
ProfileViewSchema.index({ at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const ProfileView: Model<IProfileView> = mongoose.model<IProfileView>('ProfileView', ProfileViewSchema);
export default ProfileView;
```

- [ ] **Step 2: Typecheck**

Run: `cd netsa-backend/users-service && npx tsc --noEmit 2>&1 | grep ProfileView || echo "ProfileView types OK"`
Expected: `ProfileView types OK`.

- [ ] **Step 3: Commit**

```bash
cd netsa-backend/users-service && git add src/models/ProfileView.ts
git commit -m "feat(users): add ProfileView dedup model for profile-view tracking"
```

---

### Task 6: Profile-view controllers (record + summary) with tests

**Files:**
- Create: `netsa-backend/users-service/src/controllers/profileView.controller.ts`
- Test: `netsa-backend/users-service/src/tests/profileView.test.ts`

**Interfaces:**
- Consumes: `ProfileView` (Task 5), `Artist` model, `AuthRequest` from `../middleware/auth`.
- Produces:
  - `recordProfileView(req, res)` — `POST /:id/view` → 204; upserts the day-row; `$inc Artist.stats.profileViews` only on first insert; self/invalid → 204/400.
  - `getMyProfileViews(req, res)` — `GET /me/profile-views` → `{ meta, data: { total, last7 }, errors }`.

- [ ] **Step 1: Write the failing test**

Create `netsa-backend/users-service/src/tests/profileView.test.ts` (mirrors `savedTalent.test.ts` harness):

```ts
import request from 'supertest';

const mockPvUpdateOne = jest.fn();
const mockPvCount = jest.fn();
jest.mock('../models/ProfileView', () => ({
  __esModule: true,
  default: {
    updateOne: (...a: any[]) => mockPvUpdateOne(...a),
    countDocuments: (...a: any[]) => mockPvCount(...a),
  },
}));

const mockArtistUpdate = jest.fn();
const mockArtistFindOne = jest.fn();
jest.mock('../models/Artist', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: (...a: any[]) => mockArtistUpdate(...a),
    findOne: (...a: any[]) => mockArtistFindOne(...a),
  },
}));

// Authenticated viewer u1.
jest.mock('../middleware/auth', () => ({
  protect: (req: any, _res: any, next: any) => { req.user = { _id: 'u1', id: 'u1', role: 'artist' }; next(); },
}));
jest.mock('../config/db', () => jest.fn());

process.env.JWT_SECRET = 'test-secret';
import app from '../app';

const findOneLean = (row: any) => {
  const c: any = {};
  c.select = jest.fn(() => c);
  c.lean = jest.fn(() => Promise.resolve(row));
  return c;
};

const TARGET = '507f1f77bcf86cd799439011';

beforeEach(() => {
  mockPvUpdateOne.mockReset();
  mockPvCount.mockReset();
  mockArtistUpdate.mockReset();
  mockArtistFindOne.mockReset();
});

describe('POST /api/users/:id/view', () => {
  it('records a first daily view (204) and increments the artist counter', async () => {
    mockPvUpdateOne.mockResolvedValue({ upsertedCount: 1 });
    mockArtistUpdate.mockResolvedValue({});
    const res = await request(app).post(`/api/users/${TARGET}/view`);
    expect(res.status).toBe(204);
    const [filter, update, opts] = mockPvUpdateOne.mock.calls[0];
    expect(filter).toEqual(expect.objectContaining({ viewerId: 'u1', viewedUserId: TARGET }));
    expect(opts).toEqual(expect.objectContaining({ upsert: true }));
    expect(mockArtistUpdate).toHaveBeenCalledTimes(1);
    const [aFilter, aUpdate] = mockArtistUpdate.mock.calls[0];
    expect(aFilter).toEqual({ userId: TARGET });
    expect(aUpdate).toEqual({ $inc: { 'stats.profileViews': 1 } });
  });

  it('does NOT increment on a repeat same-day view (upsertedCount 0)', async () => {
    mockPvUpdateOne.mockResolvedValue({ upsertedCount: 0 });
    const res = await request(app).post(`/api/users/${TARGET}/view`);
    expect(res.status).toBe(204);
    expect(mockArtistUpdate).not.toHaveBeenCalled();
  });

  it('ignores a self-view (204, no writes)', async () => {
    const res = await request(app).post('/api/users/u1/view');
    expect(res.status).toBe(204);
    expect(mockPvUpdateOne).not.toHaveBeenCalled();
    expect(mockArtistUpdate).not.toHaveBeenCalled();
  });

  it('rejects a non-24-hex id with 400', async () => {
    const res = await request(app).post('/api/users/not-an-id/view');
    expect(res.status).toBe(400);
    expect(mockPvUpdateOne).not.toHaveBeenCalled();
  });
});

describe('GET /api/users/me/profile-views', () => {
  it('returns { total, last7 } from the artist counter + 7-day count', async () => {
    mockArtistFindOne.mockReturnValue(findOneLean({ stats: { profileViews: 1284 } }));
    mockPvCount.mockResolvedValue(38);
    const res = await request(app).get('/api/users/me/profile-views');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ total: 1284, last7: 38 });
    expect(mockArtistFindOne).toHaveBeenCalledWith({ userId: 'u1' });
    const countArg = mockPvCount.mock.calls[0][0];
    expect(countArg.viewedUserId).toBe('u1');
    expect(countArg.at).toHaveProperty('$gte');
  });

  it('defaults total to 0 when the caller has no Artist doc', async () => {
    mockArtistFindOne.mockReturnValue(findOneLean(null));
    mockPvCount.mockResolvedValue(0);
    const res = await request(app).get('/api/users/me/profile-views');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ total: 0, last7: 0 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd netsa-backend/users-service && npx jest profileView --silent`
Expected: FAIL — routes 404 / controller module not found.

- [ ] **Step 3: Write the controller**

Create `netsa-backend/users-service/src/controllers/profileView.controller.ts`:

```ts
import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import ProfileView from '../models/ProfileView';
import Artist from '../models/Artist';

/** UTC calendar day, 'YYYY-MM-DD'. */
function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** POST /api/users/:id/view — record a (deduped) profile view. */
export const recordProfileView = async (req: AuthRequest, res: Response) => {
  try {
    const viewerId = String(req.user!._id);
    const viewedUserId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(viewedUserId)) {
      return res.status(400).json({ meta: { status: 400, message: 'Invalid user id' }, data: null, errors: [] });
    }
    if (viewerId === String(viewedUserId)) {
      return res.status(204).send(); // ignore self-views
    }

    const day = utcDay(new Date());
    const result: any = await ProfileView.updateOne(
      { viewerId, viewedUserId, day },
      { $setOnInsert: { at: new Date() } },
      { upsert: true }
    );

    // Only the first unique-day view bumps the cached lifetime counter.
    // No upsert on Artist: non-artist targets simply don't accumulate views.
    if (result?.upsertedCount && result.upsertedCount > 0) {
      await Artist.findOneAndUpdate(
        { userId: viewedUserId },
        { $inc: { 'stats.profileViews': 1 } }
      );
    }
    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === 11000) return res.status(204).send(); // race on the unique index — already counted
    console.error('[ProfileView] record error:', err.message);
    return res.status(500).json({ meta: { status: 500, message: 'Server error' }, data: null, errors: [] });
  }
};

/** GET /api/users/me/profile-views — { total (lifetime), last7 (weekly delta) }. */
export const getMyProfileViews = async (req: AuthRequest, res: Response) => {
  try {
    const me = String(req.user!._id);
    const artist: any = await Artist.findOne({ userId: me }).select('stats.profileViews').lean();
    const total = artist?.stats?.profileViews ?? 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7 = await ProfileView.countDocuments({ viewedUserId: me, at: { $gte: sevenDaysAgo } });
    return res.json({ meta: { status: 200, message: 'OK' }, data: { total, last7 }, errors: [] });
  } catch (err: any) {
    console.error('[ProfileView] summary error:', err.message);
    return res.status(500).json({ meta: { status: 500, message: 'Server error' }, data: null, errors: [] });
  }
};
```

- [ ] **Step 4: Register the routes**

In `netsa-backend/users-service/src/routes/users.ts`, add the import near the other controller imports:

```ts
import { recordProfileView, getMyProfileViews } from '../controllers/profileView.controller';
```

Then add these two lines **before** the `router.get('/:id', getUserById);` line (keeping literal-before-parametric order):

```ts
router.get('/me/profile-views', protect, getMyProfileViews);
router.post('/:id/view', protect, recordProfileView);
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd netsa-backend/users-service && npx jest profileView --silent`
Expected: PASS (6/6).

- [ ] **Step 6: Commit**

```bash
cd netsa-backend/users-service && git add src/controllers/profileView.controller.ts src/routes/users.ts src/tests/profileView.test.ts
git commit -m "feat(users): profile-view record + summary endpoints with dedup"
```

---

### Task 7: Frontend authService methods + useProfileViews hook + wire into grid

**Files:**
- Modify: `netsa-frontend/src/services/authService.ts` (add two methods inside the `authService` object, before the closing `};` at line 210)
- Create: `netsa-frontend/src/hooks/useProfileViews.ts`
- Modify: `netsa-frontend/src/hooks/useArtistNumbers.ts` (consume `useProfileViews`)

**Interfaces:**
- Consumes: `queryKeys.artist.profileViews` (Task 2), `useAuthStore`.
- Produces:
  - `authService.recordProfileView(id: string): Promise<void>` (fire-and-forget)
  - `authService.getMyProfileViews(): Promise<{ total: number; last7: number }>`
  - `useProfileViews(): UseQueryResult<{ total: number; last7: number }>`

- [ ] **Step 1: Add authService methods**

In `netsa-frontend/src/services/authService.ts`, inside the `authService` object (before its closing `};`), add:

```ts
  recordProfileView: async (id: string): Promise<void> => {
    // Fire-and-forget: a failed view record must never disrupt the profile view.
    try {
      await API.post(`/users/${id}/view`);
    } catch {
      /* ignore */
    }
  },

  getMyProfileViews: async (): Promise<{ total: number; last7: number }> => {
    const res = await API.get('/users/me/profile-views');
    return res.data?.data ?? { total: 0, last7: 0 };
  },
```

- [ ] **Step 2: Create the read hook**

Create `netsa-frontend/src/hooks/useProfileViews.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import authService from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { queryKeys } from '../constants/queryKeys';

export function useProfileViews() {
  const myId = useAuthStore((s) => s.user?._id);
  return useQuery({
    queryKey: queryKeys.artist.profileViews(),
    queryFn: () => authService.getMyProfileViews(),
    enabled: !!myId,
    staleTime: 1000 * 60 * 5,
  });
}

export default useProfileViews;
```

- [ ] **Step 3: Wire into useArtistNumbers**

In `netsa-frontend/src/hooks/useArtistNumbers.ts`: add the import `import useProfileViews from './useProfileViews';`, add `const viewsQ = useProfileViews();` alongside the other query hooks, replace the two `profileViews`/`profileViewsDelta` lines in the returned object, and add `viewsQ.data` to the `useMemo` deps:

```ts
    const views = viewsQ.data ?? { total: 0, last7: 0 };
    // ...in the returned object:
      profileViews: views.total,
      profileViewsDelta: views.last7,
```
Deps array becomes: `[appsQ.data, heroQ.data, deliveredQ.data, earningsQ.data, viewsQ.data]`.

- [ ] **Step 4: Run the smoke test (interface unchanged) + typecheck**

Run: `cd netsa-frontend && npx jest ByTheNumbersArtist.smoke --silent`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
cd netsa-frontend && git add src/services/authService.ts src/hooks/useProfileViews.ts src/hooks/useArtistNumbers.ts
git commit -m "feat(artist-home): wire profile views (total + weekly delta) into the grid"
```

---

### Task 8: Fire the view POST from the profile screens

**Files:**
- Modify: `netsa-frontend/src/features/profile/PerformerProfile.tsx` (add a mount effect after the hook block, before the first early return at line 48)
- Modify: `netsa-frontend/src/features/profile/ProfileScreen.tsx` (add a gated effect after `const user = ...` at line 85, before the early returns at line 88)

**Interfaces:**
- Consumes: `authService.recordProfileView` (Task 7).

- [ ] **Step 1: PerformerProfile — always non-owner, fire on mount**

In `netsa-frontend/src/features/profile/PerformerProfile.tsx`, ensure `useEffect` and `authService` are imported (`import { useEffect } from 'react';` merged into the existing React import; `import authService from '@/services/authService';`). Add, immediately after the last hook call (~line 46) and before the `if (isLoading && !data)` early return:

```ts
  // Record a profile view. This screen only renders for a client viewing
  // another person's performer profile, so it is always a non-owner view.
  useEffect(() => {
    if (userId) authService.recordProfileView(userId);
  }, [userId]);
```

- [ ] **Step 2: ProfileScreen — gate on non-owner**

In `netsa-frontend/src/features/profile/ProfileScreen.tsx`, ensure `useEffect` and `authService` are imported. Add, immediately after `const user = isOwner ? authUser : fetchedUser;` (~line 85) and before the loading/error early returns:

```ts
  // Record a profile view only when someone views *another* person's profile.
  useEffect(() => {
    if (!isOwner && userId && authUser?._id && authUser._id !== userId) {
      authService.recordProfileView(userId);
    }
  }, [isOwner, userId, authUser?._id]);
```

- [ ] **Step 3: Verify the screens still compile / tests pass**

Run: `cd netsa-frontend && npx jest PerformerProfile ProfileScreen --silent 2>&1 | tail -6`
Expected: PASS (or "No tests found" for those names — acceptable; the change is an additive effect). If a `reels`/existing profile test runs, it must stay green.

- [ ] **Step 4: Commit**

```bash
cd netsa-frontend && git add src/features/profile/PerformerProfile.tsx src/features/profile/ProfileScreen.tsx
git commit -m "feat(profile): record a profile view on non-owner profile open"
```

---

### Task 9: Full-suite regression + manual smoke

**Files:** none (verification only)

- [ ] **Step 1: Frontend suite**

Run: `cd netsa-frontend && npx jest --silent 2>&1 | tail -12`
Expected: no NEW failures vs. the pre-change baseline (compare against `git stash` baseline if unsure). The helper + smoke tests are green.

- [ ] **Step 2: Backend users-service suite**

Run: `cd netsa-backend/users-service && npm test 2>&1 | tail -15`
Expected: `profileView.test.ts` green; no regressions in the existing suite.

- [ ] **Step 3: Manual smoke (document, do not automate)**

Confirm on a running app: open another artist's profile as a different user → `POST /users/:id/view` returns 204; open your own artist-home → the grid shows non-zero Applications/Delivered/Earnings where data exists, and Profile Views shows the count with a "+N this week" delta. Re-opening the same profile the same day does not increment the counter.

- [ ] **Step 4: Final commit (if any doc/notes changed)**

```bash
cd netsa-frontend && git add -A && git commit -m "chore(artist-home): KPI grid fully live — regression verified" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage:**
- Part 1 Applications → Task 1 (helper + test) + Task 3 (wire). ✓ (unwrap bug + status enum fixed)
- Part 2 Delivered → Task 1 (`countDeliveredContracts`) + Task 2 (`useDeliveredCount`) + Task 3. ✓ (client-side `artistId` filter per the verified `$or` endpoint behavior — spec corrected)
- Part 3 Earnings → Task 1 (`aggregateEarnings`) + Task 2 (`useArtistEarnings`) + Task 3. ✓ (status sets, sparkline, pending; reuses existing `transactionService`)
- Part 4 Profile views → Tasks 5–8 (model, endpoints+tests, service+hook+wire, fire from screens). ✓ (total + weekly delta; Artist-doc-absent handled by no-upsert + default 0)
- Refresh invalidation → Task 4. ✓

**Placeholder scan:** No TBD/TODO; every code step contains real code; every test step has real assertions. ✓

**Type/name consistency:** `computeApplications`, `countDeliveredContracts`, `aggregateEarnings`, `safeArr` are defined in Task 1 and consumed by the exact same names in Tasks 2–3; `recordProfileView`/`getMyProfileViews` defined in Task 6 and imported by the same names in Task 6 routes + Task 7 service; `queryKeys.artist.earnings/deliveredCount/profileViews` defined in Task 2 and used in Tasks 2/4/7. ✓

**Known limits (carried from spec, surfaced not hidden):** earnings/delivered aggregate the most recent 100 rows (endpoint has no server-side aggregate); role-switchers without an Artist doc show `total: 0` even if `last7 > 0` (rare). Both documented in code comments.
