// src/features/hirer-hub/components/HubApplicantsSection.tsx
//
// The body list for the owner hub's "Applied · the flood" and "Shortlisted ·
// your picks" stages (applicant-card-D.html). The stage filter + the list
// header ("New applicants · N" / "Your picks · N" + sort) now live in
// HubOverview; this component just renders the card-D rows for the applicants
// it's handed, already filtered and sorted by the stage selection.
//
// Reversible Pass: passing an applicant flips them to `rejected` server-side,
// which drops them out of the hub's pending set. To keep Undo reachable for the
// session, we snapshot the passed card here and keep rendering it (dimmed) until
// the owner leaves — HubApplicantRow shows the "Passed" tag + Undo while dimmed.

import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { HubApplicantRow } from './HubApplicantRow';

const COLORS = { text2: '#6B6878' };

type Props = {
    applicants: any[];
    /** Venue city drives the card's amber "out of town" pin. */
    venueCity?: string;
    /** Empty-state copy for the active stage. */
    emptyLabel?: string;
    onTapApplicant?: (applicationId: string) => void;
    // Pass is reversible: onPass flips applied -> rejected; the card then stays
    // on screen dimmed with Undo (onUndoPass -> applied) for the session.
    onPass?: (applicationId: string) => void;
    onUndoPass?: (applicationId: string) => void;
    onShortlist?: (applicationId: string) => void;
    onHire?: (applicationId: string) => void;
    onMessage?: (applicationId: string) => void;
    /** Share an applicant — Hub opens the native share sheet. */
    onShare?: (applicationId: string) => void;
};

export function HubApplicantsSection({
    applicants, venueCity, emptyLabel = 'No applicants in this stage yet.',
    onTapApplicant, onPass, onUndoPass, onShortlist, onHire, onMessage, onShare,
}: Props) {
    // Applicants the owner just passed, kept here (by id -> snapshot) so the
    // card survives the reject round-trip and keeps offering Undo.
    const [passedById, setPassedById] = useState<Record<string, any>>({});

    const handlePass = (applicationId: string) => {
        const app = applicants.find((a) => a._id === applicationId);
        if (app) setPassedById((prev) => ({ ...prev, [applicationId]: app }));
        onPass?.(applicationId);
    };

    const handleUndo = (applicationId: string) => {
        setPassedById((prev) => {
            const next = { ...prev };
            delete next[applicationId];
            return next;
        });
        onUndoPass?.(applicationId);
    };

    // Active = everything handed in that isn't currently passed. Passed
    // snapshots are appended after so Undo stays reachable even once the server
    // has dropped them from the pending set.
    const activeApplicants = useMemo(
        () => applicants.filter((a) => !passedById[a._id]),
        [applicants, passedById]
    );
    const passedApplicants = useMemo(() => Object.values(passedById), [passedById]);
    const displayed = [...activeApplicants, ...passedApplicants];

    return (
        <View style={{ paddingTop: 14, paddingBottom: 8, paddingHorizontal: 24 }}>
            {displayed.length === 0 ? (
                <Text style={{ color: COLORS.text2, fontSize: 13, textAlign: 'center', paddingVertical: 28 }}>
                    {emptyLabel}
                </Text>
            ) : (
                displayed.map((a) => (
                    <HubApplicantRow
                        key={a._id}
                        application={a}
                        venueCity={venueCity}
                        isPassed={!!passedById[a._id]}
                        onTap={onTapApplicant}
                        onPass={handlePass}
                        onUndoPass={handleUndo}
                        onShortlist={onShortlist}
                        onHire={onHire}
                        onMessage={onMessage}
                        onShare={onShare}
                    />
                ))
            )}
        </View>
    );
}
