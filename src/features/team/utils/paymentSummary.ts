// netsa-mobile/src/features/team/utils/paymentSummary.ts
//
// Pure helpers for the per-artist + per-gig payment-state computations
// the team page needs. Keeps the math out of components so it can be
// unit-tested + reused on the Hub KPI strip later.
//
// Vocabulary:
//   - confirmed: status ∈ {'confirmed', 'completed'} — money the artist
//                has acknowledged receiving
//   - pending:   status === 'recorded' — hirer recorded but artist hasn't
//                confirmed yet (or disputed)
//   - disputed:  status === 'disputed' — flagged by either party; needs
//                resolution before the row is meaningful again
//   - remaining: max(0, gigAmount - confirmed - pending - disputed)
//                disputed amounts ARE counted against remaining today
//                because the hirer already paid that money out — re-
//                recording would create an over-payment scenario. When
//                dispute resolves into 'fraudulent_record', the row is
//                wiped and remaining adjusts.

export type TransactionShape = {
    status?: string;
    amount?: number;
};

export type PaymentSummary = {
    /** Total of confirmed + completed transactions. */
    confirmed: number;
    /** Total of recorded (pending artist confirmation) transactions. */
    pending: number;
    /** Total of disputed transactions. */
    disputed: number;
    /** Remaining = max(0, total - confirmed - pending - disputed). */
    remaining: number;
    /** Total amount across all live (non-dropped) transactions. */
    accountedFor: number;
    /** True if the gig is fully paid (confirmed >= total). */
    isPaidInFull: boolean;
    /** True if any transaction is in the 'recorded' (pending) state. */
    hasPending: boolean;
    /** True if any transaction is in the 'disputed' state. */
    hasDisputed: boolean;
};

const CONFIRMED_STATUSES = new Set(['confirmed', 'completed']);
const PENDING_STATUSES = new Set(['recorded']);
const DISPUTED_STATUSES = new Set(['disputed']);

export function computePaymentSummary(
    transactions: TransactionShape[] | null | undefined,
    totalAmount: number
): PaymentSummary {
    const list = Array.isArray(transactions) ? transactions : [];
    let confirmed = 0;
    let pending = 0;
    let disputed = 0;
    for (const t of list) {
        const amt = Number(t?.amount) || 0;
        const status = String(t?.status ?? '');
        if (CONFIRMED_STATUSES.has(status)) confirmed += amt;
        else if (PENDING_STATUSES.has(status)) pending += amt;
        else if (DISPUTED_STATUSES.has(status)) disputed += amt;
        // refunded / expired / failed / created are ignored — they no
        // longer represent live commitments against the gig amount.
    }
    const accountedFor = confirmed + pending + disputed;
    const total = Math.max(0, Number(totalAmount) || 0);
    const remaining = Math.max(0, total - accountedFor);
    return {
        confirmed,
        pending,
        disputed,
        remaining,
        accountedFor,
        isPaidInFull: confirmed >= total && total > 0,
        hasPending: pending > 0,
        hasDisputed: disputed > 0,
    };
}

/**
 * Five-state UX matrix for the per-artist Record Payment CTA on the team
 * page. Returns one of:
 *   - 'record'           Show "Record ₹{remaining}" button
 *   - 'pending'          Hide button; show "Awaiting confirmation" pill
 *   - 'paid_in_full'     Hide button; show "Paid in full" badge
 *   - 'disputed'         Hide button; show "Disputed — resolve first" pill
 *   - 'no_amount_set'    Gig has no amount → button hidden (edge: ₹0 gig)
 */
export type RecordPaymentState =
    | 'record'
    | 'pending'
    | 'paid_in_full'
    | 'disputed'
    | 'no_amount_set';

export function deriveRecordPaymentState(
    summary: PaymentSummary,
    totalAmount: number
): RecordPaymentState {
    if (!totalAmount || totalAmount <= 0) return 'no_amount_set';
    if (summary.hasDisputed) return 'disputed';
    if (summary.isPaidInFull) return 'paid_in_full';
    if (summary.hasPending) return 'pending';
    return 'record';
}
