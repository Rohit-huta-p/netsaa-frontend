import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { HubApplicantRow } from './HubApplicantRow';

const COLORS = {
    text0: '#F3EFE8', text2: '#6B6878', orange: '#FF6B35',
    bg: 'rgba(255,255,255,0.04)', text1: '#B8B1A6',
};

type FilterKey = 'all' | 'new' | 'shortlisted' | 'reviewed';

type Props = {
    applicants: any[];
    // Venue city drives the card's amber "out of town" pin.
    venueCity?: string;
    onTapApplicant?: (applicationId: string) => void;
    // Pass is reversible: onPass flips applied -> rejected; the card then stays
    // on screen dimmed with Undo (onUndoPass -> applied) for the session.
    onPass?: (applicationId: string) => void;
    onUndoPass?: (applicationId: string) => void;
    onShortlist?: (applicationId: string) => void;
    onHire?: (applicationId: string) => void;
    onMessage?: (applicationId: string) => void;
    onSeeAll?: () => void;
};

const FILTER_PREDICATES: Record<FilterKey, (a: any) => boolean> = {
    all: () => true,
    new: (a) => a.status === 'applied',
    shortlisted: (a) => a.status === 'shortlisted',
    reviewed: (a) => a.status === 'reviewed' || a.status === 'viewed',
};

const PREVIEW_COUNT = 3;

export function HubApplicantsSection({
    applicants, venueCity, onTapApplicant, onPass, onUndoPass, onShortlist, onHire, onMessage, onSeeAll,
}: Props) {
    const [filter, setFilter] = useState<FilterKey>('all');
    // Applicants the owner just passed, kept here (by id -> snapshot) so the
    // card survives the reject round-trip and keeps offering Undo. The snapshot
    // retains its ORIGINAL status so it stays in its filter bucket while dimmed.
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

    // Active = everything not currently passed. Counts + the "See all" total
    // follow the active set, so a pass immediately drops the headline numbers.
    const activeApplicants = useMemo(
        () => applicants.filter((a) => !passedById[a._id]),
        [applicants, passedById]
    );

    const counts = useMemo(() => ({
        all: activeApplicants.length,
        new: activeApplicants.filter(FILTER_PREDICATES.new).length,
        shortlisted: activeApplicants.filter(FILTER_PREDICATES.shortlisted).length,
        reviewed: activeApplicants.filter(FILTER_PREDICATES.reviewed).length,
    }), [activeApplicants]);

    const filteredActive = useMemo(
        () => activeApplicants.filter(FILTER_PREDICATES[filter]),
        [activeApplicants, filter]
    );

    // Passed snapshots matching the current filter are always appended (not
    // capped by the preview) so Undo stays reachable in the hub preview.
    const passedForFilter = useMemo(
        () => Object.values(passedById).filter(FILTER_PREDICATES[filter]),
        [passedById, filter]
    );

    const previewActive = filteredActive.slice(0, PREVIEW_COUNT);
    const displayed = [...previewActive, ...passedForFilter];

    return (
        <View style={{ paddingTop: 36, paddingHorizontal: 24 }}>
            <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text0, letterSpacing: -0.4 }}>Applicants</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {counts.all} pending{counts.new > 0 ? <Text style={{ color: COLORS.orange }}>  ·  {counts.new} new</Text> : null}
                </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {(['all', 'new', 'shortlisted', 'reviewed'] as FilterKey[]).map((k) => (
                    <TouchableOpacity
                        key={k}
                        onPress={() => setFilter(k)}
                        style={{
                            paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
                            backgroundColor: filter === k ? COLORS.text0 : COLORS.bg,
                        }}>
                        <Text style={{
                            color: filter === k ? '#0A0A0F' : COLORS.text1,
                            fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase',
                        }}>
                            {k.charAt(0).toUpperCase() + k.slice(1)} · {counts[k]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View>
                {displayed.length === 0 ? (
                    <Text style={{ color: COLORS.text2, fontSize: 13, textAlign: 'center', paddingVertical: 24 }}>
                        No applicants in this filter.
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
                        />
                    ))
                )}
            </View>

            {filteredActive.length > PREVIEW_COUNT && (
                <TouchableOpacity onPress={onSeeAll} style={{ paddingVertical: 12 }}>
                    <Text style={{ textAlign: 'center', fontSize: 12, color: COLORS.text1, fontWeight: '700' }}>
                        See all {filteredActive.length} →
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
