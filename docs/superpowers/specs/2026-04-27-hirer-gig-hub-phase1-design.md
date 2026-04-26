# Hirer Gig Project Hub — Phase 1 Design

**Date:** 2026-04-27
**Owner:** Rohit
**Status:** Spec — pending implementation plan
**Mockup:** `DOCS/designs/hirer-gig-hub-v4.html`

## Problem

The current `/gigs/[id]` page is a tab-based gig detail view that mixes the public artist-side experience (about / talent / schedule / apply / terms) with hirer management (applications tab). For a hirer who owns the gig, the page does not surface what they actually need to do — it forces tab navigation and hides post-hire status.

Per PRD §8.3.3 (Project Hub Model, April 2026 revision), the canonical post-hire destination is a **per-gig project hub**: single-scroll, action-first, no tabs. The hub becomes the source of truth for one specific gig — applicants, hires, contracts, payments, terms — all visible without navigation.

This Phase 1 ships the hub as the hirer-owner view of `/gigs/[id]`. The public artist-side view of the same route remains unchanged.

## Goals

- When an authenticated user opens `/gigs/[id]` and is the gig's owner, render the **Project Hub** layout instead of the current tab-based detail view.
- Public artist-side view of `/gigs/[id]` (visitors, applicants) is **unchanged**.
- No new backend endpoints. Reuse `useGigApplications`, `useUserContracts({ gigId })`, existing gig fetch.
- Single source of truth: the hub IS the management surface for this gig. Future Phase 2 adds the Booking Terms editor accessed from the hub; Phase 3 rewrites Contract Workspace at `/contracts/[id]`.

## Non-goals

- Booking Terms editor (Phase 2).
- Contract Workspace rewrite (Phase 3).
- Razorpay payment execution (separate work).
- Cross-gig "Bookings" tab — explicitly deferred per PRD §8.3.3.4.
- Artist-side per-gig hub — out of scope for this phase.
- Activity log derivation across hires.

## Architecture

```
app/(app)/gigs/[id].tsx
  ├─ useGig(:id) → gig
  ├─ useAuthStore → currentUser
  ├─ const isOwner = gig.organizerId === currentUser._id
  │
  ├─ if (isOwner) → <HirerGigHub gig={gig} />
  └─ else        → <PublicGigDetail gig={gig} />   // existing GigDetails.tsx
```

`HirerGigHub` is a new component composed of section primitives. Each section reads from its own data hook (or shares the gig prop) — no central data store required.

## Information architecture (locked, per mockup v4)

Sections, top to bottom:

| # | Section | Component | Data |
|---|---------|-----------|------|
| 1 | Header | inline JSX | `router.back()` + share + menu |
| 2 | Hero | `HubHero` | gig.status, gig.title, gig.eventFunction, gig.location, gig.startDate |
| 3 | KPIs (3 cells: Applied · Hired · Paid·Due) | `HubKPIs` | applications + contracts + transactions |
| 4 | Your team | `HubTeamSection` | hired applications + their contracts |
| 5 | Booking terms | `HubBookingTermsCard` | gig template fields (paymentStructure, cancellation, customClauses) |
| 6 | Applicants | `HubApplicantsSection` | non-hired applications (filterable) |
| 7 | Gig essentials | `HubEssentials` (collapsed accordion) | gig posted date, visibility, scope |
| 8 | Sticky bottom CTA | inline | computed: highest-priority action |

The sections are intentionally independent — adding a new section in a future phase doesn't ripple through.

## Data composition

The hub needs data from three sources:

1. **The gig itself** — `useGig(:id)` (already exists).
2. **Applications for this gig** — `useGigApplications(:id)` (already exists, returns array of `GigApplication`).
3. **Contracts for this gig** — `useUserContracts({ gigId })` — verify the existing hook accepts `gigId` filter; if not, add it (one-line addition).

A thin selector hook combines them:

```ts
// netsa-mobile/src/features/hirer-hub/hooks/useGigHubData.ts
export function useGigHubData(gigId: string) {
    const { data: gig, ... } = useGig(gigId);
    const { data: applications = [], ... } = useGigApplications(gigId);
    const { data: contractsRes, ... } = useUserContracts({ gigId });
    const contracts = contractsRes?.data?.contracts ?? [];

    const teamRows = useMemo(() => {
        return applications
            .filter(a => a.status === 'hired')
            .map(a => ({
                application: a,
                contract: contracts.find(c => c.artistId === a.artistId),
            }));
    }, [applications, contracts]);

    const pendingApplicants = useMemo(() => {
        return applications.filter(a => a.status !== 'hired' && a.status !== 'rejected');
    }, [applications]);

    const kpis = useMemo(() => ({
        appliedCount: applications.length,
        hiredCount: applications.filter(a => a.status === 'hired').length,
        slotsTotal: gig?.requirements?.headcount || teamRows.length,
        paidAmount: contracts.reduce((s, c) => s + (c.paidAmount || 0), 0),
        dueAmount: contracts.reduce((s, c) => s + ((c.terms?.amount || 0) - (c.paidAmount || 0)), 0),
    }), [applications, contracts, gig]);

    return { gig, applications, contracts, teamRows, pendingApplicants, kpis, ... };
}
```

If `Contract` model doesn't expose `paidAmount`, derive from joined transactions (or add a server-side computed field — defer to Phase 3 if not trivial). For Phase 1, paidAmount can be 0 if not derivable; the KPI still shows reasonable defaults.

## Component layout

```
src/features/hirer-hub/
  HirerGigHub.tsx                   # orchestrator (~150 lines)
  components/
    HubHero.tsx                     # status pill + serif title + meta
    HubKPIs.tsx                     # 3-cell numeric strip
    HubTeamSection.tsx              # team header + rows + + slots
    HubTeamRow.tsx                  # single hire row with mini timeline
    HubMiniTimeline.tsx             # 4-node contract progress
    HubBookingTermsCard.tsx         # terms summary card + Preview/Edit buttons (Phase 2 wires Edit)
    HubApplicantsSection.tsx        # filter chips + compact list + "see all"
    HubApplicantRow.tsx             # single applicant row
    HubEssentials.tsx               # collapsed accordion
    HubStickyCTA.tsx                # bottom sticky action (computed)
  hooks/
    useGigHubData.ts                # selector hook combining apps + contracts
  utils/
    computeContractStage.ts         # contract → 4-stage timeline state
    computeTeamRowAction.ts         # team row → CTA label + handler
    computeStickyCTA.ts             # hub → priority action (review applicants / pay due / etc)
  __tests__/
    HirerGigHub.behavior.test.tsx
    computeContractStage.test.ts
    computeTeamRowAction.test.ts
```

The orchestrator stays thin (~150 lines after extraction). Each component is < 100 lines, single responsibility.

## Branching at `/gigs/[id]`

In `app/(app)/gigs/[id].tsx`:

```tsx
export default function GigDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: gig, isLoading } = useGig(id);
    const user = useAuthStore((s) => s.user);

    if (isLoading) return <CenterSpinner />;
    if (!gig) return <NotFound />;

    const isOwner = !!user?._id &&
        (gig.organizerId === user._id || gig.organizerId?._id === user._id);

    if (isOwner) {
        return <HirerGigHub gig={gig} />;
    }

    // existing public artist-side view (unchanged)
    return <PublicGigDetailLegacy gig={gig} />;
}
```

`PublicGigDetailLegacy` is the existing tab-based `GigDetails.tsx` — renamed only if necessary; unchanged behavior.

## State machine — contract stage (4-node timeline)

Used by `HubMiniTimeline` and `computeContractStage`.

```
Stage 1: Sent (always done — contract was sent at hire time)
Stage 2: Signed
Stage 3: Advance Paid
Stage 4: Final Done

Node states: 'done' | 'active' | 'pending'
Node colors: green (done) | orange/gold/purple (active, by reason) | grey (pending)
```

Mapping rules:

| Contract state | Node 1 | Node 2 | Node 3 | Node 4 |
|---|---|---|---|---|
| `pending_artist_signature` | done | active(purple) | pending | pending |
| `pending_guardian_cosign` | done | active(purple) | pending | pending |
| `signed` / `active`, advance unpaid | done | done | active(gold) | pending |
| `signed` / `active`, advance paid, future event | done | done | done | pending |
| `signed` / `active`, balance due | done | done | done | active(gold) |
| `completed` | done | done | done | done |
| `disputed` | active(red) overlay on current node | | | |
| `cancelled` | grey overlay all | | | |

When `disputed`, the current node is shown in red. When `cancelled`, all nodes go grey.

## State machine — team row CTA

Used by `computeTeamRowAction`.

| Contract state | Primary CTA | Handler |
|---|---|---|
| `pending_artist_signature` < 24h | "Sent · waiting" (disabled info) | none |
| `pending_artist_signature` 24-48h | "Nudge" | nudge endpoint (Phase 3) |
| `pending_artist_signature` > 48h | "Cancel offer" | cancel endpoint |
| `pending_guardian_cosign` | "Waiting · guardian" (disabled) | none |
| `signed`, on-platform, advance unpaid | "Pay ₹X" (disabled in Phase 1 — Razorpay not wired) | placeholder Alert "Coming soon" |
| `signed`, off-platform, advance unpaid | "Record Payment" (disabled in Phase 1) | placeholder Alert |
| `signed`, advance paid, future event | "View" | router.push(`/contracts/${id}`) |
| `signed`, balance due | "Pay balance ₹X" (disabled in Phase 1) | placeholder Alert |
| `completed` | "Leave a review" (disabled — Phase 3) | placeholder |
| `disputed` | "Resolve dispute" (disabled — Phase 3) | placeholder |
| `cancelled` | "View · cancelled" | router.push(`/contracts/${id}`) |

**Phase 1 reality:** all "View" CTAs route to existing `/contracts/[id]`. All payment / nudge / dispute CTAs render but show "Coming soon" Alert until Phase 3 wires them.

## Booking terms card (Phase 1 read-only)

Renders the gig's template terms as a summary:
- Pay structure (e.g., "30/70 advance")
- Cancellation policy (e.g., "48h notice · full forfeit")
- Compensation (e.g., "₹50K lead · ₹15K each")
- Custom clauses count

Two buttons:
- **Preview as artists see** → routes to a future preview modal (Phase 2 — for now disabled, shows "Coming soon")
- **Edit terms** → routes to `/gigs/[id]/booking-terms` (Phase 2). Phase 1: button is rendered but disabled with tooltip "Editor ships in Phase 2".

The propagation note ("Edits apply to new hires only. X existing contracts keep sealed terms.") is rendered conditionally based on `teamRows.length > 0`.

## Sticky bottom CTA

Computed by `computeStickyCTA(hubData)`:

| Condition | CTA label | Action |
|---|---|---|
| `pendingApplicants.length > 0` | "Review applicants · X" | scroll to Applicants section |
| else, any team row has urgent action | label of urgent action | route to that action |
| else | "Manage team" | scroll to Your team section |

If no applicants AND all hires are clean → "Manage team" is a no-op visual cue.

## Edge cases

- **Gig not loaded yet** — show centered spinner. Do not render hub partially.
- **Gig load error** — error card with retry button.
- **User is not the owner** — fall through to public view (existing behavior).
- **Owner but `gig.organizerId` is a populated ref vs ID string** — check both shapes (matches the existing `useGigActions.ts` defensive lookup).
- **No applications yet** — Applicants section shows empty state "No applications yet · Boost this gig".
- **No hires yet** — Your team section shows only `+ + +` empty placeholders with copy "Tap an applicant to hire."
- **All slots filled** — empty `+` placeholders disappear; sticky CTA changes to "Manage team."
- **Gig is closed/paused** — hero status pill changes; banner above Your team: "Gig closed · no new applicants will arrive."
- **Contracts hook returns undefined** — gracefully default `paidAmount` to 0; KPIs display `₹0 paid · ₹X due`.
- **`gig.requirements.headcount` missing** — fall back to `teamRows.length` so KPI shows "3/3 Hired" not "3/—".

## Testing

**Unit tests (pure logic):**
1. `computeContractStage(contract)` — every `Contract` state maps to the correct timeline node states. 8 test cases.
2. `computeTeamRowAction(contract)` — every state returns the right CTA label + disabled flag. 8 test cases.
3. `computeStickyCTA(hubData)` — applicants > 0 → "Review applicants"; no applicants + urgent team → urgent label; else "Manage team". 5 test cases.

**Component tests (`@testing-library/react-native`):**
4. `HirerGigHub` mounts with sample gig + applications + contracts; all 7 sections render in order.
5. Branching: when current user IS owner, hub renders; when NOT owner, falls through to public view.
6. Empty state: 0 applicants → Applicants section shows empty copy; 0 hires → empty `+` placeholders show.
7. Sticky CTA: with 11 pending applicants, button reads "Review applicants · 11".

**Smoke test:**
8. Full mount with realistic data shape (1 hire signed, 1 hire awaiting sign, 1 hire payment-due) — no crash, no console errors.

## Risks

- **Existing `useUserContracts` may not accept `gigId` filter.** If not, add a one-line filter to the service layer. Backend already supports query params.
- **Branching at `/gigs/[id]` could break ProfileScreen → gig deep-link** if any caller assumes the public view always renders. Check call sites for assumptions about specific elements (e.g., apply button selectors). Mitigation: smoke test the public path is unchanged when `isOwner === false`.
- **`HirerGigHub` size growth** — at ~6 sections it could bloat. Mitigation: extract section components from day 1 (component layout above), don't inline.
- **Contract model field gaps** — `paidAmount` may not exist on Contract. Mitigation: derive from `Transaction` collection or default to 0 in Phase 1. Document the gap for Phase 3 to backfill.

## Out of scope (deferred to later phases)

- **Booking Terms editor** — Phase 2.
- **Contract Workspace rewrite** — Phase 3.
- **Razorpay execute, Record Payment, Nudge endpoint, Open dispute** — Phase 3.
- **Notification badging on team rows** — could be added in a polish pass.
- **Drag-to-reorder applicants** — out of scope.
- **Bulk shortlist + Compare** — deferred (PRD §8.3.2 already mentions; not Phase 1).
- **Match score on applicant cards** — backend compute deferred; UI shows "—" until backend ships.

## Cleanup tasks

- Once shipped, remove unused tab logic from `GigDetails.tsx` if owner-side tabs become unreferenced — verify by searching for tab-key usage in tests/screens.
- Decide whether `GigDetails.tsx` should be renamed to `PublicGigDetailLegacy.tsx` for clarity. Defer until Phase 1 lands.
