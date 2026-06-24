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
    onTapApplicant?: (applicationId: string) => void;
    onQuickHire?: (applicationId: string) => void;
    onQuickReject?: (applicationId: string) => void;
    onSeeAll?: () => void;
};

const FILTER_PREDICATES: Record<FilterKey, (a: any) => boolean> = {
    all: () => true,
    new: (a) => a.status === 'applied',
    shortlisted: (a) => a.status === 'shortlisted',
    reviewed: (a) => a.status === 'reviewed' || a.status === 'viewed',
};

const PREVIEW_COUNT = 3;

export function HubApplicantsSection({ applicants, onTapApplicant, onQuickHire, onQuickReject, onSeeAll }: Props) {
    const [filter, setFilter] = useState<FilterKey>('all');

    const counts = useMemo(() => ({
        all: applicants.length,
        new: applicants.filter((a) => a.status === 'applied').length,
        shortlisted: applicants.filter((a) => a.status === 'shortlisted').length,
        reviewed: applicants.filter((a) => a.status === 'reviewed' || a.status === 'viewed').length,
    }), [applicants]);

    const filtered = useMemo(
        () => applicants.filter(FILTER_PREDICATES[filter]),
        [applicants, filter]
    );

    return (
        <View style={{ paddingTop: 36, paddingHorizontal: 24 }}>
            <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text0, letterSpacing: -0.4 }}>Applicants</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {applicants.length} pending{counts.new > 0 ? <Text style={{ color: COLORS.orange }}>  ·  {counts.new} new</Text> : null}
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
                {filtered.length === 0 ? (
                    <Text style={{ color: COLORS.text2, fontSize: 13, textAlign: 'center', paddingVertical: 24 }}>
                        No applicants in this filter.
                    </Text>
                ) : (
                    filtered.slice(0, PREVIEW_COUNT).map((a) => (
                        <HubApplicantRow
                            key={a._id}
                            application={a}
                            onTap={onTapApplicant}
                            onQuickHire={onQuickHire}
                            onQuickReject={onQuickReject}
                        />
                    ))
                )}
            </View>

            {filtered.length > PREVIEW_COUNT && (
                <TouchableOpacity onPress={onSeeAll} style={{ paddingVertical: 12 }}>
                    <Text style={{ textAlign: 'center', fontSize: 12, color: COLORS.text1, fontWeight: '700' }}>
                        See all {filtered.length} →
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
