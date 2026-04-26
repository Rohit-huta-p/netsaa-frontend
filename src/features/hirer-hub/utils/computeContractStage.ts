// src/features/hirer-hub/utils/computeContractStage.ts
//
// Pure function: contract → 4-node progress timeline state.
// Stage 1 Sent · Stage 2 Signed · Stage 3 Advance Paid · Stage 4 Final Done.
// Plus an overlay flag for disputed/cancelled contracts.

export type StageNodeState = 'done' | 'active' | 'pending';
export type StageNodeColor = 'green' | 'gold' | 'purple' | 'red' | 'grey';
export type StageOverlay = null | 'disputed' | 'cancelled';

export type ContractStage = {
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

const ALL_GREY: ContractStage['nodes'] = [
    { state: 'pending', color: 'grey' },
    { state: 'pending', color: 'grey' },
    { state: 'pending', color: 'grey' },
    { state: 'pending', color: 'grey' },
];

const ALL_DONE: ContractStage['nodes'] = [
    { state: 'done', color: 'green' },
    { state: 'done', color: 'green' },
    { state: 'done', color: 'green' },
    { state: 'done', color: 'green' },
];

export function computeContractStage(contract: ContractInput): ContractStage {
    const status = contract.status ?? '';

    if (status === 'cancelled' || status === 'breached' || status === 'declined') {
        return { nodes: ALL_GREY, overlay: 'cancelled' };
    }
    if (status === 'completed') {
        return { nodes: ALL_DONE, overlay: null };
    }
    if (status === 'disputed') {
        // Disputed: keep prior progress (best effort), flip overlay
        const base = computeContractStage({ ...contract, status: 'active' });
        return { nodes: base.nodes, overlay: 'disputed' };
    }
    if (status === 'pending_artist_signature' || status === 'pending_guardian_cosign' || status === 'sent') {
        return {
            nodes: [
                { state: 'done', color: 'green' },
                { state: 'active', color: 'purple' },
                { state: 'pending', color: 'grey' },
                { state: 'pending', color: 'grey' },
            ],
            overlay: null,
        };
    }

    // active / signed branches
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
            ],
            overlay: null,
        };
    }
    if (paid < advanceCutoff) {
        // partial advance
        return {
            nodes: [
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'active', color: 'gold' },
                { state: 'pending', color: 'grey' },
            ],
            overlay: null,
        };
    }
    if (paid < amount) {
        // advance paid; balance due — gold on node 4 only when event has passed
        return {
            nodes: [
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                { state: 'done', color: 'green' },
                eventPast ? { state: 'active', color: 'gold' } : { state: 'pending', color: 'grey' },
            ],
            overlay: null,
        };
    }
    // fully paid
    return { nodes: ALL_DONE, overlay: null };
}
