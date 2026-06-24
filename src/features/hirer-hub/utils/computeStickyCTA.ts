// src/features/hirer-hub/utils/computeStickyCTA.ts
//
// Pure function: hub data summary → sticky bottom CTA decision.
// Priority: applicants needing review > urgent team rows > calm fallback.

export type StickyIntent = 'review-applicants' | 'urgent-team' | 'manage-team';

export type StickyCTA = {
    label: string;
    intent: StickyIntent;
};

type Input = {
    pendingApplicantsCount: number;
    urgentTeamRowCount: number;
    firstUrgentLabel?: string;
};

export function computeStickyCTA({
    pendingApplicantsCount,
    urgentTeamRowCount,
    firstUrgentLabel,
}: Input): StickyCTA {
    if (pendingApplicantsCount > 0) {
        return {
            label: `Review applicants · ${pendingApplicantsCount}`,
            intent: 'review-applicants',
        };
    }
    if (urgentTeamRowCount > 0 && firstUrgentLabel) {
        return { label: firstUrgentLabel, intent: 'urgent-team' };
    }
    return { label: 'Manage team', intent: 'manage-team' };
}
