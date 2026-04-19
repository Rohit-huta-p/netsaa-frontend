/**
 * NETSA Home / "Me" tab (PRD v4 §6 Screen Architecture, S-084).
 *
 * Per PRD: one unified home for both contexts. Every user is BOTH artist and
 * hirer — the context is determined by the page you're on, not a toggle. This
 * screen embodies that directly: the "Your practice" row shows Artist +
 * Hirer side-by-side as equal partners, so the two contexts coexist visually.
 *
 * MVP scope (what ships now):
 *   1. Hero greeting with trust tier
 *   2. Next-up card (booking / pending signature / encouraging empty state)
 *   3. Two-context glance (Artist | Hirer)
 *   4. Contracts strip
 *   5. Quick actions
 *   6. Profile completion nudge
 *   7. Phase-2 whisper (ghost tiles — design placeholder, not implemented)
 *
 * Deferred to Phase 2+ per PRD:
 *   • Earnings / spend analytics
 *   • AI-powered feed
 *   • Network feed
 *   • Endorsements highlights
 */

import React, { useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Plus,
    Calendar,
    Briefcase,
    Users as UsersIcon,
    FileText,
    ArrowRight,
    Sparkles,
    TrendingUp,
    BarChart3,
    Radio,
    Mic,
    Compass,
} from 'lucide-react-native';

import useAuthStore from '@/stores/authStore';
import { TopRightIcons } from '@/components/common/TopRightIcons';
import { useOrganizerEvents } from '@/hooks/useEvents';
import { useOrganizerGigs } from '@/hooks/useGigs';
import { useUserContracts } from '@/hooks/usePayments';
import TrustBadge from '@/components/ui/TrustBadge';

/* ────────────────────────────────────────────────────────────────────────── */
/*                                  TOKENS                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const C = {
    bg: '#0A0A0F',
    card: '#0E0C14',
    cardRaised: '#121018',
    border: 'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.10)',
    text: '#F0ECE6',
    textDim: '#8F8B9E',
    textFaint: '#5A5668',
    artist: '#8B5CF6',
    artistGlow: 'rgba(139,92,246,0.18)',
    hirer: '#F97316',
    hirerGlow: 'rgba(249,115,22,0.15)',
    coral: '#EC4899',
    gold: '#F59E0B',
    green: '#34D399',
};

const F = {
    serif: 'DMSerifDisplay_400Regular',
    body: 'Outfit-Regular',
    bodyMed: 'Outfit-Medium',
    bodySemi: 'Outfit-SemiBold',
    bodyBold: 'Outfit-Bold',
};

type TrustTier = 'new' | 'rising' | 'trusted' | 'verified';

/* ────────────────────────────────────────────────────────────────────────── */
/*                            AMBIENT BACKDROP                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function AmbientBackdrop() {
    const { width, height } = useWindowDimensions();
    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {/* Hirer warmth — top right */}
            <LinearGradient
                colors={['rgba(249,115,22,0.22)', 'rgba(249,115,22,0.06)', 'transparent']}
                locations={[0, 0.4, 1]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.3, y: 0.6 }}
                style={{
                    position: 'absolute',
                    top: -height * 0.15,
                    right: -width * 0.3,
                    width: width * 0.9,
                    height: height * 0.55,
                }}
            />
            {/* Artist depth — bottom left */}
            <LinearGradient
                colors={['rgba(139,92,246,0.22)', 'rgba(139,92,246,0.06)', 'transparent']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0.6, y: 0.2 }}
                style={{
                    position: 'absolute',
                    bottom: -height * 0.1,
                    left: -width * 0.3,
                    width: width * 0.9,
                    height: height * 0.5,
                }}
            />
            {/* Center breath — very low */}
            <LinearGradient
                colors={['transparent', 'rgba(236,72,153,0.05)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{
                    position: 'absolute',
                    top: height * 0.25,
                    left: 0,
                    right: 0,
                    height: height * 0.4,
                }}
            />
        </View>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                            SECTION DIVIDER                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function SectionDivider({ glyph = '◆' }: { glyph?: string }) {
    return (
        <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerGlyph}>{glyph}</Text>
            <View style={styles.dividerLine} />
        </View>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <Text style={styles.sectionLabel}>{children}</Text>;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                            HERO GREETING                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function HeroGreeting({
    firstName,
    tier,
    rating,
}: {
    firstName: string;
    tier: TrustTier;
    rating?: number;
}) {
    const today = useMemo(
        () =>
            new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            }),
        []
    );

    return (
        <View style={styles.hero}>
            {/* Devanagari watermark — decorative, not translation */}
            <Text style={styles.devanagariWatermark} selectable={false}>
                नमस्ते
            </Text>

            <Text style={styles.heroEyebrow}>{today}</Text>
            <Text style={styles.heroGreet}>
                Namaste,
                <Text style={styles.heroGreetName}>{'\n' + (firstName || 'friend')}.</Text>
            </Text>

            <View style={styles.heroTierRow}>
                <TrustBadge tier={tier} size="md" />
                {rating ? (
                    <>
                        <View style={styles.heroTierDot} />
                        <Text style={styles.heroTierMeta}>
                            {rating.toFixed(1)} ★ · on NETSA
                        </Text>
                    </>
                ) : (
                    <>
                        <View style={styles.heroTierDot} />
                        <Text style={styles.heroTierMeta}>welcome to NETSA</Text>
                    </>
                )}
            </View>
        </View>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                            NEXT-UP CARD                                     */
/* ────────────────────────────────────────────────────────────────────────── */

type NextUpKind = 'pending_signature' | 'upcoming_booking' | 'empty';

function NextUpCard({
    kind,
    contract,
    onPress,
}: {
    kind: NextUpKind;
    contract?: any;
    onPress: () => void;
}) {
    if (kind === 'empty') {
        return (
            <TouchableOpacity
                activeOpacity={0.92}
                onPress={onPress}
                style={styles.nextUpEmpty}
            >
                <View style={styles.nextUpEmptyOrnament}>
                    <Compass size={22} color={C.hirer} strokeWidth={1.2} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.nextUpEmptyTitle}>Your stage is quiet.</Text>
                    <Text style={styles.nextUpEmptyDesc}>
                        Explore opportunities — or post a gig and start the conversation.
                    </Text>
                </View>
                <ArrowRight size={18} color={C.textDim} />
            </TouchableOpacity>
        );
    }

    const isUrgent = kind === 'pending_signature';
    const accent = isUrgent ? C.gold : C.hirer;
    const date = contract?.terms?.dates?.start
        ? new Date(contract.terms.dates.start)
        : null;

    return (
        <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.nextUp}>
            {/* Accent edge */}
            <View style={[styles.nextUpEdge, { backgroundColor: accent }]} />

            <View style={{ flex: 1, padding: 22 }}>
                <Text style={[styles.nextUpKicker, { color: accent }]}>
                    {isUrgent ? 'ACTION NEEDED · PENDING SIGNATURE' : 'NEXT UP · CONFIRMED'}
                </Text>

                {date ? (
                    <View style={styles.nextUpDateRow}>
                        <Text style={styles.nextUpDateDay}>
                            {date.toLocaleDateString('en-IN', { day: '2-digit' })}
                        </Text>
                        <View style={{ marginLeft: 14 }}>
                            <Text style={styles.nextUpDateMonth}>
                                {date
                                    .toLocaleDateString('en-IN', { month: 'short' })
                                    .toUpperCase()}
                            </Text>
                            <Text style={styles.nextUpDateYear}>
                                {date.getFullYear()}
                            </Text>
                        </View>
                    </View>
                ) : null}

                <Text style={styles.nextUpTitle} numberOfLines={2}>
                    {contract?.terms?.gigTitle || 'Untitled gig'}
                </Text>
                <Text style={styles.nextUpVenue} numberOfLines={1}>
                    {contract?.terms?.location?.venue
                        ? `${contract.terms.location.venue} · `
                        : ''}
                    {contract?.terms?.location?.city || 'Location TBD'}
                </Text>

                <View style={styles.nextUpFooter}>
                    <Text style={styles.nextUpAmount}>
                        ₹{(contract?.terms?.amount || 0).toLocaleString('en-IN')}
                    </Text>
                    <View style={styles.nextUpCta}>
                        <Text style={[styles.nextUpCtaText, { color: accent }]}>
                            {isUrgent ? 'Review & sign' : 'Open contract'}
                        </Text>
                        <ArrowRight size={14} color={accent} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                       TWO-CONTEXT GLANCE (Artist | Hirer)                   */
/* ────────────────────────────────────────────────────────────────────────── */

function ContextCard({
    context,
    stat1,
    stat2,
    ctaLabel,
    onPress,
    Icon,
}: {
    context: 'artist' | 'hirer';
    stat1: { label: string; value: string | number };
    stat2: { label: string; value: string | number };
    ctaLabel: string;
    onPress: () => void;
    Icon: any;
}) {
    const isArtist = context === 'artist';
    const accent = isArtist ? C.artist : C.hirer;
    const glow = isArtist ? C.artistGlow : C.hirerGlow;

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.ctxCard}>
            <LinearGradient
                colors={[glow, 'transparent']}
                locations={[0, 0.7]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.ctxGlow}
            />
            <View style={styles.ctxHeader}>
                <View style={[styles.ctxIconWrap, { backgroundColor: glow }]}>
                    <Icon size={16} color={accent} strokeWidth={1.6} />
                </View>
                <Text style={styles.ctxAsLabel}>
                    <Text style={{ color: C.textFaint, letterSpacing: 2 }}>AS · </Text>
                    <Text style={{ color: accent }}>
                        {isArtist ? 'ARTIST' : 'HIRER'}
                    </Text>
                </Text>
            </View>

            <View style={styles.ctxStatsRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.ctxStatVal}>{stat1.value}</Text>
                    <Text style={styles.ctxStatLabel}>{stat1.label}</Text>
                </View>
                <View style={styles.ctxStatDivider} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.ctxStatVal}>{stat2.value}</Text>
                    <Text style={styles.ctxStatLabel}>{stat2.label}</Text>
                </View>
            </View>

            <View style={styles.ctxCtaRow}>
                <Text style={[styles.ctxCta, { color: accent }]}>{ctaLabel}</Text>
                <ArrowRight size={12} color={accent} />
            </View>
        </TouchableOpacity>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                          CONTRACTS STRIP                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function ContractsStrip({
    counts,
    onPress,
}: {
    counts: { sent: number; accepted: number; active: number; total: number };
    onPress: () => void;
}) {
    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.contractsStrip}>
            <View style={styles.contractsIcon}>
                <FileText size={16} color={C.hirer} strokeWidth={1.6} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.contractsLabel}>Contracts</Text>
                <Text style={styles.contractsTotal}>
                    {counts.total}{' '}
                    <Text style={styles.contractsTotalSmall}>on file</Text>
                </Text>
            </View>
            <View style={styles.contractsStats}>
                <MiniStat label="awaiting" value={counts.sent} color={C.gold} />
                <MiniStat label="accepted" value={counts.accepted} color={C.artist} />
                <MiniStat label="active" value={counts.active} color={C.green} />
            </View>
            <ArrowRight size={14} color={C.textDim} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
    );
}

function MiniStat({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <View style={{ alignItems: 'center', minWidth: 48 }}>
            <Text style={[styles.miniStatVal, { color }]}>{value}</Text>
            <Text style={styles.miniStatLabel}>{label}</Text>
        </View>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                            QUICK ACTIONS                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function QuickActions({
    onPostGig,
    onPostEvent,
    onFindGigs,
    onNetwork,
}: {
    onPostGig: () => void;
    onPostEvent: () => void;
    onFindGigs: () => void;
    onNetwork: () => void;
}) {
    const items = [
        { label: 'Post gig', Icon: Briefcase, onPress: onPostGig, color: C.hirer },
        { label: 'Post event', Icon: Calendar, onPress: onPostEvent, color: C.coral },
        { label: 'Find gigs', Icon: Mic, onPress: onFindGigs, color: C.artist },
        { label: 'Network', Icon: UsersIcon, onPress: onNetwork, color: '#3B82F6' },
    ];
    return (
        <View style={styles.quickWrap}>
            {items.map((it) => (
                <TouchableOpacity
                    key={it.label}
                    activeOpacity={0.85}
                    onPress={it.onPress}
                    style={styles.quickTile}
                >
                    <View
                        style={[
                            styles.quickIconWrap,
                            { backgroundColor: it.color + '18', borderColor: it.color + '35' },
                        ]}
                    >
                        <it.Icon size={16} color={it.color} strokeWidth={1.6} />
                    </View>
                    <Text style={styles.quickLabel}>{it.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                          PHASE-2 WHISPER                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function Phase2Whisper() {
    const tiles = [
        { label: 'Earnings', Icon: TrendingUp },
        { label: 'Insights', Icon: BarChart3 },
        { label: 'Feed', Icon: Radio },
    ];
    return (
        <View>
            <Text style={styles.phase2Kicker}>ARRIVING WITH PHASE 2</Text>
            <View style={styles.phase2Row}>
                {tiles.map((t) => (
                    <View key={t.label} style={styles.phase2Tile}>
                        <t.Icon size={14} color={C.textFaint} strokeWidth={1.3} />
                        <Text style={styles.phase2Label}>{t.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                              MAIN SCREEN                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export default function HomeDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { width } = useWindowDimensions();
    const isWide = width >= 768;

    // ── data ────────────────────────────────────────────────────────────────
    const userId = user?._id || '';
    const {
        data: eventsData,
        refetch: refetchEvents,
    } = useOrganizerEvents(userId);
    const {
        data: gigsData,
        refetch: refetchGigs,
    } = useOrganizerGigs(userId);
    const { data: contractsData, refetch: refetchContracts } = useUserContracts();

    useFocusEffect(
        useCallback(() => {
            if (userId) {
                refetchEvents();
                refetchGigs();
                refetchContracts();
            }
        }, [userId, refetchEvents, refetchGigs, refetchContracts])
    );

    // ── derivations ─────────────────────────────────────────────────────────
    const contracts: any[] = contractsData?.data?.contracts || [];
    const gigs: any[] = (gigsData as any[]) || [];
    const events: any[] = (eventsData as any[]) || [];

    const firstName =
        user?.firstName ||
        (user?.displayName ? user.displayName.split(' ')[0] : '') ||
        'friend';

    // Trust tier — defaults to 'new' for MVP (real score comes from Trust Engine Phase 2)
    const trustTier: TrustTier =
        ((user as any)?.trustTier as TrustTier) || 'new';
    const rating = user?.rating;

    const contractCounts = useMemo(() => {
        const by = (status: string[]) =>
            contracts.filter((c) => status.includes(c.status)).length;
        return {
            sent: by(['sent', 'pending_artist_signature', 'pending_guardian_cosign']),
            accepted: by(['accepted']),
            active: by(['active', 'performed']),
            total: contracts.length,
        };
    }, [contracts]);

    // Pick the "next up" card content: pending signature > upcoming booking > empty
    const nextUp = useMemo((): { kind: NextUpKind; contract?: any } => {
        // Pending artist signature for contracts where I'm the artist
        const pending = contracts.find(
            (c) =>
                c.artistId === userId &&
                ['sent', 'pending_artist_signature'].includes(c.status)
        );
        if (pending) return { kind: 'pending_signature', contract: pending };

        // Upcoming booking — accepted/active contracts with a future date
        const now = Date.now();
        const upcoming = contracts
            .filter(
                (c) =>
                    ['accepted', 'active'].includes(c.status) &&
                    c.terms?.dates?.start &&
                    new Date(c.terms.dates.start).getTime() > now
            )
            .sort(
                (a, b) =>
                    new Date(a.terms.dates.start).getTime() -
                    new Date(b.terms.dates.start).getTime()
            )[0];
        if (upcoming) return { kind: 'upcoming_booking', contract: upcoming };

        return { kind: 'empty' };
    }, [contracts, userId]);

    const handleNextUpPress = () => {
        if (nextUp.kind === 'empty') {
            router.push('/(app)/gigs' as any);
        } else if (nextUp.contract?._id) {
            router.push(`/(app)/contracts/${nextUp.contract._id}` as any);
        }
    };

    // ── render ──────────────────────────────────────────────────────────────
    return (
        <View style={styles.screen}>
            <AmbientBackdrop />
            <TopRightIcons />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: Platform.OS === 'web' ? 100 : 110,
                    paddingBottom: 64,
                    paddingHorizontal: isWide ? 40 : 20,
                    maxWidth: 720,
                    alignSelf: 'center',
                    width: '100%',
                }}
            >
                {/* 1. HERO */}
                <HeroGreeting
                    firstName={firstName}
                    tier={trustTier}
                    rating={rating}
                />

                <View style={{ height: 36 }} />

                {/* 2. NEXT UP */}
                <SectionLabel>
                    {nextUp.kind === 'pending_signature'
                        ? 'NEEDS YOUR ATTENTION'
                        : nextUp.kind === 'upcoming_booking'
                          ? 'NEXT ON YOUR CALENDAR'
                          : 'A GENTLE NUDGE'}
                </SectionLabel>
                <NextUpCard
                    kind={nextUp.kind}
                    contract={nextUp.contract}
                    onPress={handleNextUpPress}
                />

                <SectionDivider glyph="◆" />

                {/* 3. TWO-CONTEXT GLANCE */}
                <SectionLabel>YOUR PRACTICE</SectionLabel>
                <View
                    style={{
                        flexDirection: isWide ? 'row' : 'column',
                        gap: 14,
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <ContextCard
                            context="artist"
                            Icon={Mic}
                            stat1={{
                                label: 'rating',
                                value: rating ? rating.toFixed(1) : '—',
                            }}
                            stat2={{
                                label: 'upcoming',
                                value: contracts.filter(
                                    (c) =>
                                        c.artistId === userId &&
                                        ['accepted', 'active'].includes(c.status)
                                ).length,
                            }}
                            ctaLabel="Find gigs"
                            onPress={() => router.push('/(app)/gigs' as any)}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <ContextCard
                            context="hirer"
                            Icon={Briefcase}
                            stat1={{ label: 'posted', value: gigs.length }}
                            stat2={{
                                label: 'events',
                                value: events.length,
                            }}
                            ctaLabel="Post a gig"
                            onPress={() => router.push('/(app)/create' as any)}
                        />
                    </View>
                </View>

                <SectionDivider glyph="●" />

                {/* 4. CONTRACTS STRIP */}
                <SectionLabel>CONTRACTS</SectionLabel>
                <ContractsStrip
                    counts={contractCounts}
                    onPress={() => router.push('/(app)/contracts' as any)}
                />

                <SectionDivider glyph="◆" />

                {/* 5. QUICK ACTIONS */}
                <SectionLabel>QUICK ACTIONS</SectionLabel>
                <QuickActions
                    onPostGig={() => router.push('/(app)/create' as any)}
                    onPostEvent={() => router.push('/(app)/create' as any)}
                    onFindGigs={() => router.push('/(app)/gigs' as any)}
                    onNetwork={() => router.push('/(app)/network' as any)}
                />

                <View style={{ height: 48 }} />

                {/* 6. PHASE-2 WHISPER */}
                <Phase2Whisper />

                {/* tiny credit / signature mark */}
                <View style={styles.signoff}>
                    <Text style={styles.signoffGlyph}>◇</Text>
                    <Text style={styles.signoffText}>
                        NETSA · for the performing arts of India
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                                 STYLES                                      */
/* ────────────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },

    // ── hero ────────────────────────────────────────────────────────────────
    hero: { position: 'relative', paddingTop: 8 },
    devanagariWatermark: {
        position: 'absolute',
        top: -30,
        left: -12,
        fontFamily: F.serif,
        fontSize: 140,
        lineHeight: 140,
        color: 'rgba(249,115,22,0.06)',
        letterSpacing: -4,
        includeFontPadding: false,
        // iOS/Android will fall back to system font for Devanagari glyphs —
        // that's intentional; the character is the design element.
    },
    heroEyebrow: {
        fontFamily: F.bodyMed,
        fontSize: 11,
        color: C.textFaint,
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    heroGreet: {
        fontFamily: F.serif,
        fontSize: 42,
        lineHeight: 48,
        color: C.text,
        letterSpacing: -1,
    },
    heroGreetName: {
        fontFamily: F.serif,
        fontSize: 54,
        lineHeight: 60,
        color: C.text,
        letterSpacing: -2,
    },
    heroTierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 18,
    },
    heroTierDot: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: C.textFaint,
    },
    heroTierMeta: {
        fontFamily: F.body,
        fontSize: 12,
        color: C.textDim,
        letterSpacing: 0.5,
    },

    // ── section primitives ──────────────────────────────────────────────────
    sectionLabel: {
        fontFamily: F.bodyBold,
        fontSize: 10,
        letterSpacing: 3,
        color: C.textDim,
        marginBottom: 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginVertical: 36,
    },
    dividerLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: C.borderStrong,
    },
    dividerGlyph: {
        fontFamily: F.body,
        fontSize: 10,
        color: C.textFaint,
    },

    // ── next-up card ────────────────────────────────────────────────────────
    nextUp: {
        flexDirection: 'row',
        backgroundColor: C.card,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
    },
    nextUpEdge: { width: 3, alignSelf: 'stretch' },
    nextUpKicker: {
        fontFamily: F.bodyBold,
        fontSize: 9,
        letterSpacing: 2.5,
    },
    nextUpDateRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 10,
        marginBottom: 14,
    },
    nextUpDateDay: {
        fontFamily: F.serif,
        fontSize: 58,
        lineHeight: 58,
        color: C.text,
        letterSpacing: -2,
        includeFontPadding: false,
    },
    nextUpDateMonth: {
        fontFamily: F.bodyBold,
        fontSize: 11,
        letterSpacing: 3,
        color: C.text,
    },
    nextUpDateYear: {
        fontFamily: F.body,
        fontSize: 11,
        color: C.textDim,
        marginTop: 2,
    },
    nextUpTitle: {
        fontFamily: F.serif,
        fontSize: 22,
        lineHeight: 28,
        color: C.text,
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    nextUpVenue: {
        fontFamily: F.body,
        fontSize: 13,
        color: C.textDim,
    },
    nextUpFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 18,
    },
    nextUpAmount: {
        fontFamily: F.serif,
        fontSize: 22,
        color: C.text,
        letterSpacing: -0.5,
    },
    nextUpCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    nextUpCtaText: {
        fontFamily: F.bodySemi,
        fontSize: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    nextUpEmpty: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 20,
        backgroundColor: C.card,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: C.border,
    },
    nextUpEmptyOrnament: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.hirerGlow,
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.25)',
    },
    nextUpEmptyTitle: {
        fontFamily: F.serif,
        fontSize: 18,
        color: C.text,
        letterSpacing: -0.3,
        marginBottom: 2,
    },
    nextUpEmptyDesc: {
        fontFamily: F.body,
        fontSize: 12,
        color: C.textDim,
        lineHeight: 18,
    },

    // ── two-context cards ───────────────────────────────────────────────────
    ctxCard: {
        position: 'relative',
        backgroundColor: C.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: C.border,
        padding: 18,
        overflow: 'hidden',
    },
    ctxGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
    },
    ctxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    ctxIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctxAsLabel: {
        fontFamily: F.bodyBold,
        fontSize: 10,
        letterSpacing: 2,
    },
    ctxStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    ctxStatDivider: {
        width: StyleSheet.hairlineWidth,
        alignSelf: 'stretch',
        backgroundColor: C.borderStrong,
        marginHorizontal: 8,
    },
    ctxStatVal: {
        fontFamily: F.serif,
        fontSize: 30,
        color: C.text,
        letterSpacing: -1,
        marginBottom: 2,
    },
    ctxStatLabel: {
        fontFamily: F.bodyMed,
        fontSize: 10,
        color: C.textFaint,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    ctxCtaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ctxCta: {
        fontFamily: F.bodySemi,
        fontSize: 12,
        letterSpacing: 0.5,
    },

    // ── contracts strip ─────────────────────────────────────────────────────
    contractsStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        backgroundColor: C.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.border,
    },
    contractsIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.hirerGlow,
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.22)',
    },
    contractsLabel: {
        fontFamily: F.bodyMed,
        fontSize: 10,
        letterSpacing: 2,
        color: C.textDim,
        textTransform: 'uppercase',
    },
    contractsTotal: {
        fontFamily: F.serif,
        fontSize: 22,
        color: C.text,
        letterSpacing: -0.5,
    },
    contractsTotalSmall: {
        fontFamily: F.body,
        fontSize: 11,
        color: C.textFaint,
        letterSpacing: 0.5,
    },
    contractsStats: {
        flexDirection: 'row',
        gap: 4,
    },
    miniStatVal: {
        fontFamily: F.serif,
        fontSize: 18,
        letterSpacing: -0.5,
    },
    miniStatLabel: {
        fontFamily: F.bodyMed,
        fontSize: 9,
        color: C.textFaint,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: 2,
    },

    // ── quick actions ───────────────────────────────────────────────────────
    quickWrap: {
        flexDirection: 'row',
        gap: 10,
    },
    quickTile: {
        flex: 1,
        alignItems: 'center',
        gap: 10,
        paddingVertical: 20,
        paddingHorizontal: 8,
        backgroundColor: C.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: C.border,
    },
    quickIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    quickLabel: {
        fontFamily: F.bodySemi,
        fontSize: 11,
        color: C.text,
        letterSpacing: 0.3,
    },

    // ── phase 2 whisper ─────────────────────────────────────────────────────
    phase2Kicker: {
        fontFamily: F.bodyBold,
        fontSize: 9,
        letterSpacing: 3,
        color: C.textFaint,
        marginBottom: 12,
    },
    phase2Row: {
        flexDirection: 'row',
        gap: 10,
    },
    phase2Tile: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
        borderStyle: Platform.OS === 'web' ? ('dashed' as any) : 'solid',
        backgroundColor: 'rgba(255,255,255,0.015)',
    },
    phase2Label: {
        fontFamily: F.bodyMed,
        fontSize: 12,
        color: C.textFaint,
        letterSpacing: 0.5,
    },

    // ── signoff ─────────────────────────────────────────────────────────────
    signoff: {
        alignItems: 'center',
        gap: 8,
        marginTop: 56,
    },
    signoffGlyph: {
        fontFamily: F.body,
        fontSize: 11,
        color: C.textFaint,
    },
    signoffText: {
        fontFamily: F.body,
        fontSize: 10,
        letterSpacing: 3,
        color: C.textFaint,
        textTransform: 'uppercase',
    },
});
