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
