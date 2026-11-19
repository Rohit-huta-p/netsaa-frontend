// src/features/hirer-hub/components/GigApplicantActionModals.tsx
//
// Renders the four applicant-action surfaces bound to a useGigApplicantActions
// controller: the swipeable profile modal + the Hire / Contact / Remove-hire
// sheets. Mounted by both HirerGigHub and the "See all" screen so the two share
// identical behavior (close-then-confirm Hire/Remove avoids nested-Modal flake
// on iOS; Pass/Shortlist mutate and the modal auto-advances).

import React from 'react';
import { ApplicantProfileModal } from './ApplicantProfileModal';
import { HireConfirmModal } from '@/components/gigs/applications/HireConfirmModal';
import { ContactActionSheet } from '@/features/team/ContactActionSheet';
import { RemoveHireSheet } from './RemoveHireSheet';
import type { GigApplicantActions } from '../hooks/useGigApplicantActions';

type Props = {
    actions: GigApplicantActions;
    gig: any;
    data: any;
};

export function GigApplicantActionModals({ actions, gig, data }: Props) {
    return (
        <>
            {actions.profileModal ? (
                <ApplicantProfileModal
                    applications={actions.profileModal.applications}
                    initialIndex={actions.profileModal.index}
                    venueCity={gig?.location?.city}
                    onClose={actions.closeProfileModal}
                    onPass={actions.handleQuickReject}
                    onShortlist={actions.handleQuickShortlist}
                    // Hire / Remove / Message close the modal first, then open
                    // their own confirm sheet (avoids nested-Modal flake on iOS).
                    onHire={(id) => { actions.closeProfileModal(); actions.handleQuickHire(id); }}
                    onMessage={(id) => { actions.closeProfileModal(); actions.handleMessageApplicant(id); }}
                    onRemove={(id) => { actions.closeProfileModal(); actions.handleRemoveHire(id); }}
                    onOpenFullProfile={actions.openFullProfile}
                />
            ) : null}
            <HireConfirmModal
                visible={!!actions.hireTarget}
                gig={gig}
                application={actions.hireTarget ?? { _id: '', artistId: '', artistSnapshot: undefined }}
                onClose={() => actions.setHireTarget(null)}
                onHired={() => actions.setHireTarget(null)}
            />
            <ContactActionSheet
                visible={!!actions.contactTarget}
                onClose={() => actions.setContactTarget(null)}
                target={actions.contactTarget}
            />
            <RemoveHireSheet
                visible={!!actions.removeTarget}
                application={actions.removeTarget}
                hiredCount={data?.kpis?.hiredCount}
                slotsTotal={data?.kpis?.slotsTotal}
                onClose={() => actions.setRemoveTarget(null)}
                onConfirm={actions.confirmRemoveHire}
            />
        </>
    );
}

export default GigApplicantActionModals;
