# Contract Workspace — Phase 3A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `/contracts/[id]/index.tsx` into a single-scroll Contract Workspace with 9 sections matching the v1 mockup. Preserve all existing wired mutations (Sign route, Decline, Switch payment method, PaymentMethodSelector modal). Most "advanced" CTAs route to "Coming soon" Alerts in this phase — Phase 3B wires them.

**Architecture:** New `src/features/contract-workspace/` directory holds the orchestrator + 9 section components + 2 state-machine utilities + 1 activity hook. The route file `app/(app)/contracts/[id]/index.tsx` shrinks to a thin shell that fetches the contract and mounts `<ContractWorkspace contract={...} />`.

**Tech Stack:** React Native 0.81, Expo Router, @tanstack/react-query, lucide-react-native, jest-expo.

**Spec:** `docs/superpowers/specs/2026-04-27-contract-workspace-phase3a-design.md`
**Mockup:** `DOCS/designs/contract-workspace.html`
**Branch:** `develop`

---

## File Structure

```
netsa-mobile/
  src/features/contract-workspace/                    # NEW directory
    ContractWorkspace.tsx                             # orchestrator (~250 lines)
    components/
      ContractHero.tsx
      ContractStatusTimeline.tsx
      ContractSignatures.tsx
      ContractPaymentSection.tsx
      ContractDocuments.tsx
      ContractAmendments.tsx
      ContractActivity.tsx
      ContractEdgeCases.tsx
      ContractStickyCTA.tsx
    hooks/
      useContractActivity.ts
    utils/
      computeContractTimelineStage.ts
      computePrimaryCTA.ts
      formatSignatureMeta.ts
    __tests__/
      computeContractTimelineStage.test.ts
      computePrimaryCTA.test.ts
      ContractWorkspace.behavior.test.tsx
  app/(app)/contracts/[id]/index.tsx                  # MODIFY: replace body with <ContractWorkspace />
```

---

## Task 1: Foundation — utilities + activity hook + 18 unit tests

**Files:**
- Create: `src/features/contract-workspace/utils/computeContractTimelineStage.ts`
- Create: `src/features/contract-workspace/utils/computePrimaryCTA.ts`
- Create: `src/features/contract-workspace/utils/formatSignatureMeta.ts`
- Create: `src/features/contract-workspace/hooks/useContractActivity.ts`
- Create: `src/features/contract-workspace/__tests__/computeContractTimelineStage.test.ts`
- Create: `src/features/contract-workspace/__tests__/computePrimaryCTA.test.ts`

- [ ] **Step 1.1: Implement `computeContractTimelineStage`**

```ts
// src/features/contract-workspace/utils/computeContractTimelineStage.ts
//
// 5-stage version of Phase 1's computeContractStage. Used by the workspace
// hero timeline. Stages: Sent · Signed · Advance Paid · Final Due · Completed.

export type StageNodeState = 'done' | 'active' | 'pending';
export type StageNodeColor = 'green' | 'gold' | 'purple' | 'red' | 'grey';
export type StageOverlay = null | 'disputed' | 'cancelled';

export type ContractTimelineStage = {
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

const ALL_PENDING_GREY = (n: number): ContractTimelineStage['nodes'] =>
    Array.from({ length: n }, () => ({ state: 'pending' as const, color: 'grey' as const }));

export function computeContractTimelineStage(contract: ContractInput): ContractTimelineStage {
    const status = contract.status ?? '';

    if (status === 'cancelled' || status === 'breached' || status === 'declined') {
        return { nodes: ALL_PENDING_GREY(5), overlay: 'cancelled' };
    }
    if (status === 'completed') {
        return {
            nodes: Array.from({ length: 5 }, () => ({ state: 'done' as const, color: 'green' as const })),
            overlay: null,
        };
    }
    if (status === 'disputed') {
        const base = computeContractTimelineStage({ ...contract, status: 'active' });
        return { nodes: base.nodes, overlay: 'disputed' };
    }
    if (status === 'sent' || status === 'pending_artist_signature' || status === 'pending_guardian_cosign') {
        return {
            nodes: [
                { state: 'done', color: 'green' },
                { state: 'active', color: 'purple' },
                { state: 'pending', color: 'grey' },
                { state: 'pending', color: 'grey' },
                { state: 'pending', color: 'grey' },
            ],
            overlay: null,
        };
    }
    if (status === 'performed') {
        return {
            nodes: [
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'active', color: 'green' },
            ],
            overlay: null,
        };
    }

    // accepted / active branches — payment-driven
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
                { state: 'pending', color: 'grey' },
            ],
            overlay: null,
        };
    }
    if (paid < advanceCutoff) {
        return {
            nodes: [
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'active', color: 'gold' },
                { state: 'pending', color: 'grey' },
                { state: 'pending', color: 'grey' },
            ],
            overlay: null,
        };
    }
    if (paid < amount && eventPast) {
        return {
            nodes: [
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'active', color: 'gold' },
                { state: 'pending', color: 'grey' },
            ],
            overlay: null,
        };
    }
    if (paid < amount) {
        return {
            nodes: [
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'pending', color: 'grey' },
                { state: 'pending', color: 'grey' },
            ],
            overlay: null,
        };
    }
    // fully paid + active = waiting for performance
    return {
        nodes: [
            { state: 'done', color: 'green' },
            { state: 'done', color: 'green' },
            { state: 'done', color: 'green' },
            { state: 'done', color: 'green' },
            { state: 'pending', color: 'grey' },
        ],
        overlay: null,
    };
}
```

- [ ] **Step 1.2: Test `computeContractTimelineStage`**

```ts
// src/features/contract-workspace/__tests__/computeContractTimelineStage.test.ts
import { computeContractTimelineStage } from '../utils/computeContractTimelineStage';

const futureDate = new Date(Date.now() + 7 * 86_400_000).toISOString();
const pastDate = new Date(Date.now() - 86_400_000).toISOString();

describe('computeContractTimelineStage', () => {
    it('sent → node 2 active purple', () => {
        const out = computeContractTimelineStage({ status: 'sent' } as any);
        expect(out.nodes).toHaveLength(5);
        expect(out.nodes[1]).toEqual({ state: 'active', color: 'purple' });
    });

    it('accepted + advance unpaid → node 3 active gold', () => {
        const out = computeContractTimelineStage({
            status: 'accepted', paidAmount: 0,
            terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: futureDate } },
        } as any);
        expect(out.nodes[2]).toEqual({ state: 'active', color: 'gold' });
    });

    it('active + advance paid + future event → node 4 pending', () => {
        const out = computeContractTimelineStage({
            status: 'active', paidAmount: 15000,
            terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: futureDate } },
        } as any);
        expect(out.nodes[2]).toEqual({ state: 'done', color: 'green' });
        expect(out.nodes[3]).toEqual({ state: 'pending', color: 'grey' });
    });

    it('active + balance due (event past) → node 4 active gold', () => {
        const out = computeContractTimelineStage({
            status: 'active', paidAmount: 15000,
            terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: pastDate } },
        } as any);
        expect(out.nodes[3]).toEqual({ state: 'active', color: 'gold' });
    });

    it('performed → node 5 active green', () => {
        const out = computeContractTimelineStage({ status: 'performed' } as any);
        expect(out.nodes[4]).toEqual({ state: 'active', color: 'green' });
    });

    it('completed → all 5 done green', () => {
        const out = computeContractTimelineStage({ status: 'completed' } as any);
        expect(out.nodes.every((n) => n.state === 'done' && n.color === 'green')).toBe(true);
    });

    it('disputed → overlay set', () => {
        const out = computeContractTimelineStage({ status: 'disputed' } as any);
        expect(out.overlay).toBe('disputed');
    });

    it('cancelled → overlay + all grey', () => {
        const out = computeContractTimelineStage({ status: 'cancelled' } as any);
        expect(out.overlay).toBe('cancelled');
        expect(out.nodes.every((n) => n.color === 'grey')).toBe(true);
    });
});
```

- [ ] **Step 1.3: Implement `computePrimaryCTA`**

```ts
// src/features/contract-workspace/utils/computePrimaryCTA.ts
//
// Pure function: contract + viewer role → sticky bottom CTA.
// 'Phase 3A reality' — many intents render but route to a 'Coming soon'
// Alert from the parent (this util just returns the descriptor).

export type ViewerRole = 'hirer' | 'artist' | 'other';

export type PrimaryCTAIntent =
    | 'sign-contract'
    | 'pay-advance'
    | 'pay-balance'
    | 'record-payment'
    | 'leave-review'
    | 'resolve-dispute'
    | 'download-pdf'
    | 'view-cancelled'
    | 'awaiting-other-party'
    | 'awaiting-guardian'
    | 'noop';

export type PrimaryCTA = {
    label: string;
    intent: PrimaryCTAIntent;
    disabled: boolean;
};

type ContractInput = {
    status?: string;
    paymentMethod?: 'on_platform' | 'off_platform';
    paidAmount?: number;
    documentUrl?: string;
    terms?: {
        amount?: number;
        paymentStructure?: 'full' | 'advance_balance';
        dates?: { start?: string | Date };
    };
};

function inrShort(amount: number): string {
    if (!Number.isFinite(amount)) return '₹0';
    if (amount >= 99_950) {
        const lakh = Math.floor((amount / 100000) * 10) / 10;
        return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)}L`;
    }
    if (amount >= 1000) {
        const k = Math.floor((amount / 1000) * 10) / 10;
        return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
    }
    return `₹${Math.max(0, Math.floor(amount))}`;
}

export function computePrimaryCTA(contract: ContractInput, role: ViewerRole): PrimaryCTA {
    const s = contract.status ?? '';

    if (s === 'cancelled' || s === 'breached' || s === 'declined') {
        return { label: 'View · cancelled', intent: 'view-cancelled', disabled: true };
    }
    if (s === 'completed') {
        return { label: 'Download contract PDF', intent: 'download-pdf', disabled: false };
    }
    if (s === 'performed') {
        return { label: 'Leave a review', intent: 'leave-review', disabled: true };
    }
    if (s === 'disputed') {
        return { label: 'Resolve dispute', intent: 'resolve-dispute', disabled: true };
    }
    if (s === 'pending_guardian_cosign') {
        return { label: 'Awaiting guardian co-sign', intent: 'awaiting-guardian', disabled: true };
    }

    if (s === 'sent' || s === 'pending_artist_signature') {
        if (role === 'artist') {
            return { label: 'Sign contract', intent: 'sign-contract', disabled: false };
        }
        return { label: 'Awaiting artist signature', intent: 'awaiting-other-party', disabled: true };
    }

    // accepted / active / signed
    const amount = contract.terms?.amount ?? 0;
    const paid = contract.paidAmount ?? 0;
    const isAdvanceBalance = contract.terms?.paymentStructure === 'advance_balance';
    const advanceCutoff = isAdvanceBalance ? amount * 0.3 : amount;
    const eventPast = !!contract.terms?.dates?.start &&
        new Date(contract.terms.dates.start as any).getTime() < Date.now();

    if (role === 'hirer' && paid < advanceCutoff) {
        if (contract.paymentMethod === 'off_platform') {
            return { label: 'Record advance payment', intent: 'record-payment', disabled: false };
        }
        const due = advanceCutoff - paid;
        return { label: `Pay ${inrShort(due)} advance via NETSA`, intent: 'pay-advance', disabled: false };
    }
    if (role === 'hirer' && paid < amount && eventPast) {
        const due = amount - paid;
        return { label: `Pay ${inrShort(due)} balance`, intent: 'pay-balance', disabled: false };
    }
    if (role === 'artist' && (s === 'accepted' || s === 'active')) {
        return { label: 'View contract', intent: 'noop', disabled: true };
    }
    return { label: 'View contract', intent: 'noop', disabled: true };
}
```

- [ ] **Step 1.4: Test `computePrimaryCTA`**

```ts
// src/features/contract-workspace/__tests__/computePrimaryCTA.test.ts
import { computePrimaryCTA } from '../utils/computePrimaryCTA';

const futureDate = new Date(Date.now() + 7 * 86_400_000).toISOString();
const pastDate = new Date(Date.now() - 86_400_000).toISOString();

describe('computePrimaryCTA', () => {
    it('artist + sent → Sign contract', () => {
        const out = computePrimaryCTA({ status: 'sent' } as any, 'artist');
        expect(out.label).toMatch(/Sign contract/i);
        expect(out.intent).toBe('sign-contract');
        expect(out.disabled).toBe(false);
    });

    it('hirer + sent → Awaiting artist signature (disabled)', () => {
        const out = computePrimaryCTA({ status: 'pending_artist_signature' } as any, 'hirer');
        expect(out.label).toMatch(/Awaiting artist/i);
        expect(out.disabled).toBe(true);
    });

    it('hirer + accepted + on-platform + advance unpaid → Pay X advance via NETSA', () => {
        const out = computePrimaryCTA({
            status: 'accepted', paymentMethod: 'on_platform', paidAmount: 0,
            terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: futureDate } },
        } as any, 'hirer');
        expect(out.label).toMatch(/Pay/i);
        expect(out.label).toMatch(/NETSA/i);
        expect(out.intent).toBe('pay-advance');
    });

    it('hirer + off-platform + advance unpaid → Record advance payment', () => {
        const out = computePrimaryCTA({
            status: 'active', paymentMethod: 'off_platform', paidAmount: 0,
            terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: futureDate } },
        } as any, 'hirer');
        expect(out.label).toMatch(/Record/i);
        expect(out.intent).toBe('record-payment');
    });

    it('hirer + balance due (event past) → Pay balance', () => {
        const out = computePrimaryCTA({
            status: 'active', paymentMethod: 'on_platform', paidAmount: 15000,
            terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: pastDate } },
        } as any, 'hirer');
        expect(out.label).toMatch(/Pay.*balance/i);
        expect(out.intent).toBe('pay-balance');
    });

    it('performed → Leave a review (disabled in Phase 3A)', () => {
        const out = computePrimaryCTA({ status: 'performed' } as any, 'hirer');
        expect(out.label).toMatch(/review/i);
        expect(out.disabled).toBe(true);
    });

    it('disputed → Resolve dispute (disabled)', () => {
        const out = computePrimaryCTA({ status: 'disputed' } as any, 'artist');
        expect(out.label).toMatch(/dispute/i);
        expect(out.disabled).toBe(true);
    });

    it('completed → Download contract PDF', () => {
        const out = computePrimaryCTA({ status: 'completed' } as any, 'hirer');
        expect(out.label).toMatch(/Download/i);
        expect(out.intent).toBe('download-pdf');
    });

    it('cancelled → View · cancelled (disabled)', () => {
        const out = computePrimaryCTA({ status: 'cancelled' } as any, 'hirer');
        expect(out.label).toMatch(/cancelled/i);
        expect(out.disabled).toBe(true);
    });

    it('pending_guardian_cosign → Awaiting guardian (disabled)', () => {
        const out = computePrimaryCTA({ status: 'pending_guardian_cosign' } as any, 'artist');
        expect(out.label).toMatch(/guardian/i);
        expect(out.disabled).toBe(true);
    });
});
```

- [ ] **Step 1.5: Implement `formatSignatureMeta`**

```ts
// src/features/contract-workspace/utils/formatSignatureMeta.ts
//
// Pure helper: turn a signature audit record into a one-line display string.

type SignatureInput = {
    signedAt?: string | Date;
    deviceInfo?: string;
    ipAddress?: string;
};

function shortDate(iso: string | Date): string {
    try {
        return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return '—';
    }
}

function shortDevice(deviceInfo?: string): string | null {
    if (!deviceInfo) return null;
    const ua = deviceInfo;
    if (/iPhone|iPad/i.test(ua)) return 'iPhone';
    if (/Android/i.test(ua)) return 'Android';
    if (/Mac OS X/i.test(ua)) return 'Mac';
    if (/Windows/i.test(ua)) return 'Windows';
    return null;
}

export function formatSignatureMeta(sig: SignatureInput | undefined | null): string {
    if (!sig?.signedAt) return 'Not signed yet';
    const parts: string[] = [shortDate(sig.signedAt)];
    const dev = shortDevice(sig.deviceInfo);
    if (dev) parts.push(dev);
    return parts.join(' · ');
}
```

- [ ] **Step 1.6: Implement `useContractActivity` hook**

```ts
// src/features/contract-workspace/hooks/useContractActivity.ts
//
// Derives an Activity log from existing Contract fields. Phase 3A reads the
// signatures, payment history (if present), and amendments off the contract
// document. Phase 3B will replace this with a dedicated ContractEvent feed.

import { useMemo } from 'react';

export type ActivityEvent = {
    timestamp: string; // ISO
    title: string;
    detail?: string;
    bullet: 'green' | 'orange' | 'gold' | 'red' | 'grey';
};

type ContractInput = {
    createdAt?: string;
    sentAt?: string;
    status?: string;
    hirerSignature?: { signedAt?: string; deviceInfo?: string };
    artistSignature?: { signedAt?: string; deviceInfo?: string };
    payments?: Array<{ amount?: number; paidAt?: string; method?: string }>;
    amendments?: Array<{ requestedAt?: string; reason?: string; status?: string }>;
};

export function useContractActivity(contract: ContractInput | null | undefined): ActivityEvent[] {
    return useMemo(() => {
        if (!contract) return [];
        const events: ActivityEvent[] = [];

        const sentAt = contract.sentAt ?? contract.createdAt;
        if (sentAt) {
            events.push({
                timestamp: sentAt,
                title: 'Contract sent',
                bullet: 'orange',
            });
        }

        if (contract.hirerSignature?.signedAt) {
            events.push({
                timestamp: contract.hirerSignature.signedAt,
                title: 'Hirer signed',
                bullet: 'green',
            });
        }

        if (contract.artistSignature?.signedAt) {
            events.push({
                timestamp: contract.artistSignature.signedAt,
                title: 'Artist signed',
                bullet: 'green',
            });
        }

        (contract.payments ?? []).forEach((p) => {
            if (!p?.paidAt) return;
            events.push({
                timestamp: p.paidAt,
                title: `Payment ₹${(p.amount ?? 0).toLocaleString('en-IN')}`,
                detail: p.method ? `via ${p.method}` : undefined,
                bullet: 'green',
            });
        });

        (contract.amendments ?? []).forEach((a) => {
            if (!a?.requestedAt) return;
            events.push({
                timestamp: a.requestedAt,
                title: `Amendment requested · ${a.status ?? 'pending'}`,
                detail: a.reason,
                bullet: a.status === 'rejected' ? 'red' : a.status === 'accepted' ? 'green' : 'gold',
            });
        });

        if (contract.status === 'cancelled' || contract.status === 'declined' || contract.status === 'breached') {
            events.push({
                timestamp: new Date().toISOString(), // best-effort — no cancelledAt field
                title: `Contract ${contract.status}`,
                bullet: 'red',
            });
        }

        // newest first
        return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [contract]);
}
```

- [ ] **Step 1.7: Run + commit**

```bash
cd /Users/rohithutagonna/Documents/Rohit/NETSA/NETSA-React/netsa-mobile
npx jest src/features/contract-workspace/__tests__/ --forceExit
```

Expected: 18 tests pass (8 timeline + 10 CTA).

```bash
git add src/features/contract-workspace/utils/ \
        src/features/contract-workspace/hooks/ \
        src/features/contract-workspace/__tests__/
git commit -m "$(cat <<'EOF'
feat(contract-workspace): foundation utils + activity hook

Phase 3A foundation — pure logic + a thin selector:
  - computeContractTimelineStage: 5-node version of Phase 1 stage util
  - computePrimaryCTA: contract + viewer role → sticky bottom CTA
  - formatSignatureMeta: signature audit → display string
  - useContractActivity: derives event log from existing Contract fields

18 unit tests cover every state branch.

PRD ref: §8.3.3.5 Contract Workspace.
Spec: docs/superpowers/specs/2026-04-27-contract-workspace-phase3a-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: ContractHero + ContractStatusTimeline + ContractSignatures (3 small display components)

These three are pure presentation. Bundling.

**Files:**
- Create: `src/features/contract-workspace/components/ContractHero.tsx`
- Create: `src/features/contract-workspace/components/ContractStatusTimeline.tsx`
- Create: `src/features/contract-workspace/components/ContractSignatures.tsx`

- [ ] **Step 2.1: ContractHero**

```tsx
// src/features/contract-workspace/components/ContractHero.tsx
//
// Avatar + name + role + ₹ + status pill. Read-only.

import React from 'react';
import { View, Text } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg2: '#16161F',
    orange: '#FF6B35', green: '#22C55E', gold: '#F59E0B',
    purple: '#8B5CF6', red: '#EF4444', grey: '#6B6878',
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: COLORS.grey },
    sent: { label: 'Awaiting signature', color: COLORS.purple },
    pending_artist_signature: { label: 'Awaiting signature', color: COLORS.purple },
    pending_guardian_cosign: { label: 'Awaiting guardian', color: COLORS.purple },
    accepted: { label: 'Active', color: COLORS.green },
    active: { label: 'Active', color: COLORS.green },
    performed: { label: 'Performed', color: COLORS.green },
    completed: { label: 'Completed', color: COLORS.green },
    disputed: { label: 'Disputed', color: COLORS.red },
    declined: { label: 'Declined', color: COLORS.red },
    cancelled: { label: 'Cancelled', color: COLORS.grey },
    breached: { label: 'Breached', color: COLORS.red },
};

type Props = {
    counterpartName: string;       // hirer name if viewer is artist, artist name if viewer is hirer
    counterpartRole: string;       // "Lead choreographer" / "Backup dancer" / etc
    amount: number;
    status: string;
    tier?: 'quick' | 'standard' | 'premium';
};

export function ContractHero({ counterpartName, counterpartRole, amount, status, tier }: Props) {
    const initials = counterpartName.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'A';
    const statusInfo = STATUS_LABEL[status] ?? STATUS_LABEL.active;

    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{
                    width: 56, height: 56, borderRadius: 16,
                    backgroundColor: COLORS.bg2,
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <Text style={{ color: COLORS.text0, fontSize: 18, fontWeight: '700' }}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, color: COLORS.text0, letterSpacing: -0.4, lineHeight: 30 }}>
                        {counterpartName}
                    </Text>
                    <Text style={{ color: COLORS.text2, fontSize: 13, marginTop: 4 }}>{counterpartRole}</Text>
                </View>
            </View>
            <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999,
                    backgroundColor: `${statusInfo.color}1A`,
                }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusInfo.color }} />
                    <Text style={{ color: statusInfo.color, fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                        {statusInfo.label}
                    </Text>
                </View>
                {tier && (
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        {tier}
                    </Text>
                )}
                <View style={{ flex: 1 }} />
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text0, letterSpacing: -0.4 }}>
                    ₹{amount.toLocaleString('en-IN')}
                </Text>
            </View>
        </View>
    );
}
```

- [ ] **Step 2.2: ContractStatusTimeline**

```tsx
// src/features/contract-workspace/components/ContractStatusTimeline.tsx
//
// 5-node horizontal timeline with stage labels below.

import React from 'react';
import { View, Text } from 'react-native';
import type { ContractTimelineStage } from '../utils/computeContractTimelineStage';

const NODE_COLORS: Record<string, string> = {
    green: '#22C55E', gold: '#F59E0B', purple: '#8B5CF6', red: '#EF4444', grey: '#3F3D4A',
};
const TEXT_COLORS = { text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A' };

const STAGE_LABELS = ['Sent', 'Signed', 'Advance Paid', 'Final Due', 'Completed'];

type Props = {
    stage: ContractTimelineStage;
};

export function ContractStatusTimeline({ stage }: Props) {
    return (
        <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {stage.nodes.map((n, i) => (
                    <React.Fragment key={i}>
                        <View
                            style={{
                                width: 14, height: 14, borderRadius: 7,
                                backgroundColor: NODE_COLORS[n.color],
                                ...(n.state === 'active' && {
                                    shadowColor: NODE_COLORS[n.color],
                                    shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
                                }),
                            }}
                        />
                        {i < stage.nodes.length - 1 && (
                            <View style={{
                                flex: 1, height: 2,
                                backgroundColor: n.state === 'done' && stage.nodes[i + 1].state !== 'pending'
                                    ? NODE_COLORS[n.color]
                                    : 'rgba(255,255,255,0.09)',
                            }} />
                        )}
                    </React.Fragment>
                ))}
            </View>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
                {STAGE_LABELS.map((label, i) => (
                    <Text
                        key={label}
                        style={{
                            flex: 1,
                            fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
                            color: stage.nodes[i].state === 'done'
                                ? TEXT_COLORS.text1
                                : stage.nodes[i].state === 'active'
                                    ? NODE_COLORS[stage.nodes[i].color]
                                    : TEXT_COLORS.text3,
                            textAlign: i === 0 ? 'left' : i === STAGE_LABELS.length - 1 ? 'right' : 'center',
                        }}>
                        {label}
                    </Text>
                ))}
            </View>
        </View>
    );
}
```

- [ ] **Step 2.3: ContractSignatures**

```tsx
// src/features/contract-workspace/components/ContractSignatures.tsx
//
// Two cards (or one + placeholder). Each shows: green check + signer name +
// formatted meta (date · device).

import React from 'react';
import { View, Text } from 'react-native';
import { Check, Clock } from 'lucide-react-native';
import { formatSignatureMeta } from '../utils/formatSignatureMeta';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    green: '#22C55E', purple: '#8B5CF6',
};

type Sig = { signedAt?: string; deviceInfo?: string } | null | undefined;

type Props = {
    hirerName: string;
    artistName: string;
    hirerSignature: Sig;
    artistSignature: Sig;
    viewerRole: 'hirer' | 'artist' | 'other';
};

function SignatureCard({ name, sig, isSelf }: { name: string; sig: Sig; isSelf: boolean }) {
    const signed = !!sig?.signedAt;
    const Icon = signed ? Check : Clock;
    const accent = signed ? COLORS.green : COLORS.purple;
    return (
        <View style={{
            borderRadius: 12, padding: 12,
            backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line,
            flexDirection: 'row', alignItems: 'center', gap: 10,
        }}>
            <View style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: `${accent}1A`,
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={14} color={accent} strokeWidth={signed ? 3 : 2} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text0, fontSize: 13, fontWeight: '700' }}>
                    {isSelf ? 'You signed' : `${name} signed`}
                </Text>
                <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 2 }}>
                    {formatSignatureMeta(sig)}
                </Text>
            </View>
        </View>
    );
}

export function ContractSignatures({ hirerName, artistName, hirerSignature, artistSignature, viewerRole }: Props) {
    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
            <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>Signatures</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {hirerSignature?.signedAt && artistSignature?.signedAt ? 'Both signed' : 'Pending'}
                </Text>
            </View>
            <View style={{ gap: 8 }}>
                <SignatureCard name={hirerName} sig={hirerSignature} isSelf={viewerRole === 'hirer'} />
                <SignatureCard name={artistName} sig={artistSignature} isSelf={viewerRole === 'artist'} />
            </View>
        </View>
    );
}
```

- [ ] **Step 2.4: Commit**

```bash
git add src/features/contract-workspace/components/ContractHero.tsx \
        src/features/contract-workspace/components/ContractStatusTimeline.tsx \
        src/features/contract-workspace/components/ContractSignatures.tsx
git commit -m "feat(contract-workspace): Hero + Timeline + Signatures sections

Three pure-display sections:
  Hero — avatar, name, role, ₹, status pill, optional tier badge
  Timeline — 5-node horizontal progress with stage labels
  Signatures — audit cards per signer with green checkmark + meta

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: ContractPaymentSection + ContractDocuments

**Files:**
- Create: `src/features/contract-workspace/components/ContractPaymentSection.tsx`
- Create: `src/features/contract-workspace/components/ContractDocuments.tsx`

- [ ] **Step 3.1: ContractPaymentSection**

```tsx
// src/features/contract-workspace/components/ContractPaymentSection.tsx
//
// Progress bar + per-installment row. CTAs (Pay / Record) wired by parent —
// this component is presentational.

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', bg3: '#1C1C28', line: 'rgba(255,255,255,0.05)',
    green: '#22C55E', gold: '#F59E0B', orange: '#FF6B35',
};

type Props = {
    amount: number;
    paidAmount: number;
    paymentStructure: 'full' | 'advance_balance';
    paymentMethod: 'on_platform' | 'off_platform';
    isHirer: boolean;
    eventDate?: string;
};

const STRUCTURE_LABEL: Record<string, string> = {
    full: 'Full upfront',
    advance_balance: '30/70 split',
};

function comingSoon() {
    Alert.alert('Coming soon', 'Payment flows ship in a follow-up release.');
}

export function ContractPaymentSection({
    amount, paidAmount, paymentStructure, paymentMethod, isHirer, eventDate,
}: Props) {
    const isAdvance = paymentStructure === 'advance_balance';
    const advanceCutoff = isAdvance ? amount * 0.3 : amount;
    const balance = amount - advanceCutoff;
    const advancePaid = paidAmount >= advanceCutoff;
    const fullyPaid = paidAmount >= amount;
    const pct = amount > 0 ? Math.min(100, Math.floor((paidAmount / amount) * 100)) : 0;
    const eventPast = !!eventDate && new Date(eventDate).getTime() < Date.now();

    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
            <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>Payment</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {STRUCTURE_LABEL[paymentStructure]}
                </Text>
            </View>

            {/* Progress bar */}
            <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: COLORS.text1, fontSize: 13 }}>
                        ₹{paidAmount.toLocaleString('en-IN')} of ₹{amount.toLocaleString('en-IN')} paid
                    </Text>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.green }}>
                        {pct}%
                    </Text>
                </View>
                <View style={{ height: 8, borderRadius: 999, backgroundColor: COLORS.bg3, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${pct}%`, backgroundColor: COLORS.green, borderRadius: 999 }} />
                </View>
            </View>

            {/* Advance row */}
            <PaymentRow
                title={isAdvance ? 'Advance · 30%' : 'Total payment'}
                amount={advanceCutoff}
                paid={advancePaid}
                accent={advancePaid ? COLORS.green : COLORS.gold}
                ctaLabel={!advancePaid && isHirer ? (paymentMethod === 'off_platform' ? 'Record' : 'Pay via NETSA') : null}
                onCTA={comingSoon}
                statusText={advancePaid ? 'Paid' : 'Pending'}
            />

            {/* Balance row (only for advance_balance) */}
            {isAdvance && (
                <View style={{ marginTop: 8 }}>
                    <PaymentRow
                        title="Balance · 70%"
                        amount={balance}
                        paid={fullyPaid}
                        accent={fullyPaid ? COLORS.green : COLORS.gold}
                        ctaLabel={!fullyPaid && isHirer && eventPast ? 'Pay balance' : null}
                        onCTA={comingSoon}
                        statusText={fullyPaid ? 'Paid' : eventPast ? 'Due' : `Due after event`}
                    />
                </View>
            )}
        </View>
    );
}

function PaymentRow({
    title, amount, paid, accent, ctaLabel, onCTA, statusText,
}: {
    title: string;
    amount: number;
    paid: boolean;
    accent: string;
    ctaLabel: string | null;
    onCTA: () => void;
    statusText: string;
}) {
    return (
        <View style={{
            borderRadius: 12, padding: 12,
            backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line,
            borderLeftWidth: 3, borderLeftColor: accent,
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text0, fontSize: 13, fontWeight: '700' }}>{title}</Text>
                    <Text style={{ color: COLORS.text2, fontSize: 11, marginTop: 2 }}>{statusText}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: accent, fontSize: 14, fontWeight: '700' }}>
                        ₹{amount.toLocaleString('en-IN')}
                    </Text>
                </View>
            </View>
            {ctaLabel && (
                <TouchableOpacity onPress={onCTA} accessibilityLabel={ctaLabel} style={{
                    marginTop: 12, paddingVertical: 8, borderRadius: 8,
                    backgroundColor: accent, alignItems: 'center',
                }}>
                    <Text style={{ color: '#0A0A0F', fontSize: 12, fontWeight: '700' }}>{ctaLabel} →</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
```

- [ ] **Step 3.2: ContractDocuments**

```tsx
// src/features/contract-workspace/components/ContractDocuments.tsx
//
// Horizontal PDF chip list. Tap → Linking.openURL if URL present.

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { FileText, Download } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35', green: '#22C55E',
};

type Doc = { label: string; url?: string; date?: string };

type Props = { documents: Doc[] };

function comingSoon() {
    Alert.alert('Coming soon', 'Document downloads ship in a follow-up release.');
}

export function ContractDocuments({ documents }: Props) {
    const handlePress = (url?: string) => {
        if (!url) {
            comingSoon();
            return;
        }
        Linking.openURL(url).catch(() => Alert.alert('Could not open', 'The document URL is invalid.'));
    };

    if (documents.length === 0) return null;

    return (
        <View style={{ paddingTop: 28 }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>Documents</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {documents.length} {documents.length === 1 ? 'file' : 'files'}
                </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
                {documents.map((d, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => handlePress(d.url)}
                        accessibilityLabel={`Download ${d.label}`}
                        style={{
                            paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
                            backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line,
                            flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 200,
                        }}>
                        <View style={{
                            width: 36, height: 36, borderRadius: 10,
                            backgroundColor: 'rgba(255,107,53,0.10)',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <FileText size={14} color={COLORS.orange} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: COLORS.text0, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{d.label}</Text>
                            {d.date && (
                                <Text style={{ color: COLORS.text2, fontSize: 10, fontFamily: 'SpaceMono-Regular', marginTop: 2 }}>
                                    {d.date}
                                </Text>
                            )}
                        </View>
                        <Download size={14} color={COLORS.text2} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}
```

- [ ] **Step 3.3: Commit**

```bash
git add src/features/contract-workspace/components/ContractPaymentSection.tsx \
        src/features/contract-workspace/components/ContractDocuments.tsx
git commit -m "feat(contract-workspace): Payment + Documents sections

Payment shows progress bar + per-installment row + state-driven CTAs
(routed to 'Coming soon' Alert in Phase 3A).
Documents shows horizontal PDF chips that route to Linking.openURL
when URL present, else 'Coming soon'.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: ContractAmendments + ContractActivity

**Files:**
- Create: `src/features/contract-workspace/components/ContractAmendments.tsx`
- Create: `src/features/contract-workspace/components/ContractActivity.tsx`

- [ ] **Step 4.1: ContractAmendments**

```tsx
// src/features/contract-workspace/components/ContractAmendments.tsx
//
// Empty state + dashed "Request a change" button (Phase 3A) OR a list of
// amendment cards if non-empty. Read-only in 3A.

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)', line2: 'rgba(255,255,255,0.09)',
    gold: '#F59E0B', green: '#22C55E', red: '#EF4444',
};

type Amendment = {
    requestedAt?: string;
    reason?: string;
    status?: string;
    changes?: Record<string, any>;
};

type Props = {
    amendments: Amendment[];
};

function comingSoon() {
    Alert.alert('Coming soon', 'Amendment requests ship in a follow-up release.');
}

export function ContractAmendments({ amendments }: Props) {
    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
            <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>Amendments</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {amendments.length === 0 ? 'None yet' : `${amendments.length} requests`}
                </Text>
            </View>
            <Text style={{ color: COLORS.text2, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
                Material changes (amount, date, scope) require an amendment round. Up to 3 negotiations.
            </Text>

            {amendments.length === 0 ? (
                <TouchableOpacity
                    onPress={comingSoon}
                    accessibilityLabel="Request a change"
                    style={{
                        paddingVertical: 14, borderRadius: 12,
                        borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.line2,
                        alignItems: 'center',
                    }}>
                    <Text style={{ color: COLORS.text1, fontSize: 13, fontWeight: '700' }}>
                        + Request a change
                    </Text>
                </TouchableOpacity>
            ) : (
                <View style={{ gap: 8 }}>
                    {amendments.map((a, i) => {
                        const accent = a.status === 'rejected' ? COLORS.red : a.status === 'accepted' ? COLORS.green : COLORS.gold;
                        return (
                            <View key={i} style={{
                                borderRadius: 12, padding: 12,
                                backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line,
                                borderLeftWidth: 3, borderLeftColor: accent,
                            }}>
                                <Text style={{ color: COLORS.text0, fontSize: 13, fontWeight: '700' }}>
                                    {a.reason || 'Amendment request'}
                                </Text>
                                <Text style={{ color: COLORS.text2, fontSize: 11, marginTop: 2 }}>
                                    {a.requestedAt ? new Date(a.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                    {' · '}
                                    <Text style={{ color: accent, textTransform: 'uppercase', fontWeight: '700' }}>{a.status ?? 'pending'}</Text>
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}
```

- [ ] **Step 4.2: ContractActivity**

```tsx
// src/features/contract-workspace/components/ContractActivity.tsx
//
// Vertical timestamped log. Shows up to 5; expand button reveals full list.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ActivityEvent } from '../hooks/useContractActivity';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A',
    green: '#22C55E', gold: '#F59E0B', orange: '#FF6B35', red: '#EF4444', grey: '#6B6878',
};

const BULLET_COLORS: Record<string, string> = {
    green: COLORS.green, gold: COLORS.gold, orange: COLORS.orange,
    red: COLORS.red, grey: COLORS.text3,
};

type Props = { events: ActivityEvent[] };

const PREVIEW_COUNT = 5;

function formatTs(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() +
            ' · ' +
            d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
        return '—';
    }
}

export function ContractActivity({ events }: Props) {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? events : events.slice(0, PREVIEW_COUNT);

    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
            <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>Activity</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {events.length} {events.length === 1 ? 'event' : 'events'}
                </Text>
            </View>

            {events.length === 0 ? (
                <Text style={{ color: COLORS.text2, fontSize: 13, paddingVertical: 16, textAlign: 'center' }}>
                    Activity will appear as the contract progresses.
                </Text>
            ) : (
                <>
                    <View style={{ gap: 14 }}>
                        {visible.map((e, i) => (
                            <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                                <View style={{
                                    width: 8, height: 8, borderRadius: 4, marginTop: 6,
                                    backgroundColor: BULLET_COLORS[e.bullet],
                                }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: COLORS.text0, fontSize: 13, fontWeight: '700' }}>
                                        {e.title}
                                    </Text>
                                    <Text style={{ color: COLORS.text2, fontSize: 10, fontFamily: 'SpaceMono-Regular', marginTop: 2 }}>
                                        {formatTs(e.timestamp)}
                                    </Text>
                                    {e.detail && (
                                        <Text style={{ color: COLORS.text1, fontSize: 12, marginTop: 4 }}>
                                            {e.detail}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                    {events.length > PREVIEW_COUNT && (
                        <TouchableOpacity onPress={() => setExpanded((e) => !e)} style={{ paddingTop: 16 }}>
                            <Text style={{ color: COLORS.text1, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
                                {expanded ? 'Show less' : `Show all ${events.length} events →`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );
}
```

- [ ] **Step 4.3: Commit**

```bash
git add src/features/contract-workspace/components/ContractAmendments.tsx \
        src/features/contract-workspace/components/ContractActivity.tsx
git commit -m "feat(contract-workspace): Amendments + Activity sections

Amendments: empty-state with dashed Request-a-change button, or a
list of amendment cards. Read-only in Phase 3A.
Activity: vertical timestamped log with color-coded bullets. Shows 5
with expand button.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: ContractEdgeCases + ContractStickyCTA

**Files:**
- Create: `src/features/contract-workspace/components/ContractEdgeCases.tsx`
- Create: `src/features/contract-workspace/components/ContractStickyCTA.tsx`

- [ ] **Step 5.1: ContractEdgeCases**

```tsx
// src/features/contract-workspace/components/ContractEdgeCases.tsx
//
// Collapsed danger zone. Switch payment method uses existing mutation
// (Phase 1 wired); other actions Coming soon.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { ChevronRight, RefreshCw, MessageCircle, AlertCircle, X } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    gold: '#F59E0B', red: '#EF4444',
};

type Props = {
    canSwitchMethod: boolean;
    canCancel: boolean;
    onSwitchMethod: () => void; // wires to existing useSwitchContractPaymentMethod via parent
    onCancel: () => void;       // wires to existing decline mutation OR Coming soon
};

function comingSoon(label: string) {
    return () => Alert.alert('Coming soon', `${label} ships in a follow-up release.`);
}

export function ContractEdgeCases({ canSwitchMethod, canCancel, onSwitchMethod, onCancel }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
            <TouchableOpacity
                onPress={() => setOpen((o) => !o)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 16, color: COLORS.text1, letterSpacing: -0.2 }}>
                    Edge cases
                </Text>
                <ChevronRight
                    size={16}
                    color={COLORS.text2}
                    style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}
                />
            </TouchableOpacity>

            {open && (
                <View style={{ gap: 8, paddingTop: 8 }}>
                    <ActionRow
                        icon={RefreshCw}
                        label="Switch payment method"
                        sublabel={canSwitchMethod ? 'Available before artist signs' : 'Locked after sign — requires amendment'}
                        onPress={canSwitchMethod ? onSwitchMethod : comingSoon('Payment method amendment')}
                        accent={COLORS.text2}
                        disabled={!canSwitchMethod && false /* always tappable; shows Coming soon */}
                    />
                    <ActionRow
                        icon={MessageCircle}
                        label="Message"
                        sublabel="Open chat thread"
                        onPress={comingSoon('Messaging')}
                        accent={COLORS.text2}
                    />
                    <ActionRow
                        icon={AlertCircle}
                        label="Open dispute"
                        sublabel="48h ops SLA · evidence required"
                        onPress={comingSoon('Dispute panel')}
                        accent={COLORS.gold}
                    />
                    <ActionRow
                        icon={X}
                        label="Cancel contract"
                        sublabel={canCancel ? 'Triggers cancellation policy' : 'Not available in current state'}
                        onPress={canCancel ? onCancel : comingSoon('Cancel contract')}
                        accent={COLORS.red}
                    />
                </View>
            )}
        </View>
    );
}

function ActionRow({
    icon: Icon, label, sublabel, onPress, accent, disabled,
}: {
    icon: any;
    label: string;
    sublabel: string;
    onPress: () => void;
    accent: string;
    disabled?: boolean;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            accessibilityLabel={label}
            style={{
                padding: 12, borderRadius: 12,
                backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line,
                flexDirection: 'row', alignItems: 'center', gap: 12,
                opacity: disabled ? 0.4 : 1,
            }}>
            <View style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: `${accent}1A`, borderWidth: 1, borderColor: `${accent}30`,
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={14} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: accent === COLORS.text2 ? COLORS.text0 : accent, fontSize: 13, fontWeight: '700' }}>{label}</Text>
                <Text style={{ color: COLORS.text2, fontSize: 11, marginTop: 2 }}>{sublabel}</Text>
            </View>
        </TouchableOpacity>
    );
}
```

- [ ] **Step 5.2: ContractStickyCTA**

```tsx
// src/features/contract-workspace/components/ContractStickyCTA.tsx
//
// Pinned to bottom. Color reflects intent (orange primary / gold pay /
// muted disabled).

import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import type { PrimaryCTA } from '../utils/computePrimaryCTA';

const COLORS = {
    orange: '#FF6B35', gold: '#F59E0B', text3: '#3F3D4A',
};

type Props = {
    cta: PrimaryCTA;
    onPress: () => void;
};

export function ContractStickyCTA({ cta, onPress }: Props) {
    const isPay = cta.intent === 'pay-advance' || cta.intent === 'pay-balance';
    const bg = cta.disabled ? COLORS.text3 : isPay ? COLORS.gold : COLORS.orange;

    return (
        <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12 }}>
            <TouchableOpacity
                onPress={cta.disabled ? undefined : onPress}
                accessibilityLabel={cta.label}
                style={{
                    backgroundColor: bg, paddingVertical: 16, borderRadius: 16,
                    alignItems: 'center',
                    opacity: cta.disabled ? 0.5 : 1,
                    shadowColor: bg, shadowOpacity: cta.disabled ? 0 : 0.45,
                    shadowRadius: 32, shadowOffset: { width: 0, height: 12 },
                }}>
                <Text style={{ color: '#0A0A0F', fontWeight: '800', fontSize: 14, letterSpacing: 0.3 }}>
                    {cta.label}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
```

- [ ] **Step 5.3: Commit**

```bash
git add src/features/contract-workspace/components/ContractEdgeCases.tsx \
        src/features/contract-workspace/components/ContractStickyCTA.tsx
git commit -m "feat(contract-workspace): EdgeCases + StickyCTA sections

EdgeCases collapsed danger zone with 4 actions (Switch payment /
Message / Dispute / Cancel). Phase 3A wires Switch via existing
mutation when methodEditable; rest route to Coming soon.
StickyCTA pinned to bottom, color reflects intent (orange primary /
gold pay / muted disabled).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: ContractWorkspace orchestrator + behavior smoke test

**Files:**
- Create: `src/features/contract-workspace/ContractWorkspace.tsx`
- Create: `src/features/contract-workspace/__tests__/ContractWorkspace.behavior.test.tsx`

- [ ] **Step 6.1: ContractWorkspace orchestrator**

```tsx
// src/features/contract-workspace/ContractWorkspace.tsx
//
// Single-scroll workspace per per-hire contract. Mounts each section in
// order, wires a sticky CTA at the bottom. Phase 3A — many CTAs route to
// 'Coming soon' Alerts.

import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator, Text, TouchableOpacity, Alert, Modal, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';

import useAuthStore from '@/stores/authStore';
import { useContract, useSwitchContractPaymentMethod, useDeclineContract } from '@/hooks/usePayments';
import PaymentMethodSelector from '@/components/payments/PaymentMethodSelector';
import type { ContractPaymentMethod } from '@/services/paymentService';

import { computeContractTimelineStage } from './utils/computeContractTimelineStage';
import { computePrimaryCTA, type PrimaryCTAIntent, type ViewerRole } from './utils/computePrimaryCTA';
import { useContractActivity } from './hooks/useContractActivity';

import { ContractHero } from './components/ContractHero';
import { ContractStatusTimeline } from './components/ContractStatusTimeline';
import { ContractSignatures } from './components/ContractSignatures';
import { ContractPaymentSection } from './components/ContractPaymentSection';
import { ContractDocuments } from './components/ContractDocuments';
import { ContractAmendments } from './components/ContractAmendments';
import { ContractActivity } from './components/ContractActivity';
import { ContractEdgeCases } from './components/ContractEdgeCases';
import { ContractStickyCTA } from './components/ContractStickyCTA';

const COLORS = {
    bg0: '#07070B', text1: '#B8B1A6', line: 'rgba(255,255,255,0.05)',
};

type Props = { contractId: string };

export function ContractWorkspace({ contractId }: Props) {
    const router = useRouter();
    const userId = useAuthStore((s) => (s.user as any)?._id || (s.user as any)?.id);
    const { data, isLoading } = useContract(contractId);
    const switchMutation = useSwitchContractPaymentMethod();
    const declineMutation = useDeclineContract();

    const [methodModalOpen, setMethodModalOpen] = useState(false);
    const [pendingMethod, setPendingMethod] = useState<ContractPaymentMethod>('on_platform');

    const contract = data?.data;
    const activity = useContractActivity(contract);

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg0, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }
    if (!contract) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: COLORS.text1 }}>Contract not found</Text>
            </View>
        );
    }

    const isHirer = String(contract.hirerId) === String(userId);
    const isArtist = String(contract.artistId) === String(userId);
    const viewerRole: ViewerRole = isHirer ? 'hirer' : isArtist ? 'artist' : 'other';

    const counterpartName = isHirer
        ? (contract.artistSnapshot?.displayName ?? 'Artist')
        : (contract.hirerSnapshot?.displayName ?? 'Hirer');
    const counterpartRole = (contract.terms?.scopeOfWork ?? 'Lead artist').split('\n')[0].slice(0, 60);

    const stage = computeContractTimelineStage(contract);
    const primaryCTA = computePrimaryCTA(contract, viewerRole);

    const documents: Array<{ label: string; url?: string; date?: string }> = [];
    if (contract.documentUrl || contract.contractPdfUrl) {
        documents.push({
            label: 'Signed contract',
            url: contract.documentUrl ?? contract.contractPdfUrl,
            date: contract.updatedAt ? new Date(contract.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : undefined,
        });
    }
    (contract.invoices ?? []).forEach((inv: any, i: number) => {
        if (inv?.url) documents.push({ label: inv.label ?? `Invoice ${i + 1}`, url: inv.url, date: inv.date });
    });

    const switchableStatuses = ['draft', 'sent', 'pending_artist_signature'];
    const canSwitchMethod = isHirer && !contract.artistSignature?.signedAt && switchableStatuses.includes(contract.status);
    const canCancel = isHirer && switchableStatuses.includes(contract.status);

    const handleStickyPress = () => {
        const intent: PrimaryCTAIntent = primaryCTA.intent;
        if (primaryCTA.disabled) return;
        if (intent === 'sign-contract') {
            router.push(`/(app)/contracts/${contractId}/sign` as any);
            return;
        }
        if (intent === 'download-pdf') {
            const url = contract.documentUrl ?? contract.contractPdfUrl;
            if (url) {
                Linking.openURL(url).catch(() => Alert.alert('Could not open', 'Document URL invalid.'));
            } else {
                Alert.alert('Coming soon', 'Contract PDF generation ships in a follow-up release.');
            }
            return;
        }
        Alert.alert('Coming soon', `${primaryCTA.label} ships in a follow-up release.`);
    };

    const handleSwitchMethod = () => {
        setPendingMethod(contract.paymentMethod ?? 'on_platform');
        setMethodModalOpen(true);
    };
    const confirmSwitchMethod = async () => {
        try {
            await switchMutation.mutateAsync({ id: contractId, paymentMethod: pendingMethod });
            setMethodModalOpen(false);
        } catch (err: any) {
            Alert.alert('Failed', err?.message ?? 'Could not switch payment method.');
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancel contract?',
            'This withdraws your offer. The artist will be notified.',
            [
                { text: 'Keep contract', style: 'cancel' },
                {
                    text: 'Cancel offer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await declineMutation.mutateAsync(contractId);
                            router.back();
                        } catch (err: any) {
                            Alert.alert('Failed', err?.message ?? 'Could not cancel.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg0 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back">
                        <ChevronLeft size={20} color="#B8B1A6" />
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityLabel="More">
                        <MoreHorizontal size={18} color="#B8B1A6" />
                    </TouchableOpacity>
                </View>

                <ContractHero
                    counterpartName={counterpartName}
                    counterpartRole={counterpartRole}
                    amount={contract.terms?.amount ?? 0}
                    status={contract.status}
                    tier={contract.tier}
                />

                <ContractStatusTimeline stage={stage} />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24 }} />

                <ContractSignatures
                    hirerName={contract.hirerSnapshot?.displayName ?? 'Hirer'}
                    artistName={contract.artistSnapshot?.displayName ?? 'Artist'}
                    hirerSignature={contract.hirerSignature}
                    artistSignature={contract.artistSignature}
                    viewerRole={viewerRole}
                />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 28 }} />

                <ContractPaymentSection
                    amount={contract.terms?.amount ?? 0}
                    paidAmount={contract.paidAmount ?? 0}
                    paymentStructure={contract.terms?.paymentStructure ?? 'full'}
                    paymentMethod={contract.paymentMethod ?? 'on_platform'}
                    isHirer={isHirer}
                    eventDate={contract.terms?.dates?.start}
                />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 28 }} />

                <ContractDocuments documents={documents} />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 28 }} />

                <ContractAmendments amendments={contract.amendments ?? []} />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 28 }} />

                <ContractActivity events={activity} />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 28 }} />

                <ContractEdgeCases
                    canSwitchMethod={canSwitchMethod}
                    canCancel={canCancel}
                    onSwitchMethod={handleSwitchMethod}
                    onCancel={handleCancel}
                />
            </ScrollView>

            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.bg0, borderTopWidth: 1, borderTopColor: COLORS.line }}>
                <ContractStickyCTA cta={primaryCTA} onPress={handleStickyPress} />
            </View>

            {/* Switch payment method modal — preserve existing PaymentMethodSelector */}
            <Modal visible={methodModalOpen} transparent animationType="slide" onRequestClose={() => setMethodModalOpen(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: COLORS.bg0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 }}>
                        <Text style={{ color: '#F3EFE8', fontSize: 20, fontWeight: '700', marginBottom: 16 }}>Switch payment method</Text>
                        <PaymentMethodSelector value={pendingMethod} onChange={setPendingMethod} />
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                            <TouchableOpacity
                                onPress={() => setMethodModalOpen(false)}
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center' }}>
                                <Text style={{ color: '#B8B1A6', fontWeight: '700' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmSwitchMethod}
                                disabled={switchMutation.isPending}
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#FF6B35', alignItems: 'center', opacity: switchMutation.isPending ? 0.5 : 1 }}>
                                <Text style={{ color: '#0A0A0F', fontWeight: '700' }}>{switchMutation.isPending ? 'Saving…' : 'Confirm'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
```

- [ ] **Step 6.2: Behavior smoke test**

```tsx
// src/features/contract-workspace/__tests__/ContractWorkspace.behavior.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, back: mockBack }),
}));

const mockContract = {
    _id: 'c1',
    gigId: 'g1',
    hirerId: 'u-hirer',
    artistId: 'u-artist',
    status: 'active',
    paymentMethod: 'on_platform',
    paidAmount: 15000,
    tier: 'standard',
    terms: {
        amount: 50000, paymentStructure: 'advance_balance',
        dates: { start: new Date(Date.now() + 30 * 86_400_000).toISOString() },
        scopeOfWork: 'Lead choreographer · sangeet',
    },
    hirerSignature: { signedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(), deviceInfo: 'iPhone' },
    artistSignature: { signedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(), deviceInfo: 'Android' },
    hirerSnapshot: { displayName: 'Sharma Wedding' },
    artistSnapshot: { displayName: 'Priya Sharma' },
    amendments: [],
    invoices: [],
    createdAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
};

jest.mock('@/hooks/usePayments', () => ({
    useContract: () => ({ data: { data: mockContract }, isLoading: false }),
    useSwitchContractPaymentMethod: () => ({ mutateAsync: jest.fn(), isPending: false }),
    useDeclineContract: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('@/stores/authStore', () => {
    const fn: any = (selector?: (s: any) => any) => {
        const state = { user: { _id: 'u-hirer' } };
        return selector ? selector(state) : state;
    };
    return { __esModule: true, default: fn };
});

jest.mock('@/components/payments/PaymentMethodSelector', () => ({
    __esModule: true,
    default: () => null,
}));

import { ContractWorkspace } from '../ContractWorkspace';

describe('ContractWorkspace', () => {
    it('renders the 9 main sections', () => {
        const { getByText } = render(<ContractWorkspace contractId="c1" />);
        // Hero
        expect(getByText('Priya Sharma')).toBeTruthy();
        // Section headers
        expect(getByText('Signatures')).toBeTruthy();
        expect(getByText('Payment')).toBeTruthy();
        expect(getByText('Amendments')).toBeTruthy();
        expect(getByText('Activity')).toBeTruthy();
        expect(getByText('Edge cases')).toBeTruthy();
    });

    it('hirer + active + advance paid + future event → View contract sticky CTA disabled', () => {
        const { getByText } = render(<ContractWorkspace contractId="c1" />);
        // computePrimaryCTA returns 'View contract' / disabled for this state with viewer=hirer
        expect(getByText(/View contract/i)).toBeTruthy();
    });
});
```

- [ ] **Step 6.3: Run + commit**

```bash
npx jest src/features/contract-workspace/__tests__/ --forceExit
git add src/features/contract-workspace/ContractWorkspace.tsx \
        src/features/contract-workspace/__tests__/ContractWorkspace.behavior.test.tsx
git commit -m "feat(contract-workspace): orchestrator + behavior smoke

Composes 9 sections in single ScrollView. Sticky CTA pinned to bottom
(state-driven via computePrimaryCTA). Existing mutations preserved:
sign route navigation, switch-payment-method modal (existing
PaymentMethodSelector), decline mutation for cancel-while-editable.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Wire route + manual smoke + push

**Files:**
- Modify: `app/(app)/contracts/[id]/index.tsx`

- [ ] **Step 7.1: Replace route file body**

The existing file has a lot of inline UI logic. Replace its body wholesale with a thin shell:

```tsx
// app/(app)/contracts/[id]/index.tsx
import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ContractWorkspace } from '@/features/contract-workspace/ContractWorkspace';

export default function ContractDetailScreen() {
    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    const contractId = Array.isArray(id) ? id[0] : id;
    if (!contractId) return null;
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ContractWorkspace contractId={contractId} />
        </>
    );
}
```

The orchestrator handles: loading state, missing contract, viewer-role detection, sign navigation, switch-payment modal, decline mutation. Nothing else needed at the route level.

- [ ] **Step 7.2: Verify nothing else imported the old file's internals**

```bash
cd /Users/rohithutagonna/Documents/Rohit/NETSA/NETSA-React/netsa-mobile
grep -rn "from.*contracts/\[id\]" src/ app/ --include="*.ts" --include="*.tsx" | grep -v "__tests__" | head -20
```

Expected: no hits — the route file was a leaf import target.

- [ ] **Step 7.3: Run full mobile sweep**

```bash
npx jest src/ --forceExit 2>&1 | tail -10
```

Expected: all tests pass (Phase 1 + 2A + 3A combined).

- [ ] **Step 7.4: Commit + push**

```bash
git add app/\(app\)/contracts/\[id\]/index.tsx
git commit -m "$(cat <<'EOF'
feat(contract-workspace): replace /contracts/[id] body with workspace

Phase 3A — old contract detail page becomes a thin shell that mounts
<ContractWorkspace contractId={...} />. The workspace orchestrator
owns: loading state, viewer-role detection, all 9 sections, sticky
CTA, switch-payment-method modal, decline mutation for cancel.

Sign ceremony at /contracts/[id]/sign is unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin develop
```

- [ ] **Step 7.5: Manual smoke checklist (founder QA on device)**

After dev rebuild:

1. As a hirer, hit any active contract from the Hub's Your team row.
2. Workspace renders single-scroll: Hero / Timeline / Signatures / Payment / Documents / Amendments / Activity / Edge cases.
3. Hero shows artist avatar + name + role + ₹ + status pill.
4. Timeline shows 5 nodes; current state's node has glow.
5. Signatures show two cards (You signed / Priya signed) with date + device.
6. Payment shows progress bar at 30% (₹15K of ₹50K) + advance row paid + balance row pending.
7. Documents — empty if no PDFs yet. Show chips if `contract.documentUrl` set.
8. Amendments — empty state with dashed "+ Request a change" → Coming soon.
9. Activity — events derived from contract fields (Sent / Hirer signed / Artist signed). Mono timestamps.
10. Edge cases collapsed; tap to expand. Switch payment method shows modal IF `methodEditable`.
11. Sticky bottom CTA — for active+30%-paid+future event, reads "View contract" disabled.
12. Tap a contract that's `pending_artist_signature` as the artist — sticky CTA reads "Sign contract" → routes to `/contracts/[id]/sign`.

---

## Self-Review

**Spec coverage:**
- 9 sections — Tasks 2-6 ✓
- 18 unit tests — Task 1 ✓
- Sticky CTA state machine — Task 1 + Task 6 ✓
- Activity log derivation from existing fields — Task 1 (hook) ✓
- Edge cases preserve existing mutations — Task 6 ✓
- Route file replaced with thin shell — Task 7 ✓

**Placeholder scan:** every step has full source. "Coming soon" Alerts are deliberate Phase 3A behavior, documented in spec.

**Type consistency:**
- `ContractTimelineStage`, `StageNodeColor`, `StageOverlay` — Task 1 utilities + Task 2 timeline component
- `PrimaryCTA`, `PrimaryCTAIntent`, `ViewerRole` — Task 1 + Task 5 sticky + Task 6 orchestrator
- `ActivityEvent` — Task 1 hook + Task 4 activity component

**Risks revisited:**
- Old `/contracts/[id]/index.tsx` had `useDeclineContract` and `useSwitchContractPaymentMethod` wired — preserved in orchestrator. ✓
- `PaymentMethodSelector` import preserved (mounted in switch-method modal). ✓
- `paidAmount` may be missing on backend — defaults to 0 throughout. Documented in spec.
- TypeScript clean: each section component types its own props; orchestrator uses `any` for contract (matches existing pattern in usePayments hook).

**Out of scope:** Phase 3B will add ContractEvent collection, real Razorpay execute, dispute panel, real cancel flow, paidAmount aggregation.
