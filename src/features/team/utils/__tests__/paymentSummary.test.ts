// netsa-mobile/src/features/team/utils/__tests__/paymentSummary.test.ts
import { computePaymentSummary, deriveRecordPaymentState } from '../paymentSummary';

describe('computePaymentSummary', () => {
    it('returns zeros when transactions is null/empty', () => {
        const out = computePaymentSummary(null, 50000);
        expect(out.confirmed).toBe(0);
        expect(out.pending).toBe(0);
        expect(out.disputed).toBe(0);
        expect(out.remaining).toBe(50000);
        expect(out.isPaidInFull).toBe(false);
        expect(out.hasPending).toBe(false);
        expect(out.hasDisputed).toBe(false);
    });

    it('sums confirmed + completed into the same bucket', () => {
        const out = computePaymentSummary(
            [
                { status: 'confirmed', amount: 30000 },
                { status: 'completed', amount: 10000 },
            ],
            50000
        );
        expect(out.confirmed).toBe(40000);
        expect(out.remaining).toBe(10000);
    });

    it('counts recorded as pending', () => {
        const out = computePaymentSummary(
            [{ status: 'recorded', amount: 50000 }],
            50000
        );
        expect(out.pending).toBe(50000);
        expect(out.confirmed).toBe(0);
        expect(out.remaining).toBe(0);
        expect(out.hasPending).toBe(true);
    });

    it('counts disputed against remaining (until resolved)', () => {
        const out = computePaymentSummary(
            [{ status: 'disputed', amount: 50000 }],
            50000
        );
        expect(out.disputed).toBe(50000);
        expect(out.remaining).toBe(0);
        expect(out.hasDisputed).toBe(true);
    });

    it('ignores refunded / expired / failed / created transactions', () => {
        const out = computePaymentSummary(
            [
                { status: 'refunded', amount: 50000 },
                { status: 'expired', amount: 20000 },
                { status: 'failed', amount: 1000 },
                { status: 'created', amount: 99999 },
            ],
            50000
        );
        expect(out.confirmed).toBe(0);
        expect(out.pending).toBe(0);
        expect(out.disputed).toBe(0);
        expect(out.remaining).toBe(50000);
    });

    it('isPaidInFull true when confirmed >= total', () => {
        const out = computePaymentSummary(
            [{ status: 'confirmed', amount: 50000 }],
            50000
        );
        expect(out.isPaidInFull).toBe(true);
    });

    it('isPaidInFull stays false when total is 0 (edge)', () => {
        const out = computePaymentSummary([], 0);
        expect(out.isPaidInFull).toBe(false);
    });

    it('partial confirmed + partial pending sums correctly', () => {
        const out = computePaymentSummary(
            [
                { status: 'confirmed', amount: 15000 },
                { status: 'recorded', amount: 20000 },
            ],
            50000
        );
        expect(out.confirmed).toBe(15000);
        expect(out.pending).toBe(20000);
        expect(out.accountedFor).toBe(35000);
        expect(out.remaining).toBe(15000);
    });

    it('clamps remaining to 0 when overpaid', () => {
        const out = computePaymentSummary(
            [{ status: 'confirmed', amount: 60000 }],
            50000
        );
        expect(out.remaining).toBe(0);
    });
});

describe('deriveRecordPaymentState', () => {
    const blank = computePaymentSummary([], 50000);

    it("'record' for a hire with no transactions yet", () => {
        expect(deriveRecordPaymentState(blank, 50000)).toBe('record');
    });

    it("'pending' when a transaction is recorded but not confirmed", () => {
        const s = computePaymentSummary([{ status: 'recorded', amount: 50000 }], 50000);
        expect(deriveRecordPaymentState(s, 50000)).toBe('pending');
    });

    it("'paid_in_full' when confirmed >= total", () => {
        const s = computePaymentSummary([{ status: 'confirmed', amount: 50000 }], 50000);
        expect(deriveRecordPaymentState(s, 50000)).toBe('paid_in_full');
    });

    it("'disputed' takes priority over pending", () => {
        const s = computePaymentSummary(
            [
                { status: 'recorded', amount: 30000 },
                { status: 'disputed', amount: 20000 },
            ],
            50000
        );
        expect(deriveRecordPaymentState(s, 50000)).toBe('disputed');
    });

    it("'no_amount_set' when gig has zero / null amount", () => {
        expect(deriveRecordPaymentState(blank, 0)).toBe('no_amount_set');
        expect(deriveRecordPaymentState(blank, null as any)).toBe('no_amount_set');
    });
});
