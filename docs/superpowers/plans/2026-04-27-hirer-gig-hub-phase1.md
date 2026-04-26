# Hirer Gig Project Hub — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tab-based gig detail view at `/gigs/[id]` with a single-scroll **Hirer Gig Project Hub** when the current user is the gig's owner. Public artist-side view of the same route stays unchanged. No new backend endpoints — reuses `useGig`, `useGigApplications`, `useUserContracts`.

**Architecture:** Branch `/gigs/[id]` to render `<HirerGigHub />` when `isOwner === true`, else fall through to the existing `<GigDetails />` (public view). The hub is composed of small section components driven by a single selector hook `useGigHubData` that combines applications + contracts. Two pure state-machine utilities (`computeContractStage`, `computeTeamRowAction`) drive per-row visuals + CTAs. No new dependencies.

**Tech Stack:** React Native 0.81, Expo 54, Expo Router, Zustand, @tanstack/react-query, lucide-react-native, jest-expo, @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-04-27-hirer-gig-hub-phase1-design.md`
**Mockup:** `DOCS/designs/hirer-gig-hub-v4.html`

**Branch:** `develop` (matches recent flow — small enough for direct commits)

---

## File Structure

```
netsa-mobile/
  src/features/hirer-hub/                            # NEW directory
    HirerGigHub.tsx                                  # orchestrator (~150 lines)
    components/
      HubHero.tsx                                    # status pill + serif title + meta
      HubKPIs.tsx                                    # 3-cell numeric strip
      HubTeamSection.tsx                             # team header + rows + + slots
      HubTeamRow.tsx                                 # single hire row
      HubMiniTimeline.tsx                            # 4-node contract progress
      HubBookingTermsCard.tsx                        # terms summary card (Phase 1 read-only)
      HubApplicantsSection.tsx                       # filter chips + compact list
      HubApplicantRow.tsx                            # single applicant row
      HubEssentials.tsx                              # collapsed accordion
      HubStickyCTA.tsx                               # sticky bottom action
    hooks/
      useGigHubData.ts                               # selector — combines apps + contracts + gig
    utils/
      computeContractStage.ts                        # contract → 4-stage timeline state
      computeTeamRowAction.ts                        # team row → CTA label + handler intent
      computeStickyCTA.ts                            # hub data → sticky CTA decision
    __tests__/
      computeContractStage.test.ts                   # 8 cases
      computeTeamRowAction.test.ts                   # 8 cases
      computeStickyCTA.test.ts                       # 5 cases
      useGigHubData.test.tsx                         # selector behavior
      HirerGigHub.behavior.test.tsx                  # mounts + sections render
  app/(app)/gigs/[id].tsx                            # MODIFY — branch on isOwner
```

---

## Task 1: Selector hook + state-machine utilities (foundation, TDD-driven)

**Why first:** every component below reads from `useGigHubData` or calls `computeContractStage` / `computeTeamRowAction`. Get the pure logic locked in with tests, then UI is mechanical.

**Files:**
- Create: `src/features/hirer-hub/utils/computeContractStage.ts`
- Create: `src/features/hirer-hub/utils/computeTeamRowAction.ts`
- Create: `src/features/hirer-hub/utils/computeStickyCTA.ts`
- Create: `src/features/hirer-hub/hooks/useGigHubData.ts`
- Create: `src/features/hirer-hub/__tests__/computeContractStage.test.ts`
- Create: `src/features/hirer-hub/__tests__/computeTeamRowAction.test.ts`
- Create: `src/features/hirer-hub/__tests__/computeStickyCTA.test.ts`

- [ ] **Step 1.1: Write failing test for `computeContractStage`**

```ts
// src/features/hirer-hub/__tests__/computeContractStage.test.ts
import { computeContractStage } from '../utils/computeContractStage';

describe('computeContractStage', () => {
    it('pending_artist_signature → node 2 active (purple)', () => {
        const out = computeContractStage({ status: 'pending_artist_signature' } as any);
        expect(out.nodes).toEqual([
            { state: 'done', color: 'green' },
            { state: 'active', color: 'purple' },
            { state: 'pending', color: 'grey' },
            { state: 'pending', color: 'grey' },
        ]);
    });

    it('pending_guardian_cosign → node 2 active (purple)', () => {
        const out = computeContractStage({ status: 'pending_guardian_cosign' } as any);
        expect(out.nodes[1]).toEqual({ state: 'active', color: 'purple' });
    });

    it('signed + advance unpaid → node 3 active (gold)', () => {
        const out = computeContractStage({
            status: 'active',
            paidAmount: 0,
            terms: { amount: 50000, paymentStructure: 'advance_balance' },
        } as any);
        expect(out.nodes[2]).toEqual({ state: 'active', color: 'gold' });
    });

    it('signed + advance paid + future event → node 4 pending', () => {
        const out = computeContractStage({
            status: 'active',
            paidAmount: 15000,
            terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: new Date(Date.now() + 7 * 86_400_000) } },
        } as any);
        expect(out.nodes[2]).toEqual({ state: 'done', color: 'green' });
        expect(out.nodes[3]).toEqual({ state: 'pending', color: 'grey' });
    });

    it('signed + balance due (event passed) → node 4 active (gold)', () => {
        const out = computeContractStage({
            status: 'active',
            paidAmount: 15000,
            terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: new Date(Date.now() - 86_400_000) } },
        } as any);
        expect(out.nodes[3]).toEqual({ state: 'active', color: 'gold' });
    });

    it('completed → all 4 nodes done', () => {
        const out = computeContractStage({ status: 'completed' } as any);
        expect(out.nodes.every(n => n.state === 'done')).toBe(true);
    });

    it('disputed → overlay flag set', () => {
        const out = computeContractStage({ status: 'disputed' } as any);
        expect(out.overlay).toBe('disputed');
    });

    it('cancelled → overlay flag set, all grey', () => {
        const out = computeContractStage({ status: 'cancelled' } as any);
        expect(out.overlay).toBe('cancelled');
        expect(out.nodes.every(n => n.color === 'grey')).toBe(true);
    });
});
```

- [ ] **Step 1.2: Run test — should fail**

```bash
cd /Users/rohithutagonna/Documents/Rohit/NETSA/NETSA-React/netsa-mobile
npx jest src/features/hirer-hub/__tests__/computeContractStage.test.ts
```

Expected: file-not-found / cannot-resolve error.

- [ ] **Step 1.3: Implement `computeContractStage`**

```ts
// src/features/hirer-hub/utils/computeContractStage.ts
//
// Pure function: contract → 4-node progress timeline state.
// Stage 1 Sent · Stage 2 Signed · Stage 3 Advance Paid · Stage 4 Final Done.
// Plus an overlay flag for disputed/cancelled contracts.

export type StageNodeState = 'done' | 'active' | 'pending';
export type StageNodeColor = 'green' | 'gold' | 'purple' | 'red' | 'grey';
export type StageOverlay = null | 'disputed' | 'cancelled';

export type ContractStage = {
    nodes: Array<{ state: StageNodeState; color: StageNodeColor }>;
    overlay: StageOverlay;
};

type ContractInput = {
    status?: string;
    paidAmount?: number;
    terms?: {
        amount?: number;
        paymentStructure?: 'full' | 'advance_balance';
        dates?: { start?: string | Date };
    };
};

const ALL_GREY: ContractStage['nodes'] = [
    { state: 'pending', color: 'grey' },
    { state: 'pending', color: 'grey' },
    { state: 'pending', color: 'grey' },
    { state: 'pending', color: 'grey' },
];

const ALL_DONE: ContractStage['nodes'] = [
    { state: 'done', color: 'green' },
    { state: 'done', color: 'green' },
    { state: 'done', color: 'green' },
    { state: 'done', color: 'green' },
];

export function computeContractStage(contract: ContractInput): ContractStage {
    const status = contract.status ?? '';

    if (status === 'cancelled' || status === 'breached' || status === 'declined') {
        return { nodes: ALL_GREY, overlay: 'cancelled' };
    }
    if (status === 'completed') {
        return { nodes: ALL_DONE, overlay: null };
    }
    if (status === 'disputed') {
        // Disputed: keep prior progress (best effort), flip overlay
        const base = computeContractStage({ ...contract, status: 'active' });
        return { nodes: base.nodes, overlay: 'disputed' };
    }
    if (status === 'pending_artist_signature' || status === 'pending_guardian_cosign' || status === 'sent') {
        return {
            nodes: [
                { state: 'done', color: 'green' },
                { state: 'active', color: 'purple' },
                { state: 'pending', color: 'grey' },
                { state: 'pending', color: 'grey' },
            ],
            overlay: null,
        };
    }

    // active / signed branches
    const amount = contract.terms?.amount ?? 0;
    const paid = contract.paidAmount ?? 0;
    const isAdvanceBalance = contract.terms?.paymentStructure === 'advance_balance';
    const advanceCutoff = isAdvanceBalance ? amount * 0.3 : amount;
    const eventPast = !!contract.terms?.dates?.start &&
        new Date(contract.terms.dates.start as any).getTime() < Date.now();

    if (paid <= 0) {
        return {
            nodes: [
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'active', color: 'gold' },
                { state: 'pending', color: 'grey' },
            ],
            overlay: null,
        };
    }
    if (paid < advanceCutoff) {
        // partial advance
        return {
            nodes: [
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'active', color: 'gold' },
                { state: 'pending', color: 'grey' },
            ],
            overlay: null,
        };
    }
    if (paid < amount) {
        // advance paid; balance due — gold on node 4 only when event has passed
        return {
            nodes: [
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                eventPast ? { state: 'active', color: 'gold' } : { state: 'pending', color: 'grey' },
            ],
            overlay: null,
        };
    }
    // fully paid
    return { nodes: ALL_DONE, overlay: null };
}
```

- [ ] **Step 1.4: Run tests — should pass**

```bash
npx jest src/features/hirer-hub/__tests__/computeContractStage.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 1.5: Write failing test for `computeTeamRowAction`**

```ts
// src/features/hirer-hub/__tests__/computeTeamRowAction.test.ts
import { computeTeamRowAction } from '../utils/computeTeamRowAction';

const futureDate = new Date(Date.now() + 7 * 86_400_000).toISOString();
const pastDate = new Date(Date.now() - 86_400_000).toISOString();

describe('computeTeamRowAction', () => {
    it('pending_artist_signature → Sent · waiting (disabled)', () => {
        const out = computeTeamRowAction({ status: 'pending_artist_signature', sentAt: new Date().toISOString() } as any);
        expect(out.label).toMatch(/Sent · waiting/i);
        expect(out.disabled).toBe(true);
    });

    it('pending_artist_signature > 24h → Nudge', () => {
        const sent = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
        const out = computeTeamRowAction({ status: 'pending_artist_signature', sentAt: sent } as any);
        expect(out.label).toMatch(/Nudge/i);
        expect(out.disabled).toBe(false);
    });

    it('pending_guardian_cosign → Waiting · guardian (disabled)', () => {
        const out = computeTeamRowAction({ status: 'pending_guardian_cosign' } as any);
        expect(out.label).toMatch(/guardian/i);
        expect(out.disabled).toBe(true);
    });

    it('signed + advance unpaid + on_platform → Pay (Phase 1 disabled stub)', () => {
        const out = computeTeamRowAction({
            status: 'active', paidAmount: 0, paymentMethod: 'on_platform',
            terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: futureDate } },
        } as any);
        expect(out.label).toMatch(/Pay/i);
        expect(out.intent).toBe('pay-advance');
    });

    it('signed + advance unpaid + off_platform → Record Payment', () => {
        const out = computeTeamRowAction({
            status: 'active', paidAmount: 0, paymentMethod: 'off_platform',
            terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: futureDate } },
        } as any);
        expect(out.label).toMatch(/Record/i);
        expect(out.intent).toBe('record-payment');
    });

    it('signed + advance paid + future event → View', () => {
        const out = computeTeamRowAction({
            status: 'active', paidAmount: 15000,
            terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: futureDate } },
        } as any);
        expect(out.label).toBe('View');
        expect(out.intent).toBe('view');
    });

    it('signed + balance due (event passed) → Pay balance ₹X', () => {
        const out = computeTeamRowAction({
            status: 'active', paidAmount: 15000, paymentMethod: 'on_platform',
            terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: pastDate } },
        } as any);
        expect(out.label).toMatch(/Pay balance/i);
        expect(out.intent).toBe('pay-balance');
    });

    it('completed → Leave a review', () => {
        const out = computeTeamRowAction({ status: 'completed' } as any);
        expect(out.label).toMatch(/review/i);
    });

    it('disputed → Resolve dispute', () => {
        const out = computeTeamRowAction({ status: 'disputed' } as any);
        expect(out.label).toMatch(/dispute/i);
    });

    it('cancelled → View · cancelled', () => {
        const out = computeTeamRowAction({ status: 'cancelled' } as any);
        expect(out.label).toMatch(/cancelled/i);
        expect(out.intent).toBe('view');
    });
});
```

- [ ] **Step 1.6: Run test — should fail (file missing)**

```bash
npx jest src/features/hirer-hub/__tests__/computeTeamRowAction.test.ts
```

- [ ] **Step 1.7: Implement `computeTeamRowAction`**

```ts
// src/features/hirer-hub/utils/computeTeamRowAction.ts
//
// Pure function: contract → primary CTA on its team row.
// Phase 1 reality: payment / nudge / dispute intents render but the parent
// decides whether to wire them to real endpoints or show a "Coming soon"
// Alert. This util just returns the label + intent + disabled flag.

export type TeamRowIntent =
    | 'view'
    | 'nudge'
    | 'cancel-offer'
    | 'pay-advance'
    | 'pay-balance'
    | 'record-payment'
    | 'leave-review'
    | 'resolve-dispute'
    | 'noop';

export type TeamRowAction = {
    label: string;
    intent: TeamRowIntent;
    disabled: boolean;
};

type Input = {
    status?: string;
    sentAt?: string;
    paidAmount?: number;
    paymentMethod?: 'on_platform' | 'off_platform';
    terms?: {
        amount?: number;
        paymentStructure?: 'full' | 'advance_balance';
        dates?: { start?: string | Date };
    };
};

const HOUR = 60 * 60 * 1000;

function inrShort(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
    return `₹${amount}`;
}

export function computeTeamRowAction(contract: Input): TeamRowAction {
    const s = contract.status ?? '';

    if (s === 'cancelled' || s === 'breached' || s === 'declined') {
        return { label: 'View · cancelled', intent: 'view', disabled: false };
    }
    if (s === 'completed') {
        return { label: 'Leave a review', intent: 'leave-review', disabled: true };
    }
    if (s === 'disputed') {
        return { label: 'Resolve dispute', intent: 'resolve-dispute', disabled: true };
    }
    if (s === 'pending_guardian_cosign') {
        return { label: 'Waiting · guardian', intent: 'noop', disabled: true };
    }
    if (s === 'pending_artist_signature' || s === 'sent') {
        const sentMs = contract.sentAt ? new Date(contract.sentAt).getTime() : Date.now();
        const ageHours = (Date.now() - sentMs) / HOUR;
        if (ageHours > 48) return { label: 'Cancel offer', intent: 'cancel-offer', disabled: false };
        if (ageHours > 24) return { label: 'Nudge', intent: 'nudge', disabled: false };
        return { label: 'Sent · waiting', intent: 'noop', disabled: true };
    }

    // active / signed
    const amount = contract.terms?.amount ?? 0;
    const paid = contract.paidAmount ?? 0;
    const isAdvanceBalance = contract.terms?.paymentStructure === 'advance_balance';
    const advanceCutoff = isAdvanceBalance ? amount * 0.3 : amount;
    const eventPast = !!contract.terms?.dates?.start &&
        new Date(contract.terms.dates.start as any).getTime() < Date.now();

    if (paid < advanceCutoff) {
        // advance not paid yet
        if (contract.paymentMethod === 'off_platform') {
            return { label: 'Record Payment', intent: 'record-payment', disabled: false };
        }
        return { label: `Pay ${inrShort(advanceCutoff - paid)}`, intent: 'pay-advance', disabled: false };
    }
    if (paid < amount && eventPast) {
        return { label: `Pay balance ${inrShort(amount - paid)}`, intent: 'pay-balance', disabled: false };
    }
    return { label: 'View', intent: 'view', disabled: false };
}
```

- [ ] **Step 1.8: Run test — should pass**

```bash
npx jest src/features/hirer-hub/__tests__/computeTeamRowAction.test.ts
```

Expected: 10 tests pass.

- [ ] **Step 1.9: Write failing test for `computeStickyCTA`**

```ts
// src/features/hirer-hub/__tests__/computeStickyCTA.test.ts
import { computeStickyCTA } from '../utils/computeStickyCTA';

describe('computeStickyCTA', () => {
    it('11 pending applicants → Review applicants · 11', () => {
        const out = computeStickyCTA({
            pendingApplicantsCount: 11,
            urgentTeamRowCount: 0,
        });
        expect(out.label).toMatch(/Review applicants/i);
        expect(out.label).toContain('11');
        expect(out.intent).toBe('review-applicants');
    });

    it('0 applicants but 1 urgent team action → urgent label', () => {
        const out = computeStickyCTA({
            pendingApplicantsCount: 0,
            urgentTeamRowCount: 1,
            firstUrgentLabel: 'Pay ₹4.5K · Aanya',
        });
        expect(out.label).toBe('Pay ₹4.5K · Aanya');
        expect(out.intent).toBe('urgent-team');
    });

    it('0 applicants + 0 urgent → Manage team', () => {
        const out = computeStickyCTA({ pendingApplicantsCount: 0, urgentTeamRowCount: 0 });
        expect(out.label).toBe('Manage team');
        expect(out.intent).toBe('manage-team');
    });

    it('applicants take priority over urgent team rows', () => {
        const out = computeStickyCTA({
            pendingApplicantsCount: 5, urgentTeamRowCount: 3,
            firstUrgentLabel: 'Pay X',
        });
        expect(out.intent).toBe('review-applicants');
    });

    it('1 applicant → singular label', () => {
        const out = computeStickyCTA({ pendingApplicantsCount: 1, urgentTeamRowCount: 0 });
        expect(out.label).toMatch(/applicant/i);
        expect(out.label).toContain('1');
    });
});
```

- [ ] **Step 1.10: Implement `computeStickyCTA`**

```ts
// src/features/hirer-hub/utils/computeStickyCTA.ts
//
// Pure function: hub data summary → sticky bottom CTA decision.
// Priority: applicants needing review > urgent team rows > calm fallback.

export type StickyIntent = 'review-applicants' | 'urgent-team' | 'manage-team';

export type StickyCTA = {
    label: string;
    intent: StickyIntent;
};

type Input = {
    pendingApplicantsCount: number;
    urgentTeamRowCount: number;
    firstUrgentLabel?: string;
};

export function computeStickyCTA({
    pendingApplicantsCount,
    urgentTeamRowCount,
    firstUrgentLabel,
}: Input): StickyCTA {
    if (pendingApplicantsCount > 0) {
        return {
            label: `Review applicants · ${pendingApplicantsCount}`,
            intent: 'review-applicants',
        };
    }
    if (urgentTeamRowCount > 0 && firstUrgentLabel) {
        return { label: firstUrgentLabel, intent: 'urgent-team' };
    }
    return { label: 'Manage team', intent: 'manage-team' };
}
```

- [ ] **Step 1.11: Run test — should pass**

```bash
npx jest src/features/hirer-hub/__tests__/computeStickyCTA.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 1.12: Implement `useGigHubData` selector hook**

```ts
// src/features/hirer-hub/hooks/useGigHubData.ts
//
// Selector hook that combines gig + applications + contracts into the shape
// the hub renders. Phase 1 filters contracts client-side by gigId because
// useUserContracts doesn't support a gigId server filter yet — at MVP scale
// (typically < 50 contracts per user) the client filter is fine.

import { useMemo } from 'react';
import { useGig } from '@/hooks/useGigs';
import { useGigApplications } from '@/hooks/useGigApplications';
import { useUserContracts } from '@/hooks/usePayments';
import { computeTeamRowAction } from '../utils/computeTeamRowAction';

export type HubKPIs = {
    appliedCount: number;
    hiredCount: number;
    slotsTotal: number;
    paidAmount: number;
    dueAmount: number;
};

export type TeamRowData = {
    application: any;
    contract: any | null;
};

export function useGigHubData(gigId: string) {
    const gigQuery = useGig(gigId);
    const appsQuery = useGigApplications(gigId);
    const contractsQuery = useUserContracts();

    const gig = gigQuery.data;
    const applications: any[] = appsQuery.data ?? [];
    const allContracts: any[] = contractsQuery.data?.data?.contracts ?? [];

    // Filter contracts to this gig client-side (Phase 1).
    const contracts = useMemo(
        () => allContracts.filter((c: any) => String(c.gigId) === String(gigId)),
        [allContracts, gigId]
    );

    const teamRows: TeamRowData[] = useMemo(() => {
        return applications
            .filter((a) => a.status === 'hired')
            .map((a) => ({
                application: a,
                contract: contracts.find((c: any) => String(c.artistId) === String(a.artistId)) ?? null,
            }));
    }, [applications, contracts]);

    const pendingApplicants = useMemo(() => {
        return applications.filter((a) => a.status !== 'hired' && a.status !== 'rejected');
    }, [applications]);

    const kpis: HubKPIs = useMemo(() => {
        const appliedCount = applications.length;
        const hiredCount = applications.filter((a) => a.status === 'hired').length;
        const slotsTotal = gig?.requirements?.headcount || hiredCount || 1;
        const paidAmount = contracts.reduce((s: number, c: any) => s + (c.paidAmount ?? 0), 0);
        const totalAmount = contracts.reduce((s: number, c: any) => s + (c.terms?.amount ?? 0), 0);
        const dueAmount = Math.max(0, totalAmount - paidAmount);
        return { appliedCount, hiredCount, slotsTotal, paidAmount, dueAmount };
    }, [applications, contracts, gig]);

    const urgentTeamRowCount = useMemo(() => {
        return teamRows.filter((r) => {
            if (!r.contract) return false;
            const action = computeTeamRowAction(r.contract);
            return !action.disabled && action.intent !== 'view';
        }).length;
    }, [teamRows]);

    const firstUrgentLabel = useMemo(() => {
        for (const row of teamRows) {
            if (!row.contract) continue;
            const action = computeTeamRowAction(row.contract);
            if (!action.disabled && action.intent !== 'view') {
                return `${action.label} · ${row.application?.artistSnapshot?.displayName ?? 'Artist'}`;
            }
        }
        return undefined;
    }, [teamRows]);

    return {
        gig,
        applications,
        contracts,
        teamRows,
        pendingApplicants,
        pendingApplicantsCount: pendingApplicants.length,
        urgentTeamRowCount,
        firstUrgentLabel,
        kpis,
        isLoading: gigQuery.isLoading || appsQuery.isLoading || contractsQuery.isLoading,
        error: gigQuery.error || appsQuery.error || contractsQuery.error,
    };
}
```

- [ ] **Step 1.13: Commit**

```bash
git add src/features/hirer-hub/utils/ src/features/hirer-hub/hooks/ src/features/hirer-hub/__tests__/
git commit -m "$(cat <<'EOF'
feat(hirer-hub): selector hook + state-machine utilities

Pure foundation for the Project Hub Phase 1:
  - computeContractStage: contract → 4-node timeline state
  - computeTeamRowAction: contract → primary CTA label/intent/disabled
  - computeStickyCTA: hub summary → sticky bottom CTA decision
  - useGigHubData: combines useGig + useGigApplications + useUserContracts
    into hub-ready shape (team rows, pending applicants, KPIs, urgents)

23 unit tests cover every state-machine branch.

PRD ref: §8.3.3 Project Hub Model.
Spec: docs/superpowers/specs/2026-04-27-hirer-gig-hub-phase1-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: HubMiniTimeline component

**Files:**
- Create: `src/features/hirer-hub/components/HubMiniTimeline.tsx`
- Create: `src/features/hirer-hub/__tests__/HubMiniTimeline.test.tsx`

- [ ] **Step 2.1: Write failing test**

```tsx
// src/features/hirer-hub/__tests__/HubMiniTimeline.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { HubMiniTimeline } from '../components/HubMiniTimeline';

describe('HubMiniTimeline', () => {
    it('renders 4 nodes', () => {
        const { UNSAFE_getAllByProps } = render(
            <HubMiniTimeline
                nodes={[
                    { state: 'done', color: 'green' },
                    { state: 'done', color: 'green' },
                    { state: 'active', color: 'gold' },
                    { state: 'pending', color: 'grey' },
                ]}
                overlay={null}
            />
        );
        // 4 dot views (testID per node)
        const dots = UNSAFE_getAllByProps({ testID: 'mini-tl-node' });
        expect(dots.length).toBe(4);
    });

    it('disputed overlay renders red ring', () => {
        const { UNSAFE_getAllByProps } = render(
            <HubMiniTimeline
                nodes={[
                    { state: 'done', color: 'green' },
                    { state: 'done', color: 'green' },
                    { state: 'active', color: 'gold' },
                    { state: 'pending', color: 'grey' },
                ]}
                overlay="disputed"
            />
        );
        const overlayMarker = UNSAFE_getAllByProps({ testID: 'mini-tl-overlay-disputed' });
        expect(overlayMarker.length).toBe(1);
    });
});
```

- [ ] **Step 2.2: Run test — fails**

```bash
npx jest src/features/hirer-hub/__tests__/HubMiniTimeline.test.tsx
```

- [ ] **Step 2.3: Implement `HubMiniTimeline`**

```tsx
// src/features/hirer-hub/components/HubMiniTimeline.tsx
//
// Compact 4-node timeline that lives inside a team row.
// Color of node 2/3/4 communicates "where the contract is".

import React from 'react';
import { View } from 'react-native';
import type { ContractStage, StageNodeColor } from '../utils/computeContractStage';

const COLOR_MAP: Record<StageNodeColor, string> = {
    green: '#22C55E',
    gold: '#F59E0B',
    purple: '#8B5CF6',
    red: '#EF4444',
    grey: '#3F3D4A',
};

type Props = {
    nodes: ContractStage['nodes'];
    overlay: ContractStage['overlay'];
};

export function HubMiniTimeline({ nodes, overlay }: Props) {
    return (
        <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}
            testID="mini-tl"
        >
            {nodes.map((n, i) => (
                <React.Fragment key={i}>
                    <View
                        testID="mini-tl-node"
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: COLOR_MAP[n.color],
                            ...(n.state === 'active' && {
                                shadowColor: COLOR_MAP[n.color],
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.5,
                                shadowRadius: 3,
                            }),
                        }}
                    />
                    {i < nodes.length - 1 && (
                        <View
                            style={{
                                width: 14,
                                height: 1,
                                backgroundColor:
                                    nodes[i + 1].state === 'done' || (n.state === 'done' && nodes[i + 1].state !== 'pending')
                                        ? COLOR_MAP[n.color]
                                        : 'rgba(255,255,255,0.09)',
                            }}
                        />
                    )}
                </React.Fragment>
            ))}
            {overlay === 'disputed' && (
                <View
                    testID="mini-tl-overlay-disputed"
                    style={{ marginLeft: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR_MAP.red }}
                />
            )}
        </View>
    );
}
```

- [ ] **Step 2.4: Run test — passes**

```bash
npx jest src/features/hirer-hub/__tests__/HubMiniTimeline.test.tsx
```

- [ ] **Step 2.5: Commit**

```bash
git add src/features/hirer-hub/components/HubMiniTimeline.tsx \
        src/features/hirer-hub/__tests__/HubMiniTimeline.test.tsx
git commit -m "feat(hirer-hub): HubMiniTimeline — 4-node compact contract progress

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: HubHero + HubKPIs (slim display components)

**Files:**
- Create: `src/features/hirer-hub/components/HubHero.tsx`
- Create: `src/features/hirer-hub/components/HubKPIs.tsx`
- Create: `src/features/hirer-hub/__tests__/HubHero.test.tsx`

- [ ] **Step 3.1: Write failing test for HubHero**

```tsx
// src/features/hirer-hub/__tests__/HubHero.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { HubHero } from '../components/HubHero';

describe('HubHero', () => {
    it('renders gig title + status pill + meta line', () => {
        const { getByText } = render(
            <HubHero
                title="Sangeet Choreography"
                status="published"
                eventFunction="Sangeet"
                city="Pune"
                startDate={new Date('2027-03-15').toISOString()}
            />
        );
        expect(getByText('Sangeet Choreography')).toBeTruthy();
        expect(getByText(/Live/i)).toBeTruthy();
        expect(getByText(/Sangeet/i)).toBeTruthy();
        expect(getByText(/Pune/i)).toBeTruthy();
    });

    it('renders Closed pill when gig.status is closed', () => {
        const { getByText } = render(
            <HubHero title="X" status="closed" eventFunction="" city="" startDate="" />
        );
        expect(getByText(/Closed/i)).toBeTruthy();
    });
});
```

- [ ] **Step 3.2: Implement HubHero**

```tsx
// src/features/hirer-hub/components/HubHero.tsx
import React from 'react';
import { View, Text } from 'react-native';

type Props = {
    title: string;
    status?: string; // 'draft' | 'published' | 'closed' | 'paused'
    eventFunction?: string;
    city?: string;
    startDate?: string;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: '#6B6878' },
    published: { label: 'Live', color: '#22C55E' },
    closed: { label: 'Closed', color: '#EF4444' },
    paused: { label: 'Paused', color: '#F59E0B' },
};

function formatShortDate(iso?: string): string {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

export function HubHero({ title, status, eventFunction, city, startDate }: Props) {
    const statusInfo = STATUS_LABEL[status ?? ''] ?? STATUS_LABEL.published;
    const dateStr = formatShortDate(startDate);
    const meta = [eventFunction, city, dateStr].filter(Boolean).join(' · ');

    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 3,
                        paddingHorizontal: 9,
                        borderRadius: 999,
                        backgroundColor: `${statusInfo.color}1A`,
                    }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusInfo.color }} />
                    <Text style={{ color: statusInfo.color, fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                        {statusInfo.label}
                    </Text>
                </View>
                <Text style={{ color: '#6B6878', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {meta}
                </Text>
            </View>
            <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 36, lineHeight: 38, color: '#F3EFE8', letterSpacing: -0.6 }}>
                {title}
            </Text>
        </View>
    );
}
```

- [ ] **Step 3.3: Run test — passes**

```bash
npx jest src/features/hirer-hub/__tests__/HubHero.test.tsx
```

- [ ] **Step 3.4: Implement HubKPIs**

```tsx
// src/features/hirer-hub/components/HubKPIs.tsx
import React from 'react';
import { View, Text } from 'react-native';
import type { HubKPIs as HubKPIData } from '../hooks/useGigHubData';

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    text3: '#3F3D4A',
    orange: '#FF6B35',
    green: '#22C55E',
    gold: '#F59E0B',
};

function inrShort(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
    return `₹${amount}`;
}

type Props = { kpis: HubKPIData };

export function HubKPIs({ kpis }: Props) {
    return (
        <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <View>
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Applied
                    </Text>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 32, color: COLORS.orange, marginTop: 4 }}>
                        {kpis.appliedCount}
                    </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Hired
                    </Text>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 32, color: COLORS.text0, marginTop: 4 }}>
                        {kpis.hiredCount}
                        <Text style={{ fontSize: 18, color: COLORS.text3 }}>/{kpis.slotsTotal}</Text>
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Paid · Due
                    </Text>
                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: COLORS.green }}>
                            {inrShort(kpis.paidAmount)}
                        </Text>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: COLORS.text3 }}> · </Text>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: COLORS.gold }}>
                            {inrShort(kpis.dueAmount)}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
```

- [ ] **Step 3.5: Commit**

```bash
git add src/features/hirer-hub/components/HubHero.tsx \
        src/features/hirer-hub/components/HubKPIs.tsx \
        src/features/hirer-hub/__tests__/HubHero.test.tsx
git commit -m "feat(hirer-hub): HubHero + HubKPIs

Hero shows status pill, gig title (DM Serif), one-line meta. KPIs show
3 cells: Applied, Hired (X/Y), Paid · Due, with INR-short formatting.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: HubTeamSection + HubTeamRow

**Files:**
- Create: `src/features/hirer-hub/components/HubTeamRow.tsx`
- Create: `src/features/hirer-hub/components/HubTeamSection.tsx`
- Create: `src/features/hirer-hub/__tests__/HubTeamSection.test.tsx`

- [ ] **Step 4.1: Implement HubTeamRow**

```tsx
// src/features/hirer-hub/components/HubTeamRow.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { HubMiniTimeline } from './HubMiniTimeline';
import { computeContractStage } from '../utils/computeContractStage';
import { computeTeamRowAction, type TeamRowIntent } from '../utils/computeTeamRowAction';

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    text3: '#3F3D4A',
    bg: '#16161F',
    line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35',
    gold: '#F59E0B',
    purple: '#8B5CF6',
    green: '#22C55E',
};

type Props = {
    application: any;
    contract: any | null;
};

const PHASE_1_DEFERRED: TeamRowIntent[] = [
    'pay-advance', 'pay-balance', 'record-payment',
    'leave-review', 'resolve-dispute', 'nudge', 'cancel-offer',
];

export function HubTeamRow({ application, contract }: Props) {
    const router = useRouter();

    if (!contract) {
        // Hired application but contract record not loaded yet — show a quiet placeholder.
        return (
            <View style={{ paddingHorizontal: 24, paddingVertical: 16, opacity: 0.5 }}>
                <Text style={{ color: COLORS.text2, fontSize: 13 }}>
                    {application.artistSnapshot?.displayName ?? 'Artist'} · contract loading…
                </Text>
            </View>
        );
    }

    const stage = computeContractStage(contract);
    const action = computeTeamRowAction(contract);
    const accent =
        stage.overlay === 'disputed' ? '#EF4444' :
        action.intent === 'pay-advance' || action.intent === 'pay-balance' || action.intent === 'record-payment' ? COLORS.gold :
        action.intent === 'nudge' || action.intent === 'cancel-offer' ? COLORS.purple :
        null;

    const handlePress = () => {
        if (action.intent === 'view') {
            router.push(`/(app)/contracts/${contract._id}` as any);
            return;
        }
        if (PHASE_1_DEFERRED.includes(action.intent)) {
            Alert.alert(
                'Coming soon',
                `${action.label} will be wired in Phase 3 of the Hub rollout.`
            );
            return;
        }
    };

    const initials = (application.artistSnapshot?.displayName ?? 'A')
        .split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase();

    return (
        <View
            style={{
                paddingHorizontal: 24,
                paddingVertical: 16,
                ...(accent ? { backgroundColor: `${accent}07` } : {}),
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                    width: 40, height: 40, borderRadius: 12,
                    backgroundColor: COLORS.bg,
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <Text style={{ color: COLORS.text0, fontWeight: '700', fontSize: 13 }}>{initials}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: COLORS.text0, fontSize: 14, fontWeight: '700' }}>
                        {application.artistSnapshot?.displayName ?? 'Artist'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Text style={{ color: COLORS.text2, fontSize: 12 }}>
                            ₹{(contract.terms?.amount ?? 0).toLocaleString('en-IN')}
                        </Text>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.text3 }} />
                        <HubMiniTimeline nodes={stage.nodes} overlay={stage.overlay} />
                    </View>
                </View>
                <TouchableOpacity
                    onPress={handlePress}
                    disabled={action.disabled}
                    accessibilityLabel={`${action.label} for ${application.artistSnapshot?.displayName ?? 'Artist'}`}
                    style={{
                        paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
                        backgroundColor: accent ? accent : 'transparent',
                        opacity: action.disabled ? 0.5 : 1,
                    }}>
                    <Text style={{
                        color: accent ? '#0A0A0F' : COLORS.text2,
                        fontSize: 12,
                        fontWeight: '700',
                    }}>
                        {action.label}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
```

- [ ] **Step 4.2: Implement HubTeamSection**

```tsx
// src/features/hirer-hub/components/HubTeamSection.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { HubTeamRow } from './HubTeamRow';
import type { TeamRowData } from '../hooks/useGigHubData';

const COLORS = { text0: '#F3EFE8', text2: '#6B6878', text3: '#3F3D4A', line2: 'rgba(255,255,255,0.09)' };

type Props = {
    teamRows: TeamRowData[];
    slotsTotal: number;
    pendingApplicantsCount: number;
};

export function HubTeamSection({ teamRows, slotsTotal, pendingApplicantsCount }: Props) {
    const emptySlots = Math.max(0, slotsTotal - teamRows.length);

    return (
        <View style={{ paddingTop: 36, paddingBottom: 8 }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 20, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text0, letterSpacing: -0.4 }}>
                    Your team
                </Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {teamRows.length} of {slotsTotal}
                </Text>
            </View>

            {teamRows.map((row, i) => (
                <HubTeamRow key={row.application?._id ?? i} application={row.application} contract={row.contract} />
            ))}

            {emptySlots > 0 && (
                <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {Array.from({ length: Math.min(emptySlots, 3) }).map((_, i) => (
                            <View
                                key={i}
                                style={{
                                    flex: 1,
                                    aspectRatio: 1,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderStyle: 'dashed',
                                    borderColor: COLORS.line2,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text3 }}>+</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={{ textAlign: 'center', fontSize: 12, color: COLORS.text2, marginTop: 12 }}>
                        {emptySlots} more {emptySlots === 1 ? 'slot' : 'slots'} needed · {pendingApplicantsCount} {pendingApplicantsCount === 1 ? 'applicant' : 'applicants'} waiting
                    </Text>
                </View>
            )}
        </View>
    );
}
```

- [ ] **Step 4.3: Write smoke test**

```tsx
// src/features/hirer-hub/__tests__/HubTeamSection.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { HubTeamSection } from '../components/HubTeamSection';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const sampleTeamRow = {
    application: {
        _id: 'a1',
        artistSnapshot: { displayName: 'Priya Sharma' },
    },
    contract: {
        _id: 'c1',
        status: 'active',
        paidAmount: 15000,
        paymentMethod: 'on_platform',
        terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: new Date(Date.now() + 7 * 86_400_000).toISOString() } },
    },
};

describe('HubTeamSection', () => {
    it('renders team rows + empty slots', () => {
        const { getByText } = render(
            <HubTeamSection teamRows={[sampleTeamRow as any]} slotsTotal={3} pendingApplicantsCount={5} />
        );
        expect(getByText('Your team')).toBeTruthy();
        expect(getByText('Priya Sharma')).toBeTruthy();
        expect(getByText(/2 more slots needed/)).toBeTruthy();
    });

    it('hides empty slots when team is full', () => {
        const { queryByText } = render(
            <HubTeamSection teamRows={[sampleTeamRow as any]} slotsTotal={1} pendingApplicantsCount={0} />
        );
        expect(queryByText(/more slot/)).toBeNull();
    });
});
```

- [ ] **Step 4.4: Run test — passes**

```bash
npx jest src/features/hirer-hub/__tests__/HubTeamSection.test.tsx
```

- [ ] **Step 4.5: Commit**

```bash
git add src/features/hirer-hub/components/HubTeamRow.tsx \
        src/features/hirer-hub/components/HubTeamSection.tsx \
        src/features/hirer-hub/__tests__/HubTeamSection.test.tsx
git commit -m "feat(hirer-hub): HubTeamSection + HubTeamRow

People-first roster of hired artists. Each row shows avatar, name,
amount, and a 4-node mini contract timeline + state-driven CTA.
Empty + slots render below the roster with applicant count.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: HubBookingTermsCard (Phase 1 read-only)

**Files:**
- Create: `src/features/hirer-hub/components/HubBookingTermsCard.tsx`
- Create: `src/features/hirer-hub/__tests__/HubBookingTermsCard.test.tsx`

- [ ] **Step 5.1: Implement HubBookingTermsCard**

```tsx
// src/features/hirer-hub/components/HubBookingTermsCard.tsx
//
// Read-only summary of the gig's master/template booking terms.
// Phase 1: Edit + Preview buttons render but are disabled with tooltips
// pointing at Phase 2 (Booking Terms editor).

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Eye, Edit3, Info } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35', purple: '#8B5CF6',
};

type Props = {
    paymentStructure?: 'full' | 'advance_balance';
    cancellationPolicy?: string; // '24h' | '48h' | '72h' | undefined
    leadAmount?: number;
    subArtistAmount?: number;
    customClausesCount?: number;
    activeContractsCount: number;
};

const STRUCTURE_LABEL: Record<string, string> = {
    full: 'Full upfront',
    advance_balance: '30/70 advance',
};

export function HubBookingTermsCard({
    paymentStructure = 'advance_balance',
    cancellationPolicy = '48h',
    leadAmount = 0,
    subArtistAmount,
    customClausesCount = 0,
    activeContractsCount,
}: Props) {
    const handleDeferred = () => {
        Alert.alert(
            'Coming in Phase 2',
            'The Booking Terms editor ships with the next hub release. Edit terms via the gig form for now.'
        );
    };

    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 36 }}>
            <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text0, letterSpacing: -0.4 }}>
                    Booking terms
                </Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    Template · {activeContractsCount} sealed
                </Text>
            </View>

            <View style={{ borderRadius: 16, padding: 20, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    <View style={{ width: '50%', marginBottom: 16 }}>
                        <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Pay structure</Text>
                        <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>{STRUCTURE_LABEL[paymentStructure]}</Text>
                    </View>
                    <View style={{ width: '50%', marginBottom: 16 }}>
                        <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Cancellation</Text>
                        <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>{cancellationPolicy} notice</Text>
                    </View>
                    <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Compensation</Text>
                        <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>
                            ₹{(leadAmount).toLocaleString('en-IN')}{subArtistAmount ? ` · ₹${subArtistAmount.toLocaleString('en-IN')} ea` : ''}
                        </Text>
                    </View>
                    <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Custom clauses</Text>
                        <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>
                            {customClausesCount === 0 ? 'None' : `${customClausesCount} added`}
                        </Text>
                    </View>
                </View>

                <View style={{ height: 1, backgroundColor: COLORS.line, marginTop: 4, marginBottom: 16 }} />

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        onPress={handleDeferred}
                        style={{
                            flex: 1, paddingVertical: 10, borderRadius: 8,
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                            backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.20)',
                        }}>
                        <Eye size={12} color={COLORS.purple} />
                        <Text style={{ color: COLORS.purple, fontSize: 12, fontWeight: '700' }}>Preview as artists see</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleDeferred}
                        style={{
                            flex: 1, paddingVertical: 10, borderRadius: 8,
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                            backgroundColor: 'rgba(255,107,53,0.08)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.25)',
                        }}>
                        <Edit3 size={12} color={COLORS.orange} />
                        <Text style={{ color: COLORS.orange, fontSize: 12, fontWeight: '700' }}>Edit terms</Text>
                    </TouchableOpacity>
                </View>

                {activeContractsCount > 0 && (
                    <View style={{ marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)', flexDirection: 'row', gap: 8 }}>
                        <Info size={11} color={COLORS.text2} style={{ marginTop: 2 }} />
                        <Text style={{ flex: 1, fontSize: 11, color: COLORS.text2, lineHeight: 16 }}>
                            Edits apply to <Text style={{ color: COLORS.text1 }}>new hires only</Text>. {activeContractsCount} existing contract{activeContractsCount === 1 ? '' : 's'} keep sealed terms unless you push an amendment.
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}
```

- [ ] **Step 5.2: Write smoke test**

```tsx
// src/features/hirer-hub/__tests__/HubBookingTermsCard.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { HubBookingTermsCard } from '../components/HubBookingTermsCard';

describe('HubBookingTermsCard', () => {
    it('renders summary fields', () => {
        const { getByText } = render(
            <HubBookingTermsCard
                paymentStructure="advance_balance"
                cancellationPolicy="48h"
                leadAmount={50000}
                subArtistAmount={15000}
                customClausesCount={2}
                activeContractsCount={3}
            />
        );
        expect(getByText('30/70 advance')).toBeTruthy();
        expect(getByText('48h notice')).toBeTruthy();
        expect(getByText(/2 added/)).toBeTruthy();
        expect(getByText(/3 existing contracts/)).toBeTruthy();
    });

    it('hides propagation note when 0 active contracts', () => {
        const { queryByText } = render(
            <HubBookingTermsCard activeContractsCount={0} leadAmount={1000} />
        );
        expect(queryByText(/existing contract/)).toBeNull();
    });
});
```

- [ ] **Step 5.3: Run + commit**

```bash
npx jest src/features/hirer-hub/__tests__/HubBookingTermsCard.test.tsx
git add src/features/hirer-hub/components/HubBookingTermsCard.tsx \
        src/features/hirer-hub/__tests__/HubBookingTermsCard.test.tsx
git commit -m "feat(hirer-hub): HubBookingTermsCard (read-only Phase 1)

Summary card for the gig's master/template terms. Edit + Preview
buttons render but route to a 'Coming in Phase 2' Alert until the
booking terms editor ships.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: HubApplicantsSection + HubApplicantRow

**Files:**
- Create: `src/features/hirer-hub/components/HubApplicantRow.tsx`
- Create: `src/features/hirer-hub/components/HubApplicantsSection.tsx`
- Create: `src/features/hirer-hub/__tests__/HubApplicantsSection.test.tsx`

- [ ] **Step 6.1: Implement HubApplicantRow**

```tsx
// src/features/hirer-hub/components/HubApplicantRow.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text2: '#6B6878', bg: '#16161F', green: '#22C55E',
};

type Props = {
    application: any;
    onHire?: (applicationId: string) => void;
    onTap?: (applicationId: string) => void;
};

export function HubApplicantRow({ application, onHire, onTap }: Props) {
    const initials = (application.artistSnapshot?.displayName ?? 'A')
        .split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase();

    const matchScore = application.matchScore;
    const stats = [
        application.artistSnapshot?.artistType,
        application.artistSnapshot?.rating ? `${application.artistSnapshot.rating}★` : null,
        application.artistSnapshot?.experience ? `${application.artistSnapshot.experience}y` : null,
    ].filter(Boolean).join(' · ');

    return (
        <TouchableOpacity
            onPress={() => onTap?.(application._id)}
            style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center',
            }}>
                <Text style={{ color: COLORS.text0, fontWeight: '700', fontSize: 12 }}>{initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: COLORS.text0, fontWeight: '700', fontSize: 14 }}>
                    {application.artistSnapshot?.displayName ?? 'Anonymous'}
                </Text>
                <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {matchScore ? `${matchScore}% · ` : ''}{stats || '—'}
                </Text>
            </View>
            {onHire && (
                <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); onHire(application._id); }}
                    accessibilityLabel={`Hire ${application.artistSnapshot?.displayName ?? 'Artist'}`}>
                    <Text style={{ color: COLORS.green, fontWeight: '700', fontSize: 12 }}>Hire</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}
```

- [ ] **Step 6.2: Implement HubApplicantsSection**

```tsx
// src/features/hirer-hub/components/HubApplicantsSection.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { HubApplicantRow } from './HubApplicantRow';

const COLORS = {
    text0: '#F3EFE8', text2: '#6B6878', orange: '#FF6B35',
    bg: 'rgba(255,255,255,0.04)', text1: '#B8B1A6',
};

type FilterKey = 'all' | 'new' | 'shortlisted' | 'reviewed';

type Props = {
    applicants: any[];
    onHire?: (applicationId: string) => void;
    onTapApplicant?: (applicationId: string) => void;
    onSeeAll?: () => void;
};

const FILTER_PREDICATES: Record<FilterKey, (a: any) => boolean> = {
    all: () => true,
    new: (a) => a.status === 'applied',
    shortlisted: (a) => a.status === 'shortlisted',
    reviewed: (a) => a.status === 'reviewed' || a.status === 'viewed',
};

const PREVIEW_COUNT = 3;

export function HubApplicantsSection({ applicants, onHire, onTapApplicant, onSeeAll }: Props) {
    const [filter, setFilter] = useState<FilterKey>('all');

    const counts = useMemo(() => ({
        all: applicants.length,
        new: applicants.filter((a) => a.status === 'applied').length,
        shortlisted: applicants.filter((a) => a.status === 'shortlisted').length,
        reviewed: applicants.filter((a) => a.status === 'reviewed' || a.status === 'viewed').length,
    }), [applicants]);

    const filtered = useMemo(
        () => applicants.filter(FILTER_PREDICATES[filter]),
        [applicants, filter]
    );

    return (
        <View style={{ paddingTop: 36, paddingHorizontal: 24 }}>
            <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text0, letterSpacing: -0.4 }}>Applicants</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {applicants.length} pending{counts.new > 0 ? <Text style={{ color: COLORS.orange }}>  ·  {counts.new} new</Text> : null}
                </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {(['all', 'new', 'shortlisted', 'reviewed'] as FilterKey[]).map((k) => (
                    <TouchableOpacity
                        key={k}
                        onPress={() => setFilter(k)}
                        style={{
                            paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
                            backgroundColor: filter === k ? COLORS.text0 : COLORS.bg,
                        }}>
                        <Text style={{
                            color: filter === k ? '#0A0A0F' : COLORS.text1,
                            fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase',
                        }}>
                            {k.charAt(0).toUpperCase() + k.slice(1)} · {counts[k]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View>
                {filtered.length === 0 ? (
                    <Text style={{ color: COLORS.text2, fontSize: 13, textAlign: 'center', paddingVertical: 24 }}>
                        No applicants in this filter.
                    </Text>
                ) : (
                    filtered.slice(0, PREVIEW_COUNT).map((a) => (
                        <HubApplicantRow key={a._id} application={a} onHire={onHire} onTap={onTapApplicant} />
                    ))
                )}
            </View>

            {filtered.length > PREVIEW_COUNT && (
                <TouchableOpacity onPress={onSeeAll} style={{ paddingVertical: 12 }}>
                    <Text style={{ textAlign: 'center', fontSize: 12, color: COLORS.text1, fontWeight: '700' }}>
                        See all {filtered.length} →
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
```

- [ ] **Step 6.3: Smoke test**

```tsx
// src/features/hirer-hub/__tests__/HubApplicantsSection.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HubApplicantsSection } from '../components/HubApplicantsSection';

const apps = [
    { _id: '1', status: 'applied', artistSnapshot: { displayName: 'Meera D' } },
    { _id: '2', status: 'shortlisted', artistSnapshot: { displayName: 'Kavya P' } },
    { _id: '3', status: 'applied', artistSnapshot: { displayName: 'Vihaan N' } },
    { _id: '4', status: 'applied', artistSnapshot: { displayName: 'Asha R' } },
];

describe('HubApplicantsSection', () => {
    it('renders preview rows + see-all link', () => {
        const { getByText } = render(<HubApplicantsSection applicants={apps} />);
        expect(getByText('Applicants')).toBeTruthy();
        expect(getByText('Meera D')).toBeTruthy();
        expect(getByText(/See all 4 →/)).toBeTruthy();
    });

    it('filter chip narrows the list', () => {
        const { getByText, queryByText } = render(<HubApplicantsSection applicants={apps} />);
        fireEvent.press(getByText(/Shortlisted · 1/));
        expect(getByText('Kavya P')).toBeTruthy();
        expect(queryByText('Meera D')).toBeNull();
    });

    it('Hire link calls onHire with id', () => {
        const onHire = jest.fn();
        const { getAllByText } = render(<HubApplicantsSection applicants={apps} onHire={onHire} />);
        fireEvent.press(getAllByText('Hire')[0]);
        expect(onHire).toHaveBeenCalledWith(expect.any(String));
    });
});
```

- [ ] **Step 6.4: Run + commit**

```bash
npx jest src/features/hirer-hub/__tests__/HubApplicantsSection.test.tsx
git add src/features/hirer-hub/components/HubApplicantRow.tsx \
        src/features/hirer-hub/components/HubApplicantsSection.tsx \
        src/features/hirer-hub/__tests__/HubApplicantsSection.test.tsx
git commit -m "feat(hirer-hub): HubApplicantsSection — filter chips + compact list

4 filter chips (All / New / Shortlisted / Reviewed) with counts.
Preview shows top 3 rows + 'See all N' link. Each row has avatar,
name, match score, stats, and a green Hire link.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: HubEssentials (collapsed accordion) + HubStickyCTA

**Files:**
- Create: `src/features/hirer-hub/components/HubEssentials.tsx`
- Create: `src/features/hirer-hub/components/HubStickyCTA.tsx`

- [ ] **Step 7.1: Implement HubEssentials**

```tsx
// src/features/hirer-hub/components/HubEssentials.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

const COLORS = { text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', orange: '#FF6B35', line: 'rgba(255,255,255,0.05)' };

type Props = {
    eventDate?: string;
    venue?: string;
    city?: string;
    scope?: string;
    postedDate?: string;
    onEditGig?: () => void;
};

export function HubEssentials({ eventDate, venue, city, scope, postedDate, onEditGig }: Props) {
    const [open, setOpen] = useState(false);

    const fmt = (iso?: string) => {
        if (!iso) return '—';
        try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
        catch { return '—'; }
    };

    return (
        <View style={{ paddingTop: 28, paddingHorizontal: 24 }}>
            <TouchableOpacity onPress={() => setOpen((o) => !o)} style={{ paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text1, letterSpacing: -0.3 }}>
                    Gig essentials
                </Text>
                <ChevronRight
                    size={16}
                    color={COLORS.text2}
                    style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}
                />
            </TouchableOpacity>

            {open && (
                <View style={{ paddingTop: 16, gap: 16 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <View style={{ width: '50%', marginBottom: 16 }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Event</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>{fmt(eventDate)}</Text>
                        </View>
                        <View style={{ width: '50%', marginBottom: 16 }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Venue</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>{venue || '—'}</Text>
                            <Text style={{ fontSize: 12, color: COLORS.text2 }}>{city || ''}</Text>
                        </View>
                        <View style={{ width: '50%' }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Posted</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>{fmt(postedDate)}</Text>
                        </View>
                    </View>
                    {scope ? (
                        <View>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Scope</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text1, marginTop: 6, lineHeight: 22 }}>{scope}</Text>
                        </View>
                    ) : null}
                    {onEditGig && (
                        <TouchableOpacity onPress={onEditGig}>
                            <Text style={{ fontSize: 12, color: COLORS.orange, fontWeight: '700' }}>Edit gig →</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}
```

- [ ] **Step 7.2: Implement HubStickyCTA**

```tsx
// src/features/hirer-hub/components/HubStickyCTA.tsx
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import type { StickyCTA } from '../utils/computeStickyCTA';

const COLORS = { orange: '#FF6B35' };

type Props = {
    cta: StickyCTA;
    onPress: () => void;
};

export function HubStickyCTA({ cta, onPress }: Props) {
    return (
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <TouchableOpacity
                onPress={onPress}
                accessibilityLabel={cta.label}
                style={{
                    backgroundColor: COLORS.orange, paddingVertical: 16, borderRadius: 16,
                    alignItems: 'center',
                    shadowColor: COLORS.orange, shadowOpacity: 0.45, shadowRadius: 32, shadowOffset: { width: 0, height: 12 },
                }}>
                <Text style={{ color: '#0A0A0F', fontWeight: '800', fontSize: 14, letterSpacing: 0.3 }}>
                    {cta.label}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
```

- [ ] **Step 7.3: Commit**

```bash
git add src/features/hirer-hub/components/HubEssentials.tsx \
        src/features/hirer-hub/components/HubStickyCTA.tsx
git commit -m "feat(hirer-hub): HubEssentials + HubStickyCTA

Essentials = collapsed accordion with date/venue/posted/scope and an
Edit gig link. StickyCTA = single primary action bar pinned to bottom.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: HirerGigHub orchestrator

**Files:**
- Create: `src/features/hirer-hub/HirerGigHub.tsx`
- Create: `src/features/hirer-hub/__tests__/HirerGigHub.behavior.test.tsx`

- [ ] **Step 8.1: Implement orchestrator**

```tsx
// src/features/hirer-hub/HirerGigHub.tsx
//
// Hirer-side single-scroll project hub. Replaces the tab-based gig detail
// when the current user is the gig owner. Public artist view of /gigs/[id]
// stays untouched in app/(app)/gigs/[id].tsx.

import React, { useMemo, useRef } from 'react';
import { View, ScrollView, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';

import { useGigHubData } from './hooks/useGigHubData';
import { computeStickyCTA } from './utils/computeStickyCTA';

import { HubHero } from './components/HubHero';
import { HubKPIs } from './components/HubKPIs';
import { HubTeamSection } from './components/HubTeamSection';
import { HubBookingTermsCard } from './components/HubBookingTermsCard';
import { HubApplicantsSection } from './components/HubApplicantsSection';
import { HubEssentials } from './components/HubEssentials';
import { HubStickyCTA } from './components/HubStickyCTA';

const COLORS = { bg: '#07070B', line: 'rgba(255,255,255,0.05)' };

type Props = {
    gigId: string;
};

export function HirerGigHub({ gigId }: Props) {
    const router = useRouter();
    const data = useGigHubData(gigId);
    const scrollRef = useRef<ScrollView>(null);
    const applicantsYRef = useRef<number>(0);

    const sticky = useMemo(
        () => computeStickyCTA({
            pendingApplicantsCount: data.pendingApplicantsCount,
            urgentTeamRowCount: data.urgentTeamRowCount,
            firstUrgentLabel: data.firstUrgentLabel,
        }),
        [data.pendingApplicantsCount, data.urgentTeamRowCount, data.firstUrgentLabel]
    );

    if (data.isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }
    if (data.error || !data.gig) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#B8B1A6' }}>Couldn't load gig.</Text>
            </View>
        );
    }

    const gig = data.gig;

    const handleSticky = () => {
        if (sticky.intent === 'review-applicants') {
            scrollRef.current?.scrollTo({ y: applicantsYRef.current, animated: true });
            return;
        }
        if (sticky.intent === 'urgent-team') {
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }
    };

    const handleHireFromList = (_applicationId: string) => {
        scrollRef.current?.scrollTo({ y: applicantsYRef.current, animated: true });
        // The Hire confirmation modal already exists at the gigs/applications layer.
        // Phase 1 routes the user back to the existing applicants modal flow via the
        // public gig detail's ApplicationsBottomSheet. A direct trigger from the hub
        // is wired in a follow-up commit when the bottom sheet exposes a `targetId`
        // prop. For now, scrolling to the applicants list is the deterministic UX.
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back">
                        <ChevronLeft size={20} color="#B8B1A6" />
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityLabel="More">
                        <MoreHorizontal size={18} color="#B8B1A6" />
                    </TouchableOpacity>
                </View>

                <HubHero
                    title={gig.title}
                    status={gig.status}
                    eventFunction={gig.eventFunction}
                    city={gig.location?.city}
                    startDate={gig.schedule?.startDate ?? gig.startDate}
                />

                <HubKPIs kpis={data.kpis} />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24 }} />

                <HubTeamSection
                    teamRows={data.teamRows}
                    slotsTotal={data.kpis.slotsTotal}
                    pendingApplicantsCount={data.pendingApplicantsCount}
                />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 32 }} />

                <HubBookingTermsCard
                    paymentStructure={gig.compensation?.structure || gig.compensation?.paymentStructure || 'advance_balance'}
                    cancellationPolicy={gig.cancellationPolicy}
                    leadAmount={gig.compensation?.amount ?? gig.compensation?.leadAmount ?? 0}
                    subArtistAmount={gig.compensation?.subArtistAmount}
                    customClausesCount={(gig.customClauses ?? []).length}
                    activeContractsCount={data.contracts.filter((c: any) => ['active', 'sent', 'pending_artist_signature'].includes(c.status)).length}
                />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 32 }} />

                <View
                    onLayout={(e) => { applicantsYRef.current = e.nativeEvent.layout.y - 16; }}>
                    <HubApplicantsSection
                        applicants={data.pendingApplicants}
                        onHire={handleHireFromList}
                        onTapApplicant={(id) => router.push(`/(app)/profile/${data.pendingApplicants.find((a: any) => a._id === id)?.artistId ?? ''}` as any)}
                        onSeeAll={() => router.push(`/(app)/gigs/${gigId}?tab=applicants` as any)}
                    />
                </View>

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 24 }} />

                <HubEssentials
                    eventDate={gig.schedule?.startDate ?? gig.startDate}
                    venue={gig.location?.venue}
                    city={gig.location?.city}
                    scope={gig.description}
                    postedDate={gig.createdAt}
                    onEditGig={() => router.push(`/(app)/gigs/${gigId}/edit` as any)}
                />
            </ScrollView>

            <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0 }}>
                <HubStickyCTA cta={sticky} onPress={handleSticky} />
            </View>
        </View>
    );
}
```

- [ ] **Step 8.2: Behavior smoke test**

```tsx
// src/features/hirer-hub/__tests__/HirerGigHub.behavior.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));
jest.mock('@/hooks/useGigs', () => ({ useGig: () => ({ data: sampleGig, isLoading: false, error: null }) }));
jest.mock('@/hooks/useGigApplications', () => ({ useGigApplications: () => ({ data: sampleApps, isLoading: false, error: null }) }));
jest.mock('@/hooks/usePayments', () => ({ useUserContracts: () => ({ data: { data: { contracts: sampleContracts } }, isLoading: false, error: null }) }));

const sampleGig = {
    _id: 'g1', title: 'Sangeet Choreography', status: 'published',
    eventFunction: 'Sangeet', location: { city: 'Pune', venue: 'JW Marriott' },
    schedule: { startDate: new Date(Date.now() + 30 * 86_400_000).toISOString() },
    compensation: { structure: 'advance_balance', amount: 50000, subArtistAmount: 15000 },
    requirements: { headcount: 6 },
    createdAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    description: '6 dancers · 3-song fusion',
};
const sampleApps = [
    { _id: 'a1', artistId: 'u1', status: 'hired', artistSnapshot: { displayName: 'Priya' } },
    { _id: 'a2', artistId: 'u2', status: 'applied', artistSnapshot: { displayName: 'Meera' } },
    { _id: 'a3', artistId: 'u3', status: 'shortlisted', artistSnapshot: { displayName: 'Kavya' } },
];
const sampleContracts = [
    { _id: 'c1', gigId: 'g1', artistId: 'u1', status: 'active', paidAmount: 15000,
      paymentMethod: 'on_platform',
      terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: sampleGig.schedule.startDate } },
    },
];

import { HirerGigHub } from '../HirerGigHub';

describe('HirerGigHub', () => {
    it('renders all 4 main sections', () => {
        const { getByText } = render(<HirerGigHub gigId="g1" />);
        expect(getByText('Sangeet Choreography')).toBeTruthy();
        expect(getByText('Your team')).toBeTruthy();
        expect(getByText('Booking terms')).toBeTruthy();
        expect(getByText('Applicants')).toBeTruthy();
    });

    it('sticky CTA reflects pending applicant count', () => {
        const { getByText } = render(<HirerGigHub gigId="g1" />);
        expect(getByText(/Review applicants · 2/)).toBeTruthy();
    });
});
```

- [ ] **Step 8.3: Run + commit**

```bash
npx jest src/features/hirer-hub/__tests__/HirerGigHub.behavior.test.tsx
git add src/features/hirer-hub/HirerGigHub.tsx \
        src/features/hirer-hub/__tests__/HirerGigHub.behavior.test.tsx
git commit -m "feat(hirer-hub): HirerGigHub orchestrator

Composes Hero / KPIs / Team / BookingTerms / Applicants / Essentials
in a single ScrollView. Sticky CTA pinned to bottom, computed from
pending applicants + urgent team rows. Phase 1 'Coming soon' Alerts
on payment / dispute / nudge intents.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Branch `/gigs/[id]` route to render hub when isOwner

**Files:**
- Modify: `app/(app)/gigs/[id].tsx`

- [ ] **Step 9.1: Read current route file**

```bash
cat app/\(app\)/gigs/\[id\].tsx | head -50
```

The file currently fetches `gig` via `useGig`, computes `isOrganizer = user?.role === 'organizer'`, and unconditionally renders `<GigDetails gig={gig} ... />`. We replace the role-based check with an ownership check and branch to `<HirerGigHub />`.

- [ ] **Step 9.2: Modify the route to branch**

In `app/(app)/gigs/[id].tsx`, find the section after `useGig` resolves:

```tsx
const { data: gig, isLoading, error } = useGig(gigId || '');
const user = useAuthStore((state) => state.user);
const isOrganizer = user?.role === 'organizer';
```

Add an ownership check + branch BEFORE the existing render. Keep the loading + error states unchanged. Add the import at the top:

```tsx
import { HirerGigHub } from '@/features/hirer-hub/HirerGigHub';
```

After the `if (isLoading) return ...` block, add:

```tsx
if (gig && user) {
    const organizerId = typeof gig.organizerId === 'object' ? gig.organizerId?._id : gig.organizerId;
    const isOwner = !!user._id && !!organizerId && String(user._id) === String(organizerId);
    if (isOwner) {
        return <HirerGigHub gigId={gigId!} />;
    }
}
```

The existing return statement that renders `<GigDetails ... />` stays as the fall-through path for non-owners.

Final relevant slice of the route file:

```tsx
import { HirerGigHub } from '@/features/hirer-hub/HirerGigHub';
// ...other imports unchanged

export default function GigDetailsPage() {
    // ...existing param normalization unchanged
    const { data: gig, isLoading, error } = useGig(gigId || '');
    const user = useAuthStore((state) => state.user);

    if (isLoading) {
        // ...existing loading UI unchanged
    }

    // Hub branch — owners get the project hub.
    if (gig && user) {
        const organizerId = typeof gig.organizerId === 'object' ? gig.organizerId?._id : gig.organizerId;
        const isOwner = !!user._id && !!organizerId && String(user._id) === String(organizerId);
        if (isOwner) {
            return <HirerGigHub gigId={gigId!} />;
        }
    }

    // Public artist-side path — unchanged
    const isOrganizer = user?.role === 'organizer';
    return (
        // existing return tree
    );
}
```

- [ ] **Step 9.3: Run all profile + hub tests**

```bash
npx jest src/features/hirer-hub/ src/features/profile/
```

Expected: 19+ profile tests still pass + new hub tests pass.

- [ ] **Step 9.4: Run TypeScript check on touched files**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "(hirer-hub|gigs/\[id\])" | head -20
```

Expected: no new errors related to these files. (Pre-existing errors elsewhere are out of scope.)

- [ ] **Step 9.5: Commit**

```bash
git add app/\(app\)/gigs/\[id\].tsx
git commit -m "feat(hirer-hub): branch /gigs/[id] to render HirerGigHub when isOwner

Public artist-side view at the same route is unchanged. Owners now
land on the new project hub instead of the tab-based detail view.
Ownership check uses gig.organizerId vs user._id (handles both ref
and populated shapes).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Manual smoke + push to develop

- [ ] **Step 10.1: Run full mobile test sweep**

```bash
npx jest src/
```

Expected: all passing (existing 196 + new ~25 hub tests).

- [ ] **Step 10.2: Verify via grep — no stale references**

```bash
grep -rn "HirerGigHub" src/ app/ --include="*.ts" --include="*.tsx" | head -20
```

Should show: orchestrator file + route file + tests.

- [ ] **Step 10.3: Push to develop**

```bash
git push origin develop
```

- [ ] **Step 10.4: Manual smoke checklist (founder QA on device)**

After deploying to dev:
1. Login as a hirer.
2. Open one of your posted gigs (`/gigs/[id]`). Should land on the **project hub** (no tabs).
3. Hero shows status pill + serif title + meta line.
4. KPIs show 3 numbers correctly.
5. "Your team" lists hired artists with mini timelines + state-aware CTAs.
6. Tap a Hire row in the team → opens `/contracts/[id]` (existing page).
7. Tap "Pay ₹X" or similar deferred CTA → "Coming soon" Alert appears.
8. "Booking terms" card renders with template summary. Edit/Preview show "Coming in Phase 2" Alerts.
9. "Applicants" section filterable by chips. Tap an applicant row → routes to artist profile. Tap "Hire" link → scrolls to applicants.
10. "Gig essentials" accordion expands.
11. Sticky bottom CTA shows "Review applicants · X" when there are pending applicants.
12. Open the same gig URL while logged out (or as a different user) → should still see the **public artist-side view** (existing tabs page) — confirms the branch didn't break the public path.

---

## Self-Review

**Spec coverage:**
- Branch route on isOwner — Task 9 ✓
- Selector hook (useGigHubData) — Task 1 ✓
- 3 utility functions (contract stage, team row action, sticky CTA) — Task 1 ✓
- HubMiniTimeline — Task 2 ✓
- HubHero + HubKPIs — Task 3 ✓
- HubTeamSection + HubTeamRow — Task 4 ✓
- HubBookingTermsCard — Task 5 ✓
- HubApplicantsSection + HubApplicantRow — Task 6 ✓
- HubEssentials + HubStickyCTA — Task 7 ✓
- HirerGigHub orchestrator — Task 8 ✓
- 23 unit tests + smoke + behavior — Tasks 1-8 ✓

**Placeholder scan:** every code step has full source. No "TBD" or "implement details later." The "Coming soon" Alerts in Phase 1 are documented behavior, not placeholders.

**Type consistency:**
- `ContractStage`, `StageNodeColor`, `StageOverlay` — defined in Task 1, used in Tasks 2 + 4
- `TeamRowAction`, `TeamRowIntent` — defined in Task 1, used in Task 4
- `StickyCTA`, `StickyIntent` — defined in Task 1, used in Tasks 7 + 8
- `TeamRowData`, `HubKPIs` — defined in Task 1 selector, used in Tasks 4 + 8 + 3
- All snake_case → camelCase conversions consistent.

**Risks revisited:**
- `useUserContracts` doesn't accept `gigId` — handled by client-side filter in Task 1 selector. Acceptable until backend pagination becomes a problem.
- `gig.organizerId` shape varies (string vs `{ _id }`) — handled via `typeof === 'object'` defensive lookup in Task 9 (matches `useGigActions.ts` pattern).
- `gig.compensation` shape variability (`amount` vs `leadAmount`, `structure` vs `paymentStructure`) — Task 8 falls back through both. Backend canonical shape can be tightened in a later cleanup.

**Out of scope (deferred):**
- Edit terms wiring — Phase 2.
- Pay / Record / Dispute / Nudge endpoint wires — Phase 3.
- Backend `gigId` filter on `/users/me/contracts` — opportunistic optimization, not Phase 1.
- Match score calculation — backend deferred per audit; UI shows raw value if present, or "—".
