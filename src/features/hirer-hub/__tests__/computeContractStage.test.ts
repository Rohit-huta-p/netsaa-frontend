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
