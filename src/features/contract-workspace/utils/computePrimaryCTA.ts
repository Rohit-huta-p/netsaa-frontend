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
