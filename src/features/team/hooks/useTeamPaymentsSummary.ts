// netsa-mobile/src/features/team/hooks/useTeamPaymentsSummary.ts
//
// Aggregates per-application transactions into a single gig-wide summary
// for the TeamPage KPI strip. Uses useQueries so each application's
// transactions are fetched in parallel (deduped against the per-row
// useApplicationTransactions hooks via shared queryKey).

import { useQueries } from '@tanstack/react-query';
import { transactionService } from '@/services/paymentService';
import { computePaymentSummary, type PaymentSummary } from '../utils/paymentSummary';

function readTransactionsArray(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.transactions)) return raw.transactions;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.data?.transactions)) return raw.data.transactions;
    return [];
}

export interface TeamPaymentsSummary extends PaymentSummary {
    /** Total agreed across all hires = perArtistAmount × hireCount. */
    totalAgreed: number;
    /** Number of artists hired on this gig. */
    hireCount: number;
    /** True while any of the per-application queries is loading. */
    isLoading: boolean;
}

export function useTeamPaymentsSummary(
    applicationIds: string[],
    perArtistAmount: number
): TeamPaymentsSummary {
    const queries = useQueries({
        queries: applicationIds.map((id) => ({
            queryKey: ['transactions', 'application', id],
            queryFn: () => transactionService.listForApplication(id),
            enabled: !!id,
        })),
    });

    const isLoading = queries.some((q) => q.isLoading);
    const totalAgreed = perArtistAmount * applicationIds.length;

    let confirmed = 0;
    let pending = 0;
    let disputed = 0;
    for (const q of queries) {
        const txs = readTransactionsArray(q.data);
        const summary = computePaymentSummary(txs, perArtistAmount);
        confirmed += summary.confirmed;
        pending += summary.pending;
        disputed += summary.disputed;
    }
    const accountedFor = confirmed + pending + disputed;
    const remaining = Math.max(0, totalAgreed - accountedFor);

    return {
        confirmed,
        pending,
        disputed,
        accountedFor,
        remaining,
        totalAgreed,
        hireCount: applicationIds.length,
        isLoading,
        isPaidInFull: confirmed >= totalAgreed && totalAgreed > 0,
        hasPending: pending > 0,
        hasDisputed: disputed > 0,
    };
}
