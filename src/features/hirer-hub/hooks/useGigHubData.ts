// src/features/hirer-hub/hooks/useGigHubData.ts
//
// Selector hook that combines gig + applications + contracts into the shape
// the hub renders. Phase 1 filters contracts client-side by gigId because
// useUserContracts doesn't support a gigId server filter yet — at MVP scale
// (typically < 50 contracts per user) the client filter is fine.

import { useMemo } from 'react';
import { useGig } from '@/hooks/useGigs';
import { useGigApplications } from '@/hooks/useGigApplications';
import { useUserContracts } from '@/hooks/usePayments';
import { computeTeamRowAction } from '../utils/computeTeamRowAction';

export type HubKPIs = {
    appliedCount: number;
    newCount: number;
    hiredCount: number;
    slotsTotal: number;
    budgetAmount: number;
    daysLeft: number | null;
    paidAmount: number;
    dueAmount: number;
};

export type TeamRowData = {
    application: any;
    contract: any | null;
};

export function useGigHubData(gigId: string) {
    const gigQuery = useGig(gigId);
    const appsQuery = useGigApplications(gigId);
    const contractsQuery = useUserContracts();

    const gig = gigQuery.data;
    const applications: any[] = appsQuery.data ?? [];
    const allContracts: any[] = contractsQuery.data?.data?.contracts ?? [];

    // Filter contracts to this gig client-side (Phase 1).
    const contracts = useMemo(
        () => allContracts.filter((c: any) => String(c.gigId) === String(gigId)),
        [allContracts, gigId]
    );

    const teamRows: TeamRowData[] = useMemo(() => {
        return applications
            .filter((a) => a.status === 'hired')
            .map((a) => ({
                application: a,
                contract: contracts.find((c: any) => String(c.artistId) === String(a.artistId)) ?? null,
            }));
    }, [applications, contracts]);

    const pendingApplicants = useMemo(() => {
        return applications.filter((a) => a.status !== 'hired' && a.status !== 'rejected');
    }, [applications]);

    const kpis: HubKPIs = useMemo(() => {
        const appliedCount = applications.length;
        const newCount = applications.filter((a) => a.status === 'applied').length;
        const hiredCount = applications.filter((a) => a.status === 'hired').length;
        const g = gig as any;
        // `slotsTotal` = how many artists this gig is hiring. Prefer the gig's stated
        // count (maxApplications — the same value shown as "slots" on the artist
        // side); fall back to the number already hired (or 1) so the "x / y" never
        // shows a misleading zero total.
        const headcount = g?.maxApplications;
        const slotsTotal = typeof headcount === 'number' && headcount > 0 ? headcount : (hiredCount || 1);
        // Budget = the gig's stated compensation (a number, not a transaction) so it
        // is safe to show under PAYMENTS-DISABLED. Days left = countdown to the event.
        const budgetAmount = g?.compensation?.amount ?? g?.compensation?.minAmount ?? 0;
        const startIso = g?.schedule?.startDate ?? g?.startDate;
        let daysLeft: number | null = null;
        if (startIso) {
            const ms = new Date(startIso).getTime();
            if (Number.isFinite(ms)) daysLeft = Math.max(0, Math.ceil((ms - Date.now()) / 86_400_000));
        }
        const paidAmount = contracts.reduce((s: number, c: any) => s + (c.paidAmount ?? 0), 0);
        const totalAmount = contracts.reduce((s: number, c: any) => s + (c.terms?.amount ?? 0), 0);
        const dueAmount = Math.max(0, totalAmount - paidAmount);
        return { appliedCount, newCount, hiredCount, slotsTotal, budgetAmount, daysLeft, paidAmount, dueAmount };
    }, [applications, contracts, gig]);

    const urgentTeamRowCount = useMemo(() => {
        return teamRows.filter((r) => {
            if (!r.contract) return false;
            const action = computeTeamRowAction(r.contract);
            return !action.disabled && action.intent !== 'view';
        }).length;
    }, [teamRows]);

    const firstUrgentLabel = useMemo(() => {
        for (const row of teamRows) {
            if (!row.contract) continue;
            const action = computeTeamRowAction(row.contract);
            if (!action.disabled && action.intent !== 'view') {
                return `${action.label} · ${row.application?.artistSnapshot?.displayName ?? 'Artist'}`;
            }
        }
        return undefined;
    }, [teamRows]);

    return {
        gig,
        applications,
        contracts,
        teamRows,
        pendingApplicants,
        pendingApplicantsCount: pendingApplicants.length,
        urgentTeamRowCount,
        firstUrgentLabel,
        kpis,
        isLoading: gigQuery.isLoading || appsQuery.isLoading || contractsQuery.isLoading,
        error: gigQuery.error || appsQuery.error || contractsQuery.error,
    };
}
