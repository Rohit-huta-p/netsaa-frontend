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
 * The profile page for every creative_lead / organizer target (artist to apply,
 * client to size up).
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
import { ChevronLeft, MoreHorizontal, Check, Play, Settings, Eye, Plus, Pencil, ChevronRight } from 'lucide-react-native';

import { useUser } from '@/hooks/useUser';
import { useOrganizer } from '@/hooks/useOrganizer';
import { useEventsByOrganizer } from '@/hooks/useEventsByOrganizer';
import { useOrganizerGigsPublic } from '@/hooks/useOrganizerGigsPublic';
import { useOrganizerGigs } from '@/hooks/useGigs';
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
    // Owner-only, me-scoped gig list (status + applicant counts + drafts). Disabled
    // for non-owners — the endpoint resolves gigs from req.user, so it must never run
    // for a visitor viewing someone else's page.
    const { data: ownerGigsRaw } = useOrganizerGigs(isOwner ? userId : '');

    const [following, setFollowing] = useState(false);
    const [previewAsVisitor, setPreviewAsVisitor] = useState(false);
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);

    // `owner` gates the owner layer; false while previewing the page as a visitor.
    const owner = isOwner && !previewAsVisitor;

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

    // ── Owner-only derived data ──
    const ownerGigs: any[] = owner ? ((ownerGigsRaw as any[]) ?? []) : [];
    const applicantsToReview = ownerGigs.reduce((a, g) => a + (g.applicants ?? 0), 0);
    // Page completeness — filled showcase fields over the set a company page needs.
    const completeChecks = [
        !!logo || !!d.coverImageUrl,
        !!d.bio,
        services.length > 0,
        photos.length > 0,
        !!website,
        d.teamSize != null,
    ];
    const completePct = Math.round((completeChecks.filter(Boolean).length / completeChecks.length) * 100);

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
    const onSettings = () => router.push('/(app)/settings' as any);
    const onPostGig = () => router.push('/(app)/create' as any);
    const onCreateEvent = () => router.push('/(app)/create?initialTab=event' as any);
    const onManageGigs = () => router.push('/(app)/dashboard/cl-work?tab=hiring' as any);

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
                        {owner ? (
                            <Pressable onPress={onSettings} style={s.circle} hitSlop={10}>
                                <Settings size={17} color={C.t1} />
                            </Pressable>
                        ) : (
                            <Pressable onPress={() => router.back()} style={s.circle} hitSlop={10}>
                                <ChevronLeft size={18} color={C.t1} />
                            </Pressable>
                        )}
                        {owner ? (
                            <Pressable onPress={() => setPreviewAsVisitor(true)} style={s.viewAs} hitSlop={10}>
                                <Eye size={13} color={C.t1} />
                                <Text style={s.viewAsText}>View as visitor</Text>
                            </Pressable>
                        ) : (
                            <Pressable onPress={onShare} style={s.circle} hitSlop={10}>
                                <MoreHorizontal size={18} color={C.t1} />
                            </Pressable>
                        )}
                    </SafeAreaView>
                    {owner && (
                        <Pressable onPress={onEditProfile} style={s.editCover} hitSlop={6}>
                            <Pencil size={11} color={C.cream} />
                            <Text style={s.editCoverText}>Edit cover</Text>
                        </Pressable>
                    )}
                </View>

                {/* ═══ IDENTITY ═══ */}
                <View style={s.identity}>
                    <View style={s.logoWrap}>
                        <View style={s.logo}>
                            {logo ? (
                                <Image source={{ uri: logo }} style={s.logoImg} />
                            ) : (
                                <Text style={s.logoInitial}>{initial}</Text>
                            )}
                        </View>
                        {owner && (
                            <Pressable onPress={onEditProfile} style={s.logoEdit} hitSlop={6}>
                                <Pencil size={11} color={C.cream} />
                            </Pressable>
                        )}
                    </View>

                    <View style={s.nameRow}>
                        <Text style={s.orgName} numberOfLines={2}>{name}</Text>
                        {verified && (
                            <View style={s.vmark}><Check size={10} color={C.green} strokeWidth={3} /></View>
                        )}
                        {owner && (
                            <Pressable onPress={onEditProfile} hitSlop={8}>
                                <Pencil size={13} color={C.t3} />
                            </Pressable>
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

                    {/* ═══ OWNER INSIGHTS — private "to review" nudge ═══ */}
                    {owner && applicantsToReview > 0 && (
                        <Pressable style={s.pband} onPress={onManageGigs}>
                            <Text style={s.pbLock}>🔒  Private to you</Text>
                            <View style={s.pbRow}>
                                <Text style={s.pbCount}>{applicantsToReview}</Text>
                                <Text style={s.pbLabel}>applicant{applicantsToReview === 1 ? '' : 's'}{'\n'}to review</Text>
                                <ChevronRight size={18} color={C.orange} style={{ marginLeft: 'auto' }} />
                            </View>
                        </Pressable>
                    )}

                    {/* ═══ ACTIONS ═══ */}
                    <View style={s.actions}>
                        {owner ? (
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

                    {/* ═══ PAGE COMPLETENESS NUDGE (owner) ═══ */}
                    {owner && completePct < 100 && (
                        <Pressable style={s.complete} onPress={onEditProfile}>
                            <View style={s.cring}><Text style={s.cringText}>{completePct}%</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.cTitle}>Your page is nearly there.</Text>
                                <Text style={s.cBody}>Fill the rest to show up your best to artists &amp; clients.</Text>
                                <View style={s.cBar}><View style={[s.cFill, { width: `${completePct}%` }]} /></View>
                            </View>
                        </Pressable>
                    )}

                    {/* ═══ WHAT WE DO ═══ */}
                    {(d.bio || services.length > 0 || typeLabel || d.yearsInBusiness != null || d.teamSize != null || website || owner) && (
                        <>
                            <View style={s.shead}>
                                <Text style={s.stitle}>What we do</Text>
                                {owner && (
                                    <Pressable onPress={onEditProfile} hitSlop={8}><Text style={s.seeall}>EDIT</Text></Pressable>
                                )}
                            </View>
                            {!!d.bio && <Text style={s.bio}>{d.bio}</Text>}

                            {(services.length > 0 || owner) && (
                                <View style={s.chips}>
                                    {services.map((svc, i) => (
                                        <View key={`${svc}-${i}`} style={s.chipPill}>
                                            <Text style={s.chipText}>{svc}</Text>
                                        </View>
                                    ))}
                                    {owner && (
                                        <Pressable style={[s.chipPill, s.chipAdd]} onPress={onEditProfile}>
                                            <Text style={[s.chipText, { color: C.orange }]}>+ Add</Text>
                                        </Pressable>
                                    )}
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
                                {owner ? (
                                    <Pressable onPress={onEditProfile} hitSlop={8}>
                                        <Text style={s.seeall}>MANAGE</Text>
                                    </Pressable>
                                ) : photos.length > 3 ? (
                                    <Pressable onPress={() => setViewerIndex(0)} hitSlop={8}>
                                        <Text style={s.seeall}>See all →</Text>
                                    </Pressable>
                                ) : null}
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

                    {/* ═══ YOUR GIGS (owner) / NOW HIRING (public) ═══ */}
                    {owner ? (
                        <>
                            <View style={s.divsec} />
                            <View style={s.shead}>
                                <Text style={s.stitle}>Your gigs</Text>
                                {ownerGigs.length > 0 && (
                                    <Pressable onPress={onManageGigs} hitSlop={8}>
                                        <Text style={s.seeall}>MANAGE ALL {ownerGigs.length} →</Text>
                                    </Pressable>
                                )}
                            </View>
                            <Pressable style={s.postcta} onPress={onPostGig}>
                                <View style={s.postPlus}><Plus size={18} color={C.orange} /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.postTitle}>Post a gig</Text>
                                    <Text style={s.postSub}>HIRE ARTISTS FOR YOUR NEXT SHOW</Text>
                                </View>
                            </Pressable>
                            {ownerGigs.map((g: any) => (
                                <OwnerGigCard key={g._id} g={g} />
                            ))}
                        </>
                    ) : gigs.length > 0 ? (
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
                    ) : null}

                    {/* ═══ EVENTS — "Your events" (owner) / "Events they host" (public) ═══ */}
                    {(owner || events.length > 0) && (
                        <>
                            <View style={s.divsec} />
                            <View style={s.shead}>
                                <Text style={s.stitle}>{owner ? 'Your events' : 'Events they host'}</Text>
                                {events.length > 2 && (
                                    <Text style={s.seeall}>{owner ? `MANAGE ALL ${events.length} →` : `See all ${events.length} →`}</Text>
                                )}
                            </View>
                        </>
                    )}
                </View>

                {(owner || events.length > 0) && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
                    >
                        {owner && (
                            <Pressable style={s.ecardAdd} onPress={onCreateEvent}>
                                <View style={s.postPlus}><Plus size={18} color={C.orange} /></View>
                                <Text style={s.ecardAddText}>Create{'\n'}event</Text>
                            </Pressable>
                        )}
                        {events.map((e: any) => <EventCard key={e._id} e={e} owner={owner} />)}
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

            {isOwner && previewAsVisitor && (
                <Pressable style={s.previewBar} onPress={() => setPreviewAsVisitor(false)}>
                    <Eye size={13} color="#190B05" />
                    <Text style={s.previewBarText}>Previewing as visitor — tap to exit</Text>
                </Pressable>
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

// Owner "Your gigs" card — status chip (Live/Draft/Closed) + pay + facets +
// footer action (applicant count, or "Finish & publish" for a draft).
function gigStatusMeta(status?: string, deadline?: string): { label: string; color: string } {
    switch (status) {
        case 'published': {
            const c = closesLabel(deadline);
            return { label: c && c !== 'Closed' ? `Live · ${c.replace('Closes', 'closes')}` : 'Live', color: C.green };
        }
        case 'draft': return { label: 'Draft · not visible yet', color: C.t3 };
        case 'paused': return { label: 'Paused', color: C.gold };
        case 'closed':
        case 'expired': return { label: 'Closed', color: C.t4 };
        default: return { label: status || '', color: C.t3 };
    }
}

function OwnerGigCard({ g }: { g: any }) {
    const pay = payLabel(g.compensation);
    const type = (g.artistTypes?.[0] || g.category || '').toString();
    const loc = g.location?.isRemote ? 'Remote' : (g.location?.city ? `On-site · ${g.location.city}` : '');
    const facets = [type, loc].filter(Boolean);
    const sm = gigStatusMeta(g.status, g.applicationDeadline);
    const isDraft = g.status === 'draft';
    const count = g.applicants ?? 0;
    const go = () => router.push((isDraft ? `/create?gigId=${g._id}` : `/gigs/${g._id}?tab=applicants`) as any);
    return (
        <Pressable style={s.gcard} onPress={go}>
            <View style={s.gstatus}>
                <View style={[s.gstatusDot, { backgroundColor: sm.color }]} />
                <Text style={[s.gstatusText, { color: sm.color }]}>{sm.label}</Text>
            </View>
            <View style={s.gtop}>
                <Text style={s.gtitle} numberOfLines={2}>{g.title || 'Untitled gig'}</Text>
                {!!pay && <Text style={s.gpay}>{pay}</Text>}
            </View>
            {facets.length > 0 && (
                <View style={s.gfacets}>
                    {facets.map((f, i) => (<View key={`${f}-${i}`} style={s.gf}><Text style={s.gfText}>{f}</Text></View>))}
                </View>
            )}
            <View style={s.gfoot}>
                <Text style={s.gapply}>
                    {isDraft ? 'Finish & publish →' : `${count} applicant${count === 1 ? '' : 's'} →`}
                </Text>
            </View>
        </Pressable>
    );
}

function EventCard({ e, owner }: { e: any; owner?: boolean }) {
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
        <Pressable style={s.ecard} onPress={owner ? () => router.push(`/events/${e._id}/manage/overview` as any) : undefined}>
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
                {owner && <Text style={s.emanage}>MANAGE →</Text>}
            </View>
        </Pressable>
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

    // ── Owner layer ──
    // masthead owner controls
    viewAs: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: 'rgba(10,10,12,0.55)', borderWidth: 1, borderColor: C.hair },
    viewAsText: { fontFamily: F.semi, fontSize: 11, color: C.t1 },
    editCover: { position: 'absolute', right: 16, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(10,10,12,0.6)', borderWidth: 1, borderColor: C.hair, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    editCoverText: { fontFamily: F.semi, fontSize: 10.5, color: C.cream },
    logoWrap: { width: 84, position: 'relative' },
    logoEdit: { position: 'absolute', right: -4, bottom: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.canvas },

    // insights band
    pband: { backgroundColor: '#0D0D12', borderWidth: 1, borderColor: C.hair, borderLeftWidth: 2, borderLeftColor: C.orange, borderRadius: 13, padding: 14, marginTop: 16 },
    pbLock: { fontFamily: F.mono, fontSize: 8.5, letterSpacing: 1, color: C.t3, textTransform: 'uppercase', marginBottom: 10 },
    pbRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    pbCount: { fontFamily: F.serif, fontSize: 30, color: C.cream, letterSpacing: -0.5 },
    pbLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 0.6, color: C.t2, textTransform: 'uppercase', lineHeight: 13 },

    // completeness nudge
    complete: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.well, borderWidth: 1, borderColor: C.hair, borderRadius: 13, padding: 14, marginTop: 12 },
    cring: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: C.orange, alignItems: 'center', justifyContent: 'center' },
    cringText: { fontFamily: F.bold, fontSize: 12, color: C.orange },
    cTitle: { fontFamily: F.semi, fontSize: 13.5, color: C.cream },
    cBody: { fontFamily: F.body, fontSize: 11.5, color: C.t3, marginTop: 2 },
    cBar: { height: 3, borderRadius: 99, backgroundColor: C.hair, overflow: 'hidden', marginTop: 9 },
    cFill: { height: '100%', borderRadius: 99, backgroundColor: C.orange },

    // post-a-gig CTA + gig status + add-chip
    postcta: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.well, borderWidth: 1, borderColor: C.hair, borderStyle: 'dashed', borderRadius: 14, padding: 14, marginBottom: 10 },
    postPlus: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.orangeSoft, alignItems: 'center', justifyContent: 'center' },
    postTitle: { fontFamily: F.semi, fontSize: 14.5, color: C.cream },
    postSub: { fontFamily: F.mono, fontSize: 8.5, letterSpacing: 0.8, color: C.t3, textTransform: 'uppercase', marginTop: 2 },
    gstatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 9 },
    gstatusDot: { width: 6, height: 6, borderRadius: 3 },
    gstatusText: { fontFamily: F.mono, fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase' },
    chipAdd: { borderColor: C.orangeB, backgroundColor: C.orangeSoft },

    // create-event tile + manage + preview bar
    ecardAdd: { width: 128, borderRadius: 14, borderWidth: 1, borderColor: C.hair, borderStyle: 'dashed', backgroundColor: C.well, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
    ecardAddText: { fontFamily: F.semi, fontSize: 12, color: C.t1, textAlign: 'center', lineHeight: 15 },
    emanage: { fontFamily: F.mono, fontSize: 9, letterSpacing: 0.8, color: C.orange, marginTop: 8 },
    previewBar: { position: 'absolute', left: 20, right: 20, bottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.orange, borderRadius: 12, paddingVertical: 12 },
    previewBarText: { fontFamily: F.bold, fontSize: 12.5, color: '#190B05', letterSpacing: 0.2 },
});
