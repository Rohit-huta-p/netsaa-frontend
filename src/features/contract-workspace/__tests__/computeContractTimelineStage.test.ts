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
