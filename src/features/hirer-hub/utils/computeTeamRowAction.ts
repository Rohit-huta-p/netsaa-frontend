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
    /** When the contract was sent. Falls back to `createdAt` (Mongoose timestamp on the Contract model — backend doesn't yet emit a separate sentAt). */
    sentAt?: string;
    /** Mongoose `createdAt` on the Contract document. Used as a fallback for sentAt. */
    createdAt?: string;
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
        const sentRaw = contract.sentAt ?? contract.createdAt;
        const sentMs = sentRaw ? new Date(sentRaw).getTime() : Date.now();
        const ageHours = (Date.now() - sentMs) / HOUR;
        if (ageHours > 48) return { label: 'Cancel offer', intent: 'cancel-offer', disabled: false };
        if (ageHours > 24) return { label: 'Nudge', intent: 'nudge', disabled: false };
        return { label: 'Sent · waiting', intent: 'noop', disabled: true };
    }

    // Unmodeled fall-through: 'draft' | 'accepted' | 'performed' all flow
    // into the active branch below. Phase 1 acceptable because (a) draft
    // contracts shouldn't surface in the hub anyway (gig hub only renders
    // contracts on hired applications, which are at minimum sent) and
    // (b) accepted / performed are transient states that resolve quickly.
    // Phase 2 should add explicit branches.
    // active / signed
    const amount = contract.terms?.amount ?? 0;
    const paid = contract.paidAmount ?? 0;
    const isAdvanceBalance = contract.terms?.paymentStructure === 'advance_balance';
    const advanceCutoff = isAdvanceBalance ? amount * 0.3 : amount;
    const eventPast = !!contract.terms?.dates?.start &&
        new Date(contract.terms.dates.start).getTime() < Date.now();

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
