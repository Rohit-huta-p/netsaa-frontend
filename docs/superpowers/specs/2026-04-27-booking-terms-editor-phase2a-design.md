# Booking Terms Editor — Phase 2A Design

**Date:** 2026-04-27
**Owner:** Rohit
**Status:** Spec — pending implementation plan
**Mockup:** `DOCS/designs/booking-terms-editor.html`
**Depends on:** Phase 1 hub shipped (commit `152f8ae`).

## Problem

Phase 1's `HubBookingTermsCard` renders a read-only summary of the gig's master booking terms. Both action buttons (`Preview as artists see`, `Edit terms`) currently show "Coming soon" Alerts. Per PRD §8.3.3.6, hirers need to:

1. **Preview** what artists see when applying — closes the trust loop ("am I asking applicants to agree to something fair?").
2. **Edit** the master template terms that get instantiated into per-hire contracts at hire time.

The gig schema currently has `compensation.negotiable` and a freeform `termsAndConditions` string. It lacks the structured fields the editor needs (payment structure, cancellation policy).

## Goals

- Hub's `Preview as artists see` button opens a read-only modal rendering the gig's terms exactly as artists see them in the Apply modal Stage 1 panel.
- Hub's `Edit terms` button navigates to a focused editor screen at `/gigs/[id]/booking-terms`.
- Editor screen has 3 sections (Phase 2A):
  - Payment structure (Full upfront / 30/70 advance — default 30/70 for ≥ ₹50K)
  - Cancellation (24h / 48h / 72h — default 48h)
  - Negotiable toggle (already in gig schema)
- Save: PATCH `/v1/gigs/:id` updates only the changed fields. Existing contracts are NOT touched (their terms are sealed).

## Non-goals — explicitly deferred to Phase 2B (or later)

- **Custom clauses** structured array (1-5 numbered clauses, ≤500 chars each) — Phase 1 redundancy with existing `termsAndConditions` freeform. Hirer can use that field via the gig form for now.
- **Sub-artist amount** — Phase 4 sub-gig territory.
- **Push-terms-amendment endpoint** + propagation choice ("Apply to new hires only" vs "Push to existing"). Phase 2A ships only "apply to new hires only" semantics implicitly (existing contracts keep sealed terms because we don't touch them).
- **Bulk-edit of any clause beyond payment structure / cancellation / negotiable.**
- **Compensation amount editing in this screen** — already covered by the gig form (`/gigs/[id]/edit`); Phase 2A's editor focuses on terms, not pricing.

## Architecture

### Backend (small additive change)

`netsa-backend/gigs-service/src/models/Gig.ts`:

```ts
export type PaymentStructure = 'full' | 'advance_balance';
export type CancellationPolicy = '24h' | '48h' | '72h';

interface IGig {
    // ... existing fields
    paymentStructure?: PaymentStructure;       // default 'full'; 'advance_balance' = 30/70 split
    cancellationPolicy?: CancellationPolicy;   // default '48h'
}
```

Schema additions:

```ts
paymentStructure: { type: String, enum: ['full', 'advance_balance'], default: 'full' },
cancellationPolicy: { type: String, enum: ['24h', '48h', '72h'], default: '48h' },
```

Zod validation in `netsa-backend/gigs-service/src/utils/validation.ts` — extend the existing `updateGigSchema` (and `createGigSchema` if it makes sense to expose at create time):

```ts
paymentStructure: z.enum(['full', 'advance_balance']).optional(),
cancellationPolicy: z.enum(['24h', '48h', '72h']).optional(),
```

Existing `PATCH /v1/gigs/:id` accepts the new fields without controller changes (pass-through update).

Tests: extend the existing gig validation/persistence test file with one round-trip case per field.

### Mobile

```
src/features/booking-terms-editor/                   # NEW directory
  BookingTermsEditor.tsx                              # screen orchestrator (~150 lines)
  components/
    PaymentStructurePicker.tsx                        # 2 radio cards
    CancellationPicker.tsx                            # 3-chip selector + forfeit preview
    NegotiableToggle.tsx                              # single toggle row
    BookingTermsPreviewModal.tsx                      # opens from Hub's Preview button
  hooks/
    useBookingTermsEdit.ts                            # local form state + useUpdateGig wrapper
  __tests__/
    BookingTermsEditor.behavior.test.tsx
    PaymentStructurePicker.test.tsx
    CancellationPicker.test.tsx
    BookingTermsPreviewModal.test.tsx

app/(app)/gigs/[id]/booking-terms.tsx                 # NEW expo-router screen
```

### Wiring

Update `src/features/hirer-hub/components/HubBookingTermsCard.tsx`:

1. Replace the "Coming soon" Alert wired to both buttons with two distinct handlers:
   - **Edit terms** → `router.push('/(app)/gigs/{gigId}/booking-terms')`
   - **Preview as artists see** → opens `BookingTermsPreviewModal` inline (modal sibling rendered in `HirerGigHub.tsx` or owned by the card itself)
2. Pass `gigId` + the relevant terms data through props. Card already receives `paymentStructure`, `cancellationPolicy`, etc. — just add the gigId.

The hub's existing `HubBookingTermsCard` props gain one new field:

```ts
type Props = {
    gigId: string;                                 // NEW — needed for Edit navigation
    paymentStructure?: 'full' | 'advance_balance';
    cancellationPolicy?: string;
    leadAmount?: number;
    subArtistAmount?: number;
    customClausesCount?: number;
    activeContractsCount: number;
    termsAndConditions?: string;                   // NEW — passed through to preview modal
    negotiable?: boolean;                          // NEW — passed through to preview modal
};
```

`HirerGigHub.tsx` already plucks these from `gig` — extend the props it passes.

## Editor screen UX

### Header
- Cancel (left) / "Edit · Booking terms" (center, 2-line: micro "Edit" + bold "Booking terms") / Save (right, accent when dirty)
- Cancel uses unsaved-changes prompt (same pattern as ProfileEditModal — small inline sheet)
- Save disabled until at least one field has changed; flips to orange accent when dirty

### Hero
- Serif "What every hire agrees to" + 2-line subtitle reinforcing "Edits apply to new hires only"

### Section 1 — Payment structure
- Two radio cards (Full upfront / 30/70 advance · Recommended)
- Selected card has orange border + tinted bg + filled radio dot
- "30/70 advance" card shows the math when selected: `₹15K on sign → ₹35K post-event` (computed from gig's `compensation.amount`)
- Recommendation badge ("Recommended") on advance_balance when amount ≥ ₹50,000

### Section 2 — Cancellation
- 3-chip horizontal selector: 24h · 48h · 72h
- Below: small card showing forfeit preview ("If cancelled within 48h: 100% forfeit · artist keeps full advance")

### Section 3 — Negotiable toggle
- Single row: switch + label "Negotiable — artists can propose a different rate"
- Reads from `gig.compensation.negotiable`; PATCH path uses nested `compensation.negotiable` field

### Sticky footer
- "Preview as artists see →" link (left, purple)
- Primary "Save terms" button (right, orange)

## Preview modal UX

Single-purpose bottom-sheet modal — opens from Hub's Preview button.

- Title: "What artists see when they apply"
- Renders the same terms-acknowledgement panel that artists see at `Apply` Stage 1, with current gig values:
  - "Booking terms" header
  - Pay: "₹X · 30/70 advance" or "₹X · full upfront" (based on paymentStructure)
  - Cancellation: "X notice · 100% forfeit if within X" (based on cancellationPolicy)
  - Negotiable badge if true
  - Freeform `termsAndConditions` paragraph if present
- Close button (X) top-right
- Read-only — no edit affordances

The preview component is intentionally a **separate component** from the editor so it can be embedded later in (a) the Apply modal terms panel itself for symmetry, and (b) the Contract Workspace amendment review flow (Phase 3).

## Save pipeline

```
User taps "Save terms"
  ├─ build patch object from dirty fields only
  │    {
  │      paymentStructure?: 'full' | 'advance_balance',
  │      cancellationPolicy?: '24h' | '48h' | '72h',
  │      compensation?: { negotiable: boolean }   // nested update
  │    }
  ├─ useUpdateGig().mutateAsync({ id: gigId, ...patch })
  ├─ On success → show toast "Booking terms updated · applies to new hires"
  ├─ On failure → show inline error banner, keep form state intact
```

`useUpdateGig` already exists in `src/hooks/useGigs.ts` (verify) and wraps `PATCH /v1/gigs/:id`. No new hook needed.

## Phase 2A reality

- Existing per-hire contracts are NOT modified by the save. Their `terms.cancellationTerms` / `terms.paymentStructure` were sealed at hire time per PRD §8.3.2 Stage 2.
- The Hub's `HubBookingTermsCard` propagation note ("Edits apply to new hires only · X existing contracts keep sealed terms") is accurate in Phase 2A — there's no "push" affordance to override it.

## Edge cases

- **Gig is closed/paused** — editor still works; updated terms still affect any future re-publish.
- **Compensation.amount is unknown / 0** — payment-structure card shows "—" for the math instead of "₹0K · ₹0K".
- **No `termsAndConditions` set** — preview modal hides the paragraph block, shows only structured fields.
- **User taps Cancel with dirty form** — discard prompt (same UX as ProfileEditModal).
- **Concurrent edits** — Phase 2A doesn't handle (no version field on Gig). Last write wins. Future: add `gig.version` + If-Match header.
- **`useUpdateGig` returns the updated gig** — TanStack invalidates `['gig', id]` so the Hub re-renders with the new values without manual refetch.

## Testing

**Unit / behavior tests:**

1. `PaymentStructurePicker` — selecting a card updates state; "Recommended" badge shows only when amount ≥ ₹50K
2. `CancellationPicker` — selecting a chip updates state; forfeit preview reflects selection
3. `BookingTermsEditor` — save button disabled until dirty; tapping save calls `useUpdateGig` with only the changed fields
4. `BookingTermsEditor` — discard prompt appears on cancel-while-dirty; Keep editing keeps state, Discard reverts and closes
5. `BookingTermsPreviewModal` — renders pay structure + cancellation + negotiable + termsAndConditions when present
6. `BookingTermsPreviewModal` — hides the freeform block when `termsAndConditions` is empty
7. **Hub integration**: Edit button on `HubBookingTermsCard` routes to `/gigs/[id]/booking-terms`
8. **Hub integration**: Preview button opens the preview modal in-place

**Backend tests** (extend existing gig validation suite):

9. PATCH `/v1/gigs/:id` accepts `paymentStructure: 'advance_balance'` + persists correctly
10. PATCH `/v1/gigs/:id` accepts `cancellationPolicy: '72h'` + persists correctly
11. PATCH rejects invalid enum values (`paymentStructure: 'foo'` → 400)

## Risks

- **`useUpdateGig` shape unknown** — verify it accepts arbitrary partial gig objects. If it has a stricter DTO, may need adjustment. Mitigate by reading the hook before implementation.
- **Hub's BookingTermsCard prop drilling for `gigId`** — small refactor; verify `HirerGigHub.tsx` has gigId in scope (it does, prop).
- **Modal-on-modal stack** — Preview modal opens within the Hub screen (not nested in another modal); should be fine. If issues, render via `react-native-modal` or a portal pattern.
- **Existing per-hire contracts now show stale terms relative to the new master** — by design (sealed at hire time per PRD §8.3.2). The Hub's BookingTermsCard's "X sealed contracts" note covers this. Phase 2B's push-amendment endpoint addresses it explicitly when needed.

## Out of scope (deferred to Phase 2B)

- Custom clauses structured array (1-5 numbered, ≤500 chars each)
- Sub-artist amount field
- Push-terms-amendment endpoint + propagation choice radio
- Compensation amount editing inside this screen (defer to gig form)
- "Unreasonable clause flagging" (per PRD: penalties etc.)

## Cleanup tasks (deferred until Phase 2A lands)

- Remove the "Coming soon" copy from `HubBookingTermsCard` once Edit + Preview are wired
- Consider extracting the shared "discard prompt" pattern (used in ProfileEditModal + this editor) into a reusable hook
