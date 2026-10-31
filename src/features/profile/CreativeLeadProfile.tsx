/**
 * CreativeLeadProfile.tsx
 *
 * The Creative Lead = COMPANY / ORGANIZATION profile page (Wellfound / LinkedIn
 * company inspired). One common page for every viewer (artist deciding whether to
 * apply, client sizing them up). A·Minimal language (#121216), mirrors the locked
 * mockup DOCS/04-design/mockups/creative-lead-profile.html.
 *
 * Section order: Masthead (cover · logo · name · verified + tier · type·city · stat
 * strip [A·Editorial] · Follow + Message) → What we do (bio · specialties · details)
 * → Productions (shared MediaViewer showcase) → [Now hiring — Phase 2] → Events they
 * host (public) → [Reviews — Phase 2] → [Team — Phase 2].
 *
 * Data: GET /users/:id (public DTO; for the OWNER we merge GET /organizers/me which
 * is me-scoped and complete). Events via useEventsByOrganizer (public). There is NO
 * public organizerId gig endpoint yet → "Now hiring" is Phase 2 (hidden here).
 *
 * Cold-start safe: every showcase field may be absent — absent sections render
 * nothing, never crash.
 *
 * Flag-gated: EXPO_PUBLIC_FEATURE_CL_PROFILE (useFeatureFlags().creativeLeadProfile).
 */

import { useMemo, useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    Pressable,
    Share,
    Linking,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, MoreHorizontal, Check, Play } from 'lucide-react-native';

import { useUser } from '@/hooks/useUser';
import { useOrganizer } from '@/hooks/useOrganizer';
import { useEventsByOrganizer } from '@/hooks/useEventsByOrganizer';
import { useOrganizerGigsPublic } from '@/hooks/useOrganizerGigsPublic';
import { orgTypeLabel } from '@/constants/orgTypes';
import MediaViewer, { type MediaViewerItem } from '@/components/profile/MediaViewer';

// ── A·Minimal palette (shared with gig detail / artist home / mockup) ──
const C = {
    canvas: '#121216',
    card: '#1C1C23',
    well: '#212129',
    chip: '#24242E',
    chipB: '#3C3C47',
    hair: 'rgba(255,255,255,0.08)',
    hairSoft: 'rgba(255,255,255,0.06)',
    cream: '#FFFFFF',
    t1: '#D4D4D8',
    t2: '#A1A1AA',
    t3: '#8B8B99',
    t4: '#6B6B78',
    orange: '#FF6B35',
    orangeSoft: 'rgba(255,107,53,0.12)',
    orangeB: 'rgba(255,107,53,0.30)',
    green: '#22C55E',
    gold: '#F59E0B',
    blue: '#3B82F6',
};
const F = {
    serif: 'DMSerifDisplay_400Regular',
    mono: 'SpaceMono-Regular',
    light: 'Outfit-Light',
    body: 'Outfit-Regular',
    semi: 'Outfit-SemiBold',
    bold: 'Outfit-Bold',
};

type Props = {
    userId: string;
    isOwner?: boolean;
    viewerIsClientOrCL?: boolean;
};

// Loose view of the fields this page reads off the public DTO / organizer doc.
type CLData = {
    _id?: string;
    displayName?: string;
    organizationName?: string;
    profileImageUrl?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    organizerTypeCategory?: string;
    city?: string;
    primaryCity?: string;
    bio?: string;
    services?: string[];
    photos?: string[];
    organizationWebsite?: string;
    yearsInBusiness?: number;
    teamSize?: number;
    verified?: boolean;
    trustTier?: 'new' | 'rising' | 'trusted' | 'verified' | string;
    instagramHandle?: string;
    organizerStats?: {
        gigsPosted?: number;
        eventsCreated?: number;
        artistsHired?: number;
        averageRating?: number;
        totalReviews?: number;
        responseRate?: number;
        avgReplyMinutes?: number;
    };
    verification?: { businessVerified?: boolean; verificationLevel?: string };
};

const TIER_COLOR: Record<string, string> = {
    verified: C.gold,
    trusted: C.green,
    rising: C.blue,
    new: C.t3,
};

function replyLabel(stats?: CLData['organizerStats']): string | null {
    if (!stats) return null;
    const m = stats.avgReplyMinutes;
    if (m != null && m > 0) {
        if (m < 60) return `~${Math.round(m)}m`;
        return `~${Math.round(m / 60)}h`;
    }
    if (stats.responseRate != null) return `${Math.round(stats.responseRate)}%`;
    return null;
}

export function CreativeLeadProfile({ userId, isOwner = false, viewerIsClientOrCL }: Props) {
    const { data: fetched } = useUser(userId);
    // Owner gets the complete, me-scoped organizer doc merged over the public DTO.
    const { organizer } = useOrganizer();
    const { data: eventsData } = useEventsByOrganizer(userId);
    const { data: gigsData } = useOrganizerGigsPublic(userId);

    const [following, setFollowing] = useState(false);
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);

    const d: CLData = useMemo(() => {
        const base = (fetched ?? {}) as CLData;
        if (isOwner && organizer) return { ...base, ...(organizer as unknown as CLData) };
        return base;
    }, [fetched, organizer, isOwner]);

    const name = d.organizationName || d.displayName || 'Creative Lead';
    const initial = (name[0] || 'M').toUpperCase();
    const city = d.city || d.primaryCity || '';
    const typeLabel = orgTypeLabel(d.organizerTypeCategory);
    const typeCity = [typeLabel, city].filter(Boolean).join(' · ');
    const verified = d.verified ?? d.verification?.businessVerified ?? false;
    const tier = (d.trustTier || '').toLowerCase();
    const tierColor = TIER_COLOR[tier] || C.t3;

    const logo = d.logoUrl || d.profileImageUrl;
    const services = (d.services ?? []).filter(Boolean);
    const photos = (d.photos ?? []).filter(Boolean);
    const website = (d.organizationWebsite || '').trim();
    const events = eventsData?.events ?? [];
    const gigs = gigsData?.gigs ?? [];
    const gigsTotal = gigsData?.total ?? 0;

    // Stat strip (A·Editorial) — only cells that have data.
    const st = d.organizerStats;
    const stats: { v: string; unit?: string; star?: boolean; l: string }[] = [];
    if (st?.gigsPosted != null) stats.push({ v: String(st.gigsPosted), l: 'Gigs hosted' });
    if (st?.averageRating != null) stats.push({ v: st.averageRating.toFixed(1), star: true, l: 'Rating' });
    if (st?.artistsHired != null) stats.push({ v: String(st.artistsHired), l: 'Hired' });
    const rl = replyLabel(st);
    if (rl) {
        const m = rl.match(/^(~?\d+)(\D*)$/);
        stats.push({ v: m ? m[1] : rl, unit: m ? m[2] : undefined, l: 'Replies' });
    }

    const mediaItems: MediaViewerItem[] = useMemo(
        () => photos.map((url) => ({ url, type: 'image' as const, title: name, location: city || undefined })),
        [photos, name, city],
    );

    const onShare = () => {
        Share.share({
            message: website ? `${name} on NETSA — ${website}` : `${name} on NETSA`,
        }).catch(() => {});
    };
    const onEditProfile = () => router.push('/(app)/client/agency-profile' as any);

    const normalizedWebsite = website
        ? (/^https?:\/\//i.test(website) ? website : `https://${website}`)
        : null;

    return (
        <View style={s.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
                {/* ═══ COVER + TOPBAR ═══ */}
                <View style={s.cover}>
                    {d.coverImageUrl ? (
                        <Image source={{ uri: d.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : (
                        <LinearGradient
                            colors={['#241a16', '#16131b', C.canvas]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                    )}
                    <LinearGradient colors={['transparent', C.canvas]} style={s.coverFade} />
                    <SafeAreaView edges={['top']} style={s.topBar}>
                        <Pressable onPress={() => router.back()} style={s.circle} hitSlop={10}>
                            <ChevronLeft size={18} color={C.t1} />
                        </Pressable>
                        <Pressable onPress={onShare} style={s.circle} hitSlop={10}>
                            <MoreHorizontal size={18} color={C.t1} />
                        </Pressable>
                    </SafeAreaView>
                </View>

                {/* ═══ IDENTITY ═══ */}
                <View style={s.identity}>
                    <View style={s.logo}>
                        {logo ? (
                            <Image source={{ uri: logo }} style={s.logoImg} />
                        ) : (
                            <Text style={s.logoInitial}>{initial}</Text>
                        )}
                    </View>

                    <View style={s.nameRow}>
                        <Text style={s.orgName} numberOfLines={2}>{name}</Text>
                        {verified && (
                            <View style={s.vmark}><Check size={10} color={C.green} strokeWidth={3} /></View>
                        )}
                    </View>

                    {!!typeCity && <Text style={s.typeline}>{typeCity}</Text>}

                    {!!tier && (
                        <View style={[s.tier, { borderColor: tierColor + '44', backgroundColor: tierColor + '1A' }]}>
                            <View style={[s.tierDot, { backgroundColor: tierColor }]} />
                            <Text style={[s.tierText, { color: tierColor }]}>{tier.toUpperCase()}</Text>
                        </View>
                    )}
                </View>

                <View style={s.sect}>
                    {/* ═══ STAT STRIP — A·Editorial (no-box, hairline-framed, centered) ═══ */}
                    {stats.length > 0 && (
                        <View style={s.stats}>
                            {stats.map((x, i) => (
                                <View key={x.l} style={s.statCellWrap}>
                                    {i > 0 && <View style={s.statDivider} />}
                                    <View style={s.statCell}>
                                        <Text style={s.statV}>
                                            {x.v}
                                            {x.star && <Text style={s.statStar}>★</Text>}
                                            {x.unit ? <Text style={s.statUnit}>{x.unit}</Text> : null}
                                        </Text>
                                        <Text style={s.statL}>{x.l}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ═══ ACTIONS ═══ */}
                    <View style={s.actions}>
                        {isOwner ? (
                            <>
                                <Pressable style={[s.btn, s.btnGhostFill]} onPress={onEditProfile}>
                                    <Text style={s.btnGhostFillText}>Edit profile</Text>
                                </Pressable>
                                <Pressable style={[s.btn, s.btnGhost]} onPress={onShare}>
                                    <Text style={s.btnGhostText}>Share</Text>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <Pressable
                                    style={[s.btn, following ? s.btnGhost : s.btnFollow]}
                                    onPress={() => setFollowing((v) => !v)}
                                >
                                    <Text style={following ? s.btnGhostText : s.btnFollowText}>
                                        {following ? 'Following' : '+ Follow'}
                                    </Text>
                                </Pressable>
                                <Pressable style={[s.btn, s.btnGhost]} onPress={() => { /* TODO Phase 2: open message thread */ }}>
                                    <Text style={s.btnGhostText}>Message</Text>
                                </Pressable>
                            </>
                        )}
                    </View>

                    {/* ═══ WHAT WE DO ═══ */}
                    {(d.bio || services.length > 0 || typeLabel || d.yearsInBusiness != null || d.teamSize != null || website) && (
                        <>
                            <View style={s.shead}><Text style={s.stitle}>What we do</Text></View>
                            {!!d.bio && <Text style={s.bio}>{d.bio}</Text>}

                            {services.length > 0 && (
                                <View style={s.chips}>
                                    {services.map((svc, i) => (
                                        <View key={`${svc}-${i}`} style={s.chipPill}>
                                            <Text style={s.chipText}>{svc}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <View style={s.kv}>
                                {!!typeLabel && <KV k="Type" v={typeLabel} />}
                                {d.yearsInBusiness != null && (
                                    <KV k="Since" v={`${d.yearsInBusiness} ${d.yearsInBusiness === 1 ? 'yr' : 'yrs'}`} />
                                )}
                                {d.teamSize != null && <KV k="Team" v={`${d.teamSize} people`} />}
                                {!!normalizedWebsite && (
                                    <KV
                                        k="Website"
                                        v={website.replace(/^https?:\/\//i, '')}
                                        link
                                        onPress={() => Linking.openURL(normalizedWebsite).catch(() => {})}
                                    />
                                )}
                            </View>
                        </>
                    )}

                    {/* ═══ PRODUCTIONS — shared MediaViewer showcase ═══ */}
                    {photos.length > 0 && (
                        <>
                            <View style={s.divsec} />
                            <View style={s.shead}>
                                <Text style={s.stitle}>Productions</Text>
                                {photos.length > 3 && (
                                    <Pressable onPress={() => setViewerIndex(0)} hitSlop={8}>
                                        <Text style={s.seeall}>See all →</Text>
                                    </Pressable>
                                )}
                            </View>

                            <Pressable style={s.mfeature} onPress={() => setViewerIndex(0)}>
                                <Image source={{ uri: photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                                <LinearGradient colors={['transparent', 'rgba(8,6,10,0.78)']} style={s.mfeatureFade} />
                                {photos.length > 1 && (
                                    <View style={s.mplay}><Play size={14} color="#fff" fill="#fff" /></View>
                                )}
                            </Pressable>

                            {photos.length > 1 && (
                                <View style={s.mgrid}>
                                    {photos.slice(1, 4).map((url, i) => {
                                        const idx = i + 1;
                                        const extra = photos.length - 4;
                                        const isLast = i === 2 && extra > 0;
                                        return (
                                            <Pressable key={`${url}-${idx}`} style={s.mtile} onPress={() => setViewerIndex(idx)}>
                                                <Image source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                                                {isLast && (
                                                    <View style={s.mmore}><Text style={s.mmoreText}>+{extra}</Text></View>
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            {st?.artistsHired != null && st.artistsHired > 0 && (
                                <Text style={s.workedTxt}>
                                    {st.artistsHired} artists have worked with {name}
                                </Text>
                            )}
                        </>
                    )}

                    {/* ═══ NOW HIRING — public open roles (GET /organizers/:id/gigs) ═══ */}
                    {gigs.length > 0 && (
                        <>
                            <View style={s.divsec} />
                            <View style={s.shead}>
                                <Text style={s.stitle}>Now hiring</Text>
                                {gigsTotal > gigs.length && (
                                    <Text style={s.seeall}>See all {gigsTotal} →</Text>
                                )}
                            </View>
                            {gigs.map((g: any) => (
                                <RoleCard key={g._id} g={g} />
                            ))}
                        </>
                    )}

                    {/* ═══ EVENTS THEY HOST — public ═══ */}
                    {events.length > 0 && (
                        <>
                            <View style={s.divsec} />
                            <View style={s.shead}>
                                <Text style={s.stitle}>Events they host</Text>
                                {events.length > 2 && (
                                    <Text style={s.seeall}>See all {events.length} →</Text>
                                )}
                            </View>
                        </>
                    )}
                </View>

                {events.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
                    >
                        {events.map((e: any) => <EventCard key={e._id} e={e} />)}
                    </ScrollView>
                )}

                {/* ═══ REVIEWS — Phase 2 · TEAM — Phase 2 ═══ */}

                <View style={s.frule} />
                <Text style={s.fcap}>{name.toUpperCase()}{d.yearsInBusiness != null ? ` · SINCE ${new Date().getFullYear() - d.yearsInBusiness}` : ''}</Text>
            </ScrollView>

            {viewerIndex !== null && mediaItems[viewerIndex] && (
                <MediaViewer
                    items={mediaItems}
                    index={viewerIndex}
                    onClose={() => setViewerIndex(null)}
                    artist={{ id: userId, name, location: city || undefined }}
                    isOwner={isOwner}
                />
            )}
        </View>
    );
}

export default CreativeLeadProfile;

// ── Small building blocks ──
function KV({ k, v, link, onPress }: { k: string; v: string; link?: boolean; onPress?: () => void }) {
    const Body = (
        <>
            <Text style={s.kvK}>{k.toUpperCase()}</Text>
            <Text style={[s.kvV, link && s.kvVLink]} numberOfLines={1}>{v}</Text>
        </>
    );
    return link && onPress ? (
        <Pressable style={s.kvItem} onPress={onPress}>{Body}</Pressable>
    ) : (
        <View style={s.kvItem}>{Body}</View>
    );
}

function fmtDay(iso?: string): { d: string; m: string } {
    if (!iso) return { d: '', m: '' };
    try {
        const dt = new Date(iso);
        if (isNaN(dt.getTime())) return { d: '', m: '' };
        return {
            d: String(dt.getDate()),
            m: dt.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
        };
    } catch {
        return { d: '', m: '' };
    }
}

// Compact "role" card for Now hiring — serif title + ₹pay fact, facet pills,
// footer (schedule date · closes-in). Pay is a plain fact (no take-home math).
function payLabel(c?: any): string {
    if (!c) return '';
    const suffix: Record<string, string> = { hourly: '/hr', 'per-day': '/day', 'per-track': '/track', 'per-shoot': '/shoot' };
    const sfx = suffix[c.model] || '';
    if (typeof c.amount === 'number' && c.amount > 0) return `₹${c.amount.toLocaleString('en-IN')}${sfx}`;
    if (typeof c.minAmount === 'number' && typeof c.maxAmount === 'number') {
        return `₹${c.minAmount.toLocaleString('en-IN')}–${c.maxAmount.toLocaleString('en-IN')}${sfx}`;
    }
    if (c.negotiable) return 'Negotiable';
    return '';
}

function closesLabel(deadline?: string): string {
    if (!deadline) return '';
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    if (isNaN(days)) return '';
    if (days < 0) return 'Closed';
    if (days === 0) return 'Closes today';
    if (days === 1) return 'Closes in 1 day';
    return `Closes in ${days} days`;
}

function RoleCard({ g }: { g: any }) {
    const pay = payLabel(g.compensation);
    const type = (g.artistTypes?.[0] || g.category || '').toString();
    const loc = g.location?.isRemote ? 'Remote' : (g.location?.city ? `On-site · ${g.location.city}` : '');
    const start = fmtDay(g.schedule?.startDate || g.startDate);
    const when = start.d ? `${start.m} ${start.d}` : '';
    const closes = closesLabel(g.applicationDeadline);
    const foot = [when, closes].filter(Boolean).join(' · ');
    const facets = [type, loc].filter(Boolean);

    return (
        <Pressable style={s.gcard} onPress={() => router.push(`/gigs/${g._id}` as any)}>
            <View style={s.gtop}>
                <Text style={s.gtitle} numberOfLines={2}>{g.title || 'Open role'}</Text>
                {!!pay && <Text style={s.gpay}>{pay}</Text>}
            </View>
            {facets.length > 0 && (
                <View style={s.gfacets}>
                    {facets.map((f, i) => (
                        <View key={`${f}-${i}`} style={s.gf}><Text style={s.gfText}>{f}</Text></View>
                    ))}
                </View>
            )}
            <View style={s.gfoot}>
                {!!foot && <Text style={s.gmeta}>{foot}</Text>}
                <Text style={s.gapply}>APPLY →</Text>
            </View>
        </Pressable>
    );
}

function EventCard({ e }: { e: any }) {
    const title = e.title || e.name || 'Event';
    const kind = (e.eventType || e.type || e.category || '').toString().toUpperCase();
    const place = (e.venue?.city || e.city || e.location || '').toString().toUpperCase();
    const when = fmtDay(e.startDate || e.date || e.startsAt);
    const price =
        e.price === 0 || e.isFree ? 'Free'
        : e.price != null ? `₹${e.price}`
        : e.registration?.door != null ? `₹${e.registration.door}`
        : '';
    const cover = e.coverImageUrl || e.coverUrl || (Array.isArray(e.media) ? e.media[0]?.url : undefined);

    return (
        <View style={s.ecard}>
            <View style={s.eposter}>
                {cover ? (
                    <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                    <LinearGradient colors={['#2a1d30', '#17131c']} style={StyleSheet.absoluteFill} />
                )}
                {!!when.d && (
                    <View style={s.edate}>
                        <Text style={s.edateD}>{when.d}</Text>
                        <Text style={s.edateM}>{when.m}</Text>
                    </View>
                )}
                {!!kind && <View style={s.ekind}><Text style={s.ekindText}>{kind}</Text></View>}
            </View>
            <View style={s.ebody}>
                <Text style={s.ett} numberOfLines={1}>{title}</Text>
                {!!place && <Text style={s.emeta}>{place}</Text>}
                {!!price && <Text style={s.eprice}>{price}</Text>}
            </View>
        </View>
    );
}

// ── Styles ──
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.canvas },
    sect: { paddingHorizontal: 20 },

    // cover + topbar
    cover: { height: 132, position: 'relative', overflow: 'hidden' },
    coverFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
    topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
    circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(10,10,12,0.55)', borderWidth: 1, borderColor: C.hair, alignItems: 'center', justifyContent: 'center' },

    // identity
    identity: { paddingHorizontal: 20, marginTop: -42 },
    logo: { width: 84, height: 84, borderRadius: 22, borderWidth: 3, borderColor: C.canvas, backgroundColor: '#2a1a12', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    logoImg: { width: 78, height: 78, borderRadius: 19 },
    logoInitial: { fontFamily: F.serif, fontSize: 34, color: C.orange },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
    orgName: { fontFamily: F.serif, fontSize: 25, color: C.cream, letterSpacing: -0.5, flexShrink: 1 },
    vmark: { width: 17, height: 17, borderRadius: 9, backgroundColor: 'rgba(34,197,94,0.14)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)', alignItems: 'center', justifyContent: 'center' },
    typeline: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.t3, textTransform: 'uppercase', marginTop: 7 },
    tier: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, marginTop: 12 },
    tierDot: { width: 5, height: 5, borderRadius: 3 },
    tierText: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2 },

    // stat strip — editorial
    stats: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.hair, paddingVertical: 11, marginTop: 16 },
    statCellWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    statDivider: { width: 1, height: 26, backgroundColor: C.hairSoft },
    statCell: { flex: 1, alignItems: 'center' },
    statV: { fontFamily: F.serif, fontSize: 20, color: C.cream, letterSpacing: -0.4 },
    statStar: { fontFamily: F.serif, fontSize: 11, color: C.gold },
    statUnit: { fontFamily: F.serif, fontSize: 11, color: C.t3 },
    statL: { fontFamily: F.mono, fontSize: 7, letterSpacing: 0.9, color: C.t3, textTransform: 'uppercase', marginTop: 7 },

    // actions
    actions: { flexDirection: 'row', gap: 9, marginTop: 15 },
    btn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
    btnFollow: { backgroundColor: C.orange },
    btnFollowText: { fontFamily: F.bold, fontSize: 12.5, color: '#190B05', letterSpacing: 0.2 },
    btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.hair },
    btnGhostText: { fontFamily: F.bold, fontSize: 12.5, color: C.t1, letterSpacing: 0.2 },
    btnGhostFill: { backgroundColor: C.chip, borderWidth: 1, borderColor: C.chipB },
    btnGhostFillText: { fontFamily: F.bold, fontSize: 12.5, color: C.cream, letterSpacing: 0.2 },

    // section head
    shead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28, marginBottom: 13 },
    stitle: { fontFamily: F.serif, fontSize: 21, color: C.cream, letterSpacing: -0.4 },
    seeall: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1, color: C.orange },
    divsec: { height: 1, backgroundColor: C.hair, marginTop: 28 },

    // about
    bio: { fontFamily: F.body, fontSize: 13.5, lineHeight: 22, color: C.t1 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
    chipPill: { backgroundColor: C.chip, borderWidth: 1, borderColor: C.chipB, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
    chipText: { fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: 0.3 },
    kv: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
    kvItem: { flexBasis: '50%', paddingVertical: 11, borderTopWidth: 1, borderTopColor: C.hairSoft, gap: 3 },
    kvK: { fontFamily: F.mono, fontSize: 8, letterSpacing: 1.2, color: C.t4, textTransform: 'uppercase' },
    kvV: { fontFamily: F.body, fontSize: 13, color: C.cream },
    kvVLink: { color: C.orange },

    // productions showcase
    mfeature: { height: 158, borderRadius: 13, overflow: 'hidden', backgroundColor: '#17131c', position: 'relative' },
    mfeatureFade: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '45%' },
    mplay: { position: 'absolute', top: '50%', left: '50%', marginLeft: -22, marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(10,10,12,0.5)', borderWidth: 1, borderColor: C.hair, alignItems: 'center', justifyContent: 'center' },
    mgrid: { flexDirection: 'row', gap: 7, marginTop: 7 },
    mtile: { flex: 1, height: 92, borderRadius: 11, overflow: 'hidden', backgroundColor: '#191419' },
    mmore: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,12,0.5)' },
    mmoreText: { fontFamily: F.mono, fontSize: 12, color: C.t1 },
    workedTxt: { fontFamily: F.mono, fontSize: 10, letterSpacing: 0.3, color: C.t2, marginTop: 12 },

    // now hiring — role cards
    gcard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.hair, borderRadius: 15, padding: 14, marginBottom: 9 },
    gtop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
    gtitle: { flex: 1, fontFamily: F.serif, fontSize: 17, letterSpacing: -0.3, color: C.cream, lineHeight: 20 },
    gpay: { fontFamily: F.serif, fontSize: 16, color: C.cream },
    gfacets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    gf: { backgroundColor: C.chip, borderWidth: 1, borderColor: C.chipB, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
    gfText: { fontFamily: F.mono, fontSize: 9, letterSpacing: 0.3, color: C.t2 },
    gfoot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.hairSoft },
    gmeta: { fontFamily: F.mono, fontSize: 9, letterSpacing: 0.3, color: C.t3 },
    gapply: { marginLeft: 'auto', fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: C.orange },

    // events rail
    ecard: { width: 208, borderRadius: 14, borderWidth: 1, borderColor: C.hair, overflow: 'hidden', backgroundColor: C.card },
    eposter: { height: 94, position: 'relative' },
    edate: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(10,10,12,0.6)', borderWidth: 1, borderColor: C.hair, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, alignItems: 'center' },
    edateD: { fontFamily: F.serif, fontSize: 15, color: C.cream, lineHeight: 15 },
    edateM: { fontFamily: F.mono, fontSize: 7, letterSpacing: 1, color: C.t2 },
    ekind: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(139,92,246,0.18)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
    ekindText: { fontFamily: F.mono, fontSize: 7.5, letterSpacing: 1, color: '#8B5CF6' },
    ebody: { padding: 12 },
    ett: { fontFamily: F.serif, fontSize: 15, color: C.cream },
    emeta: { fontFamily: F.mono, fontSize: 8.5, letterSpacing: 0.3, color: C.t2, marginTop: 6 },
    eprice: { fontFamily: F.mono, fontSize: 9, letterSpacing: 0.5, color: C.t1, marginTop: 8 },

    // footer
    frule: { alignSelf: 'center', width: '34%', height: 1, backgroundColor: C.hair, marginTop: 28, marginBottom: 9 },
    fcap: { textAlign: 'center', fontFamily: F.bold, fontSize: 9, letterSpacing: 2, color: C.t4, paddingBottom: 22 },
});
