# Contract Workspace — Phase 3A Design

**Date:** 2026-04-27
**Owner:** Rohit
**Status:** Spec — pending implementation plan
**Mockup:** `DOCS/designs/contract-workspace.html`
**Depends on:** Phase 1 hub shipped (`152f8ae`); Phase 2A booking terms editor shipped (`557f223`).

## Problem

The existing `/contracts/[id]/index.tsx` is a bare-bones detail view that mixes hirer + artist concerns and lacks the structured surfacing PRD §8.3.3.5 prescribes. The Hub's "Your team" rows already deep-link here; the user expects to land on a single full-screen workspace per contract that owns:

- Status timeline (5-stage progress)
- Signatures audit (both parties + timestamps + device + location)
- Payment progress + state-driven CTA
- Documents (signed contract PDF, invoices)
- Amendments list + "Request a change"
- Activity log
- Edge-case actions (Switch payment / Message / Open dispute / Cancel) — collapsed danger zone

This phase rewrites the existing page to that structure. Most data already lives on the Contract document; this is primarily a UI refactor + several existing-mutation wirings.

## Goals

- Replace the existing tab-free-but-cluttered contract detail page with a single-scroll workspace matching the v1 mockup.
- 9 sections: Hero / Timeline / Signatures / Payment / Documents / Amendments / Activity / Edge cases / Sticky CTA.
- State-driven primary CTA pinned to the bottom (e.g., "Pay ₹35,000 balance" when balance due, "Sign contract" when artist viewing pending signature, etc.).
- Preserve all existing wired mutations (Sign route, Decline, Switch payment method, Payment method modal).
- Activity log derived from the Contract document's existing audit fields — no new collection in Phase 3A.

## Non-goals — explicitly deferred to Phase 3B (or later)

- **ContractEvent collection** + a real activity endpoint. Phase 3A reads from existing Contract fields (`createdAt`, `hirerSignature.signedAt`, `artistSignature.signedAt`, `payments[*].paidAt`, `amendments[*].requestedAt`).
- **Razorpay execute** flow on "Pay via NETSA" — leave the CTA but route to a "Coming soon" Alert if the payment-service Razorpay integration isn't wired (audit will determine).
- **Open dispute panel** — show in danger zone but route to "Coming soon" Alert.
- **Cancel contract** — show in danger zone; route to existing Decline mutation if applicable, otherwise "Coming soon".
- **Off-platform Record Payment form** — deferred. Surface an info row instead.
- **Real-time notifications / live activity** — out of scope. Activity reads on mount; user can pull-to-refresh.

## Architecture

### Backend

**Zero changes** in Phase 3A. The Contract model already exposes:
- `_id, gigId, hirerId, artistId, status, paymentMethod, contractHash`
- `terms` (full snapshot at hire time including amount, dates, location, scope, cancellationTerms)
- `hirerSignature` + `artistSignature` (each with `signedAt`, `deviceInfo`, `ipAddress`, `signerRole`)
- `tier` (quick / standard / premium)
- `amendments` array (Phase 1 sealed: empty for now, schema exists)
- `paidAmount` (if not present, default to 0 — Phase 3B may backfill from Transaction aggregation)

If `paidAmount` doesn't exist on the model, Phase 3A treats it as 0. Phase 3B adds the aggregation. This is the same compromise Phase 1 made.

### Mobile

```
src/features/contract-workspace/                      # NEW
  ContractWorkspace.tsx                                # screen orchestrator (~250 lines)
  components/
    ContractHero.tsx                                   # avatar, name, role, ₹, status pill
    ContractStatusTimeline.tsx                         # 5-stage horizontal timeline
    ContractSignatures.tsx                             # signature audit cards
    ContractPaymentSection.tsx                         # progress bar + per-installment row + CTA
    ContractDocuments.tsx                              # PDF chips
    ContractAmendments.tsx                             # list + Request change button
    ContractActivity.tsx                               # vertical timestamped log
    ContractEdgeCases.tsx                              # collapsed danger zone (Switch / Message / Dispute / Cancel)
    ContractStickyCTA.tsx                              # priority bottom CTA
  hooks/
    useContractActivity.ts                             # derives activity log from contract fields
  utils/
    computeContractTimelineStage.ts                    # 5-node version of computeContractStage
    computePrimaryCTA.ts                               # contract → sticky CTA decision
    formatSignatureMeta.ts                             # device + ip + city → display string
  __tests__/
    computeContractTimelineStage.test.ts               # 5-node states
    computePrimaryCTA.test.ts                          # 8 CTA scenarios
    useContractActivity.test.ts
    ContractWorkspace.behavior.test.tsx                # smoke + section presence + sticky CTA logic

app/(app)/contracts/[id]/index.tsx                     # MODIFY: replace body with <ContractWorkspace />
```

## Data composition

Single fetch via existing `useContract(id)`. The orchestrator passes the full contract object down to each section.

```ts
const { data, isLoading, error } = useContract(id);
const contract = data?.data;
```

No selector hook needed — each section reads its specific slice from `contract` directly.

## State machine — 5-stage timeline

5 nodes: `Sent · Signed · Advance Paid · Final Due · Completed`.

| Contract status | Sent | Signed | Adv Paid | Final Due | Completed |
|---|---|---|---|---|---|
| `sent` / `pending_artist_signature` / `pending_guardian_cosign` | done | active(purple) | pending | pending | pending |
| `accepted` (signed but no payment yet) | done | done | active(gold) | pending | pending |
| `active`, advance paid, future event | done | done | done | pending | pending |
| `active`, balance due (event past) | done | done | done | active(gold) | pending |
| `performed` | done | done | done | done | active(green) |
| `completed` | done | done | done | done | done |
| `disputed` | (current node turns red overlay) | | | | |
| `cancelled` / `breached` / `declined` | grey overlay all | | | | |

Implemented as `computeContractTimelineStage(contract) → { nodes: 5 nodes, overlay }`.

## State machine — sticky bottom CTA

Computed from contract status + viewer role (hirer vs artist):

| Viewer | Status | CTA label | Action |
|---|---|---|---|
| Artist | `sent` / `pending_artist_signature` | "Sign contract" | router.push to `/contracts/[id]/sign` (existing) |
| Artist | `pending_guardian_cosign` | "Awaiting guardian co-sign" | disabled |
| Hirer | `sent` / `pending_artist_signature` | "Awaiting artist · X hours" | disabled |
| Hirer | `accepted` + on-platform + advance unpaid | "Pay ₹X advance via NETSA" | "Coming soon" (Razorpay deferred) |
| Hirer | `accepted` + off-platform + advance unpaid | "Record advance payment" | "Coming soon" |
| Hirer | `active` + balance due (event past) | "Pay ₹X balance" | "Coming soon" |
| Either | `performed` | "Leave a review" | "Coming soon" |
| Either | `disputed` | "Resolve dispute" | "Coming soon" |
| Either | `completed` | "Download contract PDF" | If `documentUrl` present → open; else "Coming soon" |
| Either | `cancelled` / `breached` / `declined` | "View · cancelled" | no-op (read-only state) |

Implemented as `computePrimaryCTA(contract, viewerRole) → { label, intent, disabled, onPress }`.

## Per-section behavior

### Hero
- Large avatar (initials), name + role on right.
- Tier badge (`quick` / `standard` / `premium`) — small uppercase pill.
- Status pill: green Active / gold Awaiting payment / purple Awaiting signature / red Disputed / grey Cancelled.
- Top-right: ⋯ menu button (opens `ContractEdgeCases` accordion or routes to it).

### Status Timeline
- 5-node horizontal timeline with connector lines.
- Each node: 14×14 colored dot.
- Below: stage labels (`Sent · Signed · Advance Paid · Final Due · Completed`).
- Active node has subtle pulse glow.
- Disputed → red overlay on current node.

### Signatures
- 2 cards (or 1 if only hirer signed):
  - "You signed Mar 10 · Pune · iPhone" (or "Hirer signed Mar 10 · Pune · iPhone" for artist viewer)
  - "Priya signed Mar 12 · Mumbai · Android" (or "Awaiting signature" placeholder)
- Each card has a green checkmark icon + signer's name + date + location/device.
- Read-only.

### Payment
- Header: "Payment" title + "30/70 split" / "Full upfront" badge.
- Progress bar showing `paidAmount / totalAmount` percentage.
- Below: 1 or 2 rows:
  - **Advance row**: ₹X · status · date if paid, OR ₹X due · "Pay advance" CTA if unpaid (state-driven)
  - **Balance row** (only for `advance_balance` structure): ₹Y · status · date if paid, OR ₹Y due after event
- All payment CTAs route to "Coming soon" Alert in Phase 3A (Razorpay deferred).

### Documents
- "Documents" header + count.
- Horizontal scrollable PDF chips (1-3 chips):
  - Signed contract PDF (if `contract.documentUrl`)
  - Invoice PDFs (if `contract.invoices[*].url`)
- Each chip: orange icon + name + date in mono.
- Tap → if URL present, opens via `Linking.openURL`. Otherwise "Coming soon".

### Amendments
- "Amendments" header + "X requests" count.
- If `contract.amendments` is empty: "No amendments yet · Material changes (amount, date, scope) require an amendment round. Up to 3 negotiations." + dashed `+ Request a change` button → "Coming soon" Alert.
- If non-empty: list each as a card showing field, old → new value, requester, status (pending / accepted / rejected). Read-only in Phase 3A.

### Activity
- "Activity" header + "X events" count.
- Vertical bullet list, derived from contract fields:
  - "Mar 10 · Contract sent" (from `createdAt` or `hirerSignature.signedAt`)
  - "Mar 12 · You signed" / "Hirer signed" (from `hirerSignature.signedAt`)
  - "Mar 12 · Artist signed" (from `artistSignature.signedAt`)
  - "Mar 15 · Advance paid ₹15,000" (from `payments[*].paidAt` if exists)
  - Cancellation / dispute events if status indicates so
- Show 5; expand button shows full list.

### Edge cases (collapsed danger zone)
- Default collapsed; tap header to expand.
- 4 buttons stacked:
  1. **Switch payment method** — calls existing `useSwitchContractPaymentMethod` mutation. Available only when `methodEditable` (hirer + no artist signature + status in `['sent', 'pending_artist_signature', 'draft']`).
  2. **Message** — routes to messaging thread for this contract pair (or "Coming soon" if not built).
  3. **Open dispute** — "Coming soon" (Phase 3B).
  4. **Cancel contract** — for hirer when `methodEditable` (offer not yet signed), uses existing decline-equivalent or "Coming soon".

### Sticky CTA
- Pinned to bottom, full-width, brand orange (or muted when disabled).
- Computed from `computePrimaryCTA(contract, viewerRole)`.
- Tap → executes the intent (route to /sign / open modal / show Coming soon Alert).

## Edge cases

- **Loading state** — full-screen ActivityIndicator (existing pattern).
- **Contract not found** — shows existing error message; no workspace mounts.
- **Viewer is neither hirer nor artist** — fall back to read-only view with no CTAs (defensive — should never happen in production routing but possible via deep link).
- **Cancelled / declined / breached contracts** — render the workspace but most sections show terminal-state copy ("Cancelled on Mar 12" / "Declined by artist"). Sticky CTA reads "View · cancelled" (no-op).
- **Premium tier (`premium`)** — Phase 1 simplification ignored Phase 2 OTP/Aadhaar layers; this still applies. Tier badge surfaces but no Premium-specific actions.
- **Minor flow (`pending_guardian_cosign`)** — sticky CTA shows "Awaiting guardian co-sign" disabled. Banner above signatures section: "Artist signed but contract requires their guardian's co-signature."
- **Long contract list of amendments** — Phase 3A shows up to 5 with expander. Real list cap is 3 amendment rounds per PRD.
- **`paidAmount` field missing on Contract** — fall back to 0; payment progress bar shows 0%. Phase 3B aggregates from Transactions.

## Testing

**Unit / pure logic:**
1. `computeContractTimelineStage` — 8 status combos return correct 5-node arrays + overlay. (Mirrors `computeContractStage` test pattern from Phase 1.)
2. `computePrimaryCTA` — 10 viewer × status combos return correct label + intent + disabled.

**Component tests:**
3. `ContractStatusTimeline` — renders 5 nodes; disputed overlay visible.
4. `ContractSignatures` — renders 2 cards when both signed; placeholder when artist signature pending.
5. `ContractPaymentSection` — progress bar reflects paidAmount/totalAmount; balance row hidden for `full` structure.
6. `ContractDocuments` — chips render for non-null URLs; tap calls Linking.openURL when URL present.
7. `ContractActivity` — derives at least 2 events for a sent + signed contract; "Show all" expander appears when > 5 events.
8. `ContractEdgeCases` — Switch payment method only enabled when methodEditable; tap opens existing PaymentMethodSelector modal.

**Behavior smoke:**
9. `ContractWorkspace.behavior.test.tsx` — mounts with sample contract; all 9 sections render in order; sticky CTA reflects state.

## Risks

- **Existing `/contracts/[id]/index.tsx` has logic we must preserve** (signing route, decline mutation, payment method switch). Refactor must not regress these. Mitigation: read existing file thoroughly; transplant working hooks into the new orchestrator.
- **Activity log derivation from existing Contract fields may be sparse** — for a freshly sent contract there are 1-2 events at most. Acceptable: empty state copy "Activity will appear as the contract progresses."
- **Many CTAs route to "Coming soon"** — workspace looks complete but feels unfinished if 4+ buttons all show the same Alert. Mitigation: clearly label disabled / pending CTAs with their state ("Awaiting Razorpay integration") so users understand the why, not just "Coming soon".
- **paidAmount field absent on backend** — flagged in Phase 1; same problem here. Default to 0, show fallback "Payment status will reflect once tracking is wired." Phase 3B addresses.
- **Visual regression on the existing contract page** — current layout has its own design language. Replacing it wholesale may surprise users mid-flow. Mitigation: Phase 3A is on develop, behind dev rebuild — natural rollout.

## Out of scope (deferred to Phase 3B)

- ContractEvent collection + real activity endpoint
- Razorpay execute flow ("Pay via NETSA")
- Open dispute action wire (panel + evidence upload)
- Cancel contract action wire (vs current Decline)
- Off-platform Record Payment form
- Real-time updates / pull-to-refresh on activity
- Compute paidAmount aggregation from Transactions
- Premium tier OTP/Aadhaar ceremony reintroduction (PRD Phase 2 anyway)

## Cleanup tasks

- After Phase 3A lands, the existing `/contracts/[id]/index.tsx` body is fully replaced. Verify no other component imports anything from the old file structure (e.g., deprecated helpers). Plan grep accordingly.
- The `PaymentMethodSelector` component used by the old page is reused inside `ContractEdgeCases` — confirm it's a shared component, not specific to the old layout.
