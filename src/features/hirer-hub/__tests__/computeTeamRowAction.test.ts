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
