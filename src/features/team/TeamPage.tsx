// netsa-mobile/src/features/team/TeamPage.tsx
//
// Dedicated team page for a single gig. Hirer-side for now; the same
// component will serve the lead-artist side once sub-gig ships (different
// data shape but the same layout).
//
// Sections:
//   1. Header — back + title + Edit gig
//   2. Roster — full cards per hired artist (vs the compact Hub rows):
//      avatar + name + role + amount + payment status + contact buttons +
//      Record-payment CTA
//   3. Group contact — WhatsApp group invite URL display + edit (hirer)
//   4. Mark gig as performed — placeholder button (full performance flow
//      lands when reviews + post-gig completion ship)
//
// `mode` prop reserved for the lead-artist view post sub-gig launch:
//   - 'hirer'        → current behavior (hirer manages hired artists)
//   - 'lead-artist'  → lead artist manages their sub-artists
// Both share the layout. Data source + permissions diverge.

import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Pencil } from 'lucide-react-native';

import { useGig } from '@/hooks/useGigs';
import { useGigApplications } from '@/hooks/useGigApplications';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

import { ContactActionSheet, type ContactTarget } from './ContactActionSheet';
import { TeamRosterCard } from './components/TeamRosterCard';
import { TeamGroupContactCard } from './components/TeamGroupContactCard';
import { RecordPaymentModal } from '@/features/payments/RecordPaymentModal';

const COLORS = {
    bg: '#07070B',
    text0: '#F3EFE8',
    text2: '#6B6878',
    line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35',
    orangeBg: 'rgba(255,107,53,0.10)',
};

export type TeamPageMode = 'hirer' | 'lead-artist';

export interface TeamPageProps {
    gigId: string;
    /** Reserved — only 'hirer' is used today. 'lead-artist' lands with sub-gig. */
    mode?: TeamPageMode;
}

export function TeamPage({ gigId, mode = 'hirer' }: TeamPageProps) {
    const router = useRouter();
    const tabBarHeight = useMobileTabBarHeight();
    const gigQuery = useGig(gigId);
    const appsQuery = useGigApplications(gigId);

    const [contactTarget, setContactTarget] = useState<ContactTarget | null>(null);
    const [recordPaymentTarget, setRecordPaymentTarget] = useState<any | null>(null);

    if (gigQuery.isLoading || appsQuery.isLoading) {
        return (
            <View style={[styles.root, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.orange} />
            </View>
        );
    }

    const gig = gigQuery.data;
    if (!gig) {
        return (
            <View style={[styles.root, styles.center]}>
                <Text style={{ color: COLORS.text2 }}>Couldn't load gig.</Text>
            </View>
        );
    }

    const applications: any[] = appsQuery.data ?? [];
    const hiredApplications = applications.filter((a) => a.status === 'hired');

    const handleMarkPerformed = () => {
        try {
            Alert.alert(
                'Mark as performed — coming soon',
                'Full post-gig completion (review prompts + payout finalization) lands in a follow-up ship. For now, transactions stay in confirmed/completed state via the per-artist payment flow.'
            );
        } catch {
            /* noop in test */
        }
    };

    return (
        <View style={styles.root}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 32 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        accessibilityLabel="Back"
                        style={styles.headerBtn}
                    >
                        <ChevronLeft size={20} color={COLORS.text0} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                    {mode === 'hirer' && (
                        <TouchableOpacity
                            onPress={() => router.push(`/(app)/create?gigId=${gigId}` as any)}
                            accessibilityLabel="edit-gig-from-team"
                            style={styles.editPill}
                        >
                            <Pencil size={12} color={COLORS.orange} />
                            <Text style={styles.editPillText}>Edit gig</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Hero */}
                <View style={styles.heroBlock}>
                    <Text style={styles.eyebrow}>Team</Text>
                    <Text style={styles.title} numberOfLines={2}>
                        {gig.title || 'Team'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {hiredApplications.length} {hiredApplications.length === 1 ? 'artist' : 'artists'} hired
                    </Text>
                </View>

                <View style={styles.divider} />

                {/* Roster */}
                <View style={{ paddingTop: 24, paddingBottom: 8 }}>
                    <Text style={styles.sectionLabel}>Roster</Text>
                </View>
                {hiredApplications.length === 0 ? (
                    <View style={styles.emptyRoster}>
                        <Text style={styles.emptyRosterText}>
                            No artists hired yet. Hire from the gig hub to add people here.
                        </Text>
                    </View>
                ) : (
                    hiredApplications.map((app) => (
                        <TeamRosterCard
                            key={app._id}
                            application={app}
                            gig={gig}
                            onContact={(application) =>
                                setContactTarget({
                                    artistId: application?.artistId ?? '',
                                    displayName:
                                        application?.artistSnapshot?.displayName ?? 'Artist',
                                    phoneNumber: application?.artistSnapshot?.phoneNumber,
                                    gigTitle: gig?.title,
                                })
                            }
                            onRecordPayment={(application) => setRecordPaymentTarget(application)}
                            onOpenProfile={(artistId) => {
                                if (!artistId) return;
                                try {
                                    router.push(`/(app)/profile/${artistId}` as any);
                                } catch {
                                    /* noop */
                                }
                            }}
                        />
                    ))
                )}

                <View style={styles.divider} />

                {/* Group contact card */}
                <View style={{ paddingTop: 24, paddingBottom: 8 }}>
                    <Text style={styles.sectionLabel}>Group contact</Text>
                </View>
                <TeamGroupContactCard gig={gig} />

                <View style={styles.divider} />

                {/* Mark performed */}
                <View style={{ paddingTop: 24, paddingHorizontal: 24, paddingBottom: 24 }}>
                    <TouchableOpacity
                        onPress={handleMarkPerformed}
                        accessibilityLabel="mark-gig-as-performed"
                        style={styles.markPerformedBtn}
                    >
                        <Text style={styles.markPerformedText}>Mark gig as performed</Text>
                    </TouchableOpacity>
                    <Text style={styles.markPerformedHint}>
                        Wraps the gig + prompts both sides for reviews. Coming with the post-gig sprint.
                    </Text>
                </View>
            </ScrollView>

            <ContactActionSheet
                visible={!!contactTarget}
                onClose={() => setContactTarget(null)}
                target={contactTarget}
            />
            <RecordPaymentModal
                visible={!!recordPaymentTarget}
                onClose={() => setRecordPaymentTarget(null)}
                applicationId={recordPaymentTarget?._id ?? ''}
                artistId={recordPaymentTarget?.artistId ?? ''}
                gigId={gig._id}
                defaultAmount={gig.compensation?.amount ?? 0}
                artistName={recordPaymentTarget?.artistSnapshot?.displayName}
                onRecorded={() => setRecordPaymentTarget(null)}
            />
        </View>
    );
}

export default TeamPage;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg },
    center: { alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    editPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: COLORS.orangeBg,
        borderWidth: 1,
        borderColor: 'rgba(255,107,53,0.35)',
    },
    editPillText: { color: COLORS.orange, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    heroBlock: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 18 },
    eyebrow: {
        color: COLORS.orange,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    title: {
        color: COLORS.text0,
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 28,
        letterSpacing: -0.5,
        lineHeight: 32,
    },
    subtitle: { color: COLORS.text2, fontSize: 13, marginTop: 6 },
    divider: { height: 1, backgroundColor: COLORS.line, marginHorizontal: 24 },
    sectionLabel: {
        color: COLORS.text2,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        paddingHorizontal: 24,
    },
    emptyRoster: { paddingHorizontal: 24, paddingVertical: 24, alignItems: 'center' },
    emptyRosterText: { color: COLORS.text2, fontSize: 13, textAlign: 'center', lineHeight: 20 },
    markPerformedBtn: {
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    markPerformedText: {
        color: COLORS.text0,
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    markPerformedHint: {
        color: COLORS.text2,
        fontSize: 11,
        marginTop: 10,
        textAlign: 'center',
        lineHeight: 16,
    },
});
