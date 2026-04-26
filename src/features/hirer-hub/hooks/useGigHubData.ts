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
    hiredCount: number;
    slotsTotal: number;
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
        const hiredCount = applications.filter((a) => a.status === 'hired').length;
        // `slotsTotal` represents the number of artists this gig will hire. Backend
        // doesn't expose a canonical headcount field today, so fall back to the
        // number already hired (or 1 if nothing is hired yet). When backend adds a
        // real `headcount` field, prefer it here.
        const slotsTotal = hiredCount || 1;
        const paidAmount = contracts.reduce((s: number, c: any) => s + (c.paidAmount ?? 0), 0);
        const totalAmount = contracts.reduce((s: number, c: any) => s + (c.terms?.amount ?? 0), 0);
        const dueAmount = Math.max(0, totalAmount - paidAmount);
        return { appliedCount, hiredCount, slotsTotal, paidAmount, dueAmount };
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
