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
