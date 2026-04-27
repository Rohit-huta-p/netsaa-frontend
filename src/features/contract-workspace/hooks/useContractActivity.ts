// src/features/contract-workspace/hooks/useContractActivity.ts
//
// Derives an Activity log from existing Contract fields. Phase 3A reads the
// signatures, payment history (if present), and amendments off the contract
// document. Phase 3B will replace this with a dedicated ContractEvent feed.

import { useMemo } from 'react';

export type ActivityEvent = {
    timestamp: string; // ISO
    title: string;
    detail?: string;
    bullet: 'green' | 'orange' | 'gold' | 'red' | 'grey';
};

type ContractInput = {
    createdAt?: string;
    sentAt?: string;
    status?: string;
    hirerSignature?: { signedAt?: string; deviceInfo?: string };
    artistSignature?: { signedAt?: string; deviceInfo?: string };
    payments?: Array<{ amount?: number; paidAt?: string; method?: string }>;
    amendments?: Array<{ requestedAt?: string; reason?: string; status?: string }>;
};

export function useContractActivity(contract: ContractInput | null | undefined): ActivityEvent[] {
    return useMemo(() => {
        if (!contract) return [];
        const events: ActivityEvent[] = [];

        const sentAt = contract.sentAt ?? contract.createdAt;
        if (sentAt) {
            events.push({
                timestamp: sentAt,
                title: 'Contract sent',
                bullet: 'orange',
            });
        }

        if (contract.hirerSignature?.signedAt) {
            events.push({
                timestamp: contract.hirerSignature.signedAt,
                title: 'Hirer signed',
                bullet: 'green',
            });
        }

        if (contract.artistSignature?.signedAt) {
            events.push({
                timestamp: contract.artistSignature.signedAt,
                title: 'Artist signed',
                bullet: 'green',
            });
        }

        (contract.payments ?? []).forEach((p) => {
            if (!p?.paidAt) return;
            events.push({
                timestamp: p.paidAt,
                title: `Payment ₹${(p.amount ?? 0).toLocaleString('en-IN')}`,
                detail: p.method ? `via ${p.method}` : undefined,
                bullet: 'green',
            });
        });

        (contract.amendments ?? []).forEach((a) => {
            if (!a?.requestedAt) return;
            events.push({
                timestamp: a.requestedAt,
                title: `Amendment requested · ${a.status ?? 'pending'}`,
                detail: a.reason,
                bullet: a.status === 'rejected' ? 'red' : a.status === 'accepted' ? 'green' : 'gold',
            });
        });

        if (contract.status === 'cancelled' || contract.status === 'declined' || contract.status === 'breached') {
            events.push({
                timestamp: new Date().toISOString(), // best-effort — no cancelledAt field
                title: `Contract ${contract.status}`,
                bullet: 'red',
            });
        }

        // newest first
        return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [contract]);
}
