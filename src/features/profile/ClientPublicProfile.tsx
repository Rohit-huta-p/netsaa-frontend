/**
 * ClientPublicProfile.tsx
 *
 * Tiered, privacy-safe PUBLIC view of a `role:'client'` target.
 * Consumes the BARE, already-tiered DTO returned by `GET /api/users/:id`
 * for a client — it NEVER contains email/phone. We render only what the
 * backend chose to expose. Nothing here reads email/phone/billing.
 *
 * Two render modes off `data.organizerTypeCategory`:
 *   - Lean   (individual/company/venue/corporate/undefined): identity card,
 *            phone-verified tick, "Client · {city}", "Joined {Mon YYYY}",
 *            org name + a Company/Venue badge, a privacy note. No counts/ratings.
 *   - Agency (organizerTypeCategory === 'agency'): rich showcase — logo, Agency
 *            badge + verified, website, bio, services pills, horizontal photo
 *            gallery, years-in-business / team-size rows. When the viewer is a
 *            client/CL, an "Invite to propose" CTA opens the Part B InviteSheet
 *            (context-free path) targeting this supplier.
 *
 * Cold-start safe: every showcase field may be absent — absent fields render
 * nothing, never crash.
 */

import { useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    Pressable,
    Linking,
    Share,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
    ChevronLeft,
    Check,
    MapPin,
    Building2,
    Globe,
    Briefcase,
    Users,
    Sparkles,
    UserPlus,
    Share2,
    Lock,
} from 'lucide-react-native';

import { InviteSheet } from '@/components/talent/InviteSheet';

// ── The bare client DTO from GET /users/:id (client target) ──
// Email/phone are NEVER present — do not add them here.
export type ClientPublicData = {
    _id: string;
    displayName?: string;
    role: 'client';
    profileImageUrl?: string;
    city?: string;
    verified?: boolean;
    joined?: string; // ISO date
    organizationName?: string;
    organizerTypeCategory?: string;
    // Agency-only showcase set
    logoUrl?: string;
    organizationWebsite?: string;
    bio?: string;
    services?: string[];
    photos?: string[];
    yearsInBusiness?: number;
    teamSize?: number;
};

type Props = {
    data: ClientPublicData;
    viewerIsClientOrCL?: boolean;
};

// ── Helpers ──
function fmtJoined(iso?: string): string {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    } catch {
        return '';
    }
}

function initialsOf(name?: string): string {
    return (name || '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
}

function normalizeUrl(url?: string): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

// Business-type label/badge for the lean tier (company/venue/corporate).
function businessBadge(category?: string): string | null {
    switch (category) {
        case 'company':
            return 'Company';
        case 'venue':
            return 'Venue';
        case 'corporate':
            return 'Corporate';
        default:
            return null;
    }
}

export function ClientPublicProfile({ data, viewerIsClientOrCL }: Props) {
    const [inviteOpen, setInviteOpen] = useState(false);

    const isAgency = data.organizerTypeCategory === 'agency';
    const isBusiness = !!data.organizerTypeCategory && data.organizerTypeCategory !== 'individual';
    // A business/agency is shown by its org name, not the personal name behind it.
    const displayName =
        isBusiness && data.organizationName ? data.organizationName : data.displayName || 'Client';
    const initials = initialsOf(displayName);

    return (
        <View style={s.container}>
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* Top bar */}
                <SafeAreaView edges={['top']} style={s.topBar}>
                    <Pressable onPress={() => router.back()} style={s.topBtn} hitSlop={12}>
                        <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
                    </Pressable>
                </SafeAreaView>

                {isAgency
                    ? renderAgency()
                    : renderLean()}

                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );

    // ── LEAN: individual / company / venue / corporate / undefined ──
    function renderLean() {
        const bizBadge = data.organizationName ? businessBadge(data.organizerTypeCategory) : null;
        const joined = fmtJoined(data.joined);

        return (
            <View style={s.leanWrap}>
                {/* Avatar */}
                <View style={s.avatarCenter}>
                    {data.profileImageUrl ? (
                        <Image source={{ uri: data.profileImageUrl }} style={s.avatarLg} />
                    ) : (
                        <View style={[s.avatarLg, s.avatarFallback]}>
                            <Text style={s.avatarInitials}>{initials}</Text>
                        </View>
                    )}
                </View>

                {/* Name + phone-verified tick */}
                <View style={s.nameRow}>
                    <Text style={s.name}>{displayName}</Text>
                    {data.verified && (
                        <View style={s.verifyTick}>
                            <Check size={11} color="#fff" strokeWidth={3} />
                        </View>
                    )}
                </View>

                {/* Phone-verified badge text */}
                {data.verified && (
                    <View style={s.verifyBadge}>
                        <Check size={10} color="#22C55E" strokeWidth={3} />
                        <Text style={s.verifyBadgeText}>Phone verified</Text>
                    </View>
                )}

                {/* Client · city */}
                <View style={s.metaRow}>
                    <Text style={s.metaPrimary}>
                        Client{data.city ? '' : ''}
                    </Text>
                    {data.city ? (
                        <>
                            <View style={s.metaDot} />
                            <MapPin size={12} color="#71717a" />
                            <Text style={s.metaSecondary}>{data.city}</Text>
                        </>
                    ) : null}
                </View>

                {/* Joined */}
                {joined ? <Text style={s.joined}>Joined {joined}</Text> : null}

                {/* Business-type badge (the org name is already the primary name above) */}
                {bizBadge ? (
                    <View style={[s.bizBadge, { marginBottom: 16 }]}>
                        <Text style={s.bizBadgeText}>{bizBadge}</Text>
                    </View>
                ) : null}

                {/* Privacy note */}
                <View style={s.privacyNote}>
                    <Lock size={12} color="#71717a" />
                    <Text style={s.privacyText}>
                        Contact details are shared after you connect.
                    </Text>
                </View>
            </View>
        );
    }

    // ── AGENCY: rich showcase — mirrors the artist/CL ProfileScreen hero ──
    function renderAgency() {
        const website = normalizeUrl(data.organizationWebsite);
        const services = (data.services ?? []).filter(Boolean);
        const photos = (data.photos ?? []).filter(Boolean);
        const logo = data.logoUrl || data.profileImageUrl;

        const handleShare = () => {
            Share.share({
                message: website
                    ? `${displayName} on NETSA — ${data.organizationWebsite}`
                    : `${displayName} on NETSA`,
            }).catch(() => {});
        };

        return (
            <View style={s.agencyWrap}>
                {/* ═══ 1. COVER ZONE (gradient backdrop, mirrors ProfileScreen) ═══ */}
                <View style={s.cover}>
                    <LinearGradient
                        colors={['#1a0a1e', '#0f1a2e', '#1a0f15']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={s.coverImg}
                    />
                    <LinearGradient
                        colors={['transparent', '#09090b']}
                        style={s.coverFade}
                    />
                </View>

                {/* ═══ 2. LOGO WITH GRADIENT RING ═══ */}
                <View style={s.avatarZone}>
                    <View style={s.ringWrap}>
                        <LinearGradient
                            colors={['#EC4899', '#F97316', '#EAB308']}
                            start={{ x: 0.2, y: 0 }}
                            end={{ x: 0.8, y: 1 }}
                            style={s.ring}
                        >
                            {logo ? (
                                <Image source={{ uri: logo }} style={s.ringAvatarImg} />
                            ) : (
                                <View style={s.ringAvatarInitials}>
                                    <Text style={s.ringInitialsText}>{initials}</Text>
                                </View>
                            )}
                        </LinearGradient>

                        {/* Verified tick badge */}
                        {data.verified && (
                            <View style={s.ringVerifyBadge}>
                                <Check size={12} color="#fff" strokeWidth={3} />
                            </View>
                        )}
                    </View>
                </View>

                {/* ═══ 3. IDENTITY (centered, serif name) ═══ */}
                <View style={s.identity}>
                    <Text style={s.heroName} numberOfLines={2}>
                        {displayName}
                    </Text>
                    <View style={s.heroBadgesRow}>
                        <View style={s.agencyBadge}>
                            <Sparkles size={11} color="#FF6B35" />
                            <Text style={s.agencyBadgeText}>Agency</Text>
                        </View>
                        {data.city ? (
                            <View style={s.cityChip}>
                                <MapPin size={10} color="#8A857B" />
                                <Text style={s.cityChipText}>{data.city}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Website link */}
                    {website ? (
                        <Pressable
                            onPress={() => Linking.openURL(website).catch(() => {})}
                            style={s.websiteRow}
                            hitSlop={6}
                        >
                            <Globe size={13} color="#FF6B35" />
                            <Text style={s.websiteText} numberOfLines={1}>
                                {data.organizationWebsite}
                            </Text>
                        </Pressable>
                    ) : null}
                </View>

                {/* ═══ 4. ACTION CIRCLES (mirror Connect/Message/Share rhythm) ═══ */}
                <View style={s.ctaRow}>
                    {viewerIsClientOrCL && (
                        <Pressable
                            onPress={() => setInviteOpen((v) => !v)}
                            style={({ pressed }) => [s.ctaAction, pressed && { opacity: 0.8 }]}
                        >
                            <LinearGradient
                                colors={['#EC4899', '#F97316']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={s.ctaIconGrad}
                            >
                                <UserPlus size={18} color="#fff" />
                            </LinearGradient>
                            <Text style={s.ctaLabel}>Invite</Text>
                        </Pressable>
                    )}
                    <Pressable
                        onPress={handleShare}
                        style={({ pressed }) => [s.ctaAction, pressed && { opacity: 0.8 }]}
                    >
                        <View style={s.ctaIconOutline}>
                            <Share2 size={18} color="#6B6878" />
                        </View>
                        <Text style={s.ctaLabel}>Share</Text>
                    </Pressable>
                </View>

                {/* Invite to propose sheet (clients / CLs only) */}
                {viewerIsClientOrCL && (
                    <InviteSheet
                        visible={inviteOpen}
                        person={{
                            _id: data._id,
                            displayName,
                            role: 'creative_lead',
                        }}
                        onClose={() => setInviteOpen(false)}
                        onSent={() => setInviteOpen(false)}
                    />
                )}

                {/* ═══ 5. ABOUT — editorial quote style (mirrors ProfileScreen bio) ═══ */}
                {data.bio ? (
                    <View style={s.bioSection}>
                        <Text style={s.bioQuoteMark}>&ldquo;</Text>
                        <Text style={s.heroBioText}>{data.bio}</Text>
                    </View>
                ) : null}

                {/* ═══ 6. SERVICES — floating pill cloud ═══ */}
                {services.length > 0 ? (
                    <View style={s.skillsSection}>
                        <Text style={s.heroSectionLabel}>Services</Text>
                        <View style={s.pillCloud}>
                            {services.map((svc, i) => (
                                <View key={`${svc}-${i}`} style={s.servicePill}>
                                    <Text style={s.servicePillText}>{svc}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* ═══ 7. GALLERY — horizontal photo strip ═══ */}
                {photos.length > 0 ? (
                    <View style={s.skillsSection}>
                        <Text style={s.heroSectionLabel}>Gallery</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10, paddingRight: 20 }}
                        >
                            {photos.map((url, i) => (
                                <Image
                                    key={`${url}-${i}`}
                                    source={{ uri: url }}
                                    style={s.galleryImg}
                                />
                            ))}
                        </ScrollView>
                    </View>
                ) : null}

                {/* ═══ 8. FACTS — years in business / team size ═══ */}
                {(data.yearsInBusiness != null || data.teamSize != null) && (
                    <>
                        <View style={s.sectionDivider} />
                        <View style={s.skillsSection}>
                            {data.yearsInBusiness != null && (
                                <View style={s.factRow}>
                                    <Briefcase size={14} color="#8A857B" />
                                    <Text style={s.factText}>
                                        {data.yearsInBusiness}{' '}
                                        {data.yearsInBusiness === 1 ? 'year' : 'years'} in business
                                    </Text>
                                </View>
                            )}
                            {data.teamSize != null && (
                                <View style={s.factRow}>
                                    <Users size={14} color="#8A857B" />
                                    <Text style={s.factText}>Team of {data.teamSize}</Text>
                                </View>
                            )}
                        </View>
                    </>
                )}

                {/* Privacy note */}
                <View style={[s.privacyNote, s.privacyNoteAgency]}>
                    <Lock size={12} color="#71717a" />
                    <Text style={s.privacyText}>
                        Contact details are shared after you connect.
                    </Text>
                </View>
            </View>
        );
    }
}

export default ClientPublicProfile;

// ── Styles ──
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#09090b' },
    scroll: { paddingBottom: 24 },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    topBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },

    avatarFallback: {
        backgroundColor: 'rgba(255,107,53,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontFamily: 'Outfit-SemiBold',
        color: '#FF6B35',
        fontSize: 26,
    },

    // ── Lean ──
    leanWrap: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    avatarCenter: { marginBottom: 16 },
    avatarLg: { width: 92, height: 92, borderRadius: 46 },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    name: {
        fontFamily: 'DMSerifDisplay_400Regular',
        color: '#f4f4f5',
        fontSize: 24,
        textAlign: 'center',
    },
    verifyTick: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#22C55E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(34,197,94,0.10)',
        borderRadius: 99,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 10,
    },
    verifyBadgeText: {
        fontFamily: 'Outfit-SemiBold',
        color: '#22C55E',
        fontSize: 11,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    metaPrimary: {
        fontFamily: 'Outfit-SemiBold',
        color: '#C9C4BA',
        fontSize: 13,
    },
    metaSecondary: {
        fontFamily: 'Outfit-Regular',
        color: '#71717a',
        fontSize: 13,
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#52525b',
    },
    joined: {
        fontFamily: 'Outfit-Regular',
        color: '#71717a',
        fontSize: 12,
        marginBottom: 12,
    },
    orgRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginBottom: 16,
    },
    orgName: {
        fontFamily: 'Outfit-Regular',
        color: '#C9C4BA',
        fontSize: 13,
    },
    bizBadge: {
        backgroundColor: 'rgba(139,92,246,0.15)',
        borderRadius: 99,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    bizBadgeText: {
        fontFamily: 'Outfit-SemiBold',
        color: '#A78BFA',
        fontSize: 10,
    },
    privacyNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginTop: 8,
        alignSelf: 'stretch',
    },
    privacyText: {
        fontFamily: 'Outfit-Regular',
        color: '#71717a',
        fontSize: 12,
        flex: 1,
        lineHeight: 17,
    },

    // ── Agency (hero mirrors ProfileScreen) ──
    agencyWrap: { paddingTop: 0 },

    // Cover zone — mirrors ProfileScreen.cover
    cover: { height: 200, position: 'relative', overflow: 'hidden', marginTop: 4 },
    coverImg: { width: '100%', height: '100%', position: 'absolute' },
    coverFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 140 },

    // Logo with gradient ring — mirrors ProfileScreen.avatarZone/ring
    avatarZone: { alignItems: 'center', marginTop: -70, zIndex: 5 },
    ringWrap: { position: 'relative' },
    ring: { width: 122, height: 122, borderRadius: 30, padding: 4, alignItems: 'center', justifyContent: 'center' },
    ringAvatarImg: { width: 110, height: 110, borderRadius: 26, borderWidth: 3, borderColor: '#09090b' },
    ringAvatarInitials: { width: 110, height: 110, borderRadius: 26, borderWidth: 3, borderColor: '#09090b', backgroundColor: '#15151C', alignItems: 'center', justifyContent: 'center' },
    ringInitialsText: { fontFamily: 'Outfit-Black', fontSize: 34, color: 'rgba(255,255,255,0.14)' },
    ringVerifyBadge: { position: 'absolute', bottom: 2, right: -4, width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: '#09090b', backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' },

    // Identity — mirrors ProfileScreen.identity
    identity: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 14 },
    heroName: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 30, color: '#F0ECE6', letterSpacing: -0.5, textAlign: 'center' },
    heroBadgesRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10 },

    // Action circles — mirrors ProfileScreen.ctaRow/ctaIconGrad/ctaIconOutline/ctaLabel
    ctaRow: { flexDirection: 'row', justifyContent: 'center', gap: 28, paddingHorizontal: 20, marginTop: 16 },
    ctaAction: { alignItems: 'center', gap: 6 },
    ctaIconGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#EC4899', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
    ctaIconOutline: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    ctaLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 10, color: '#6B6878', textTransform: 'uppercase', letterSpacing: 1 },

    // Bio — editorial quote, mirrors ProfileScreen.bioSection/bioText
    bioSection: { paddingHorizontal: 24, paddingTop: 28, marginTop: 12, position: 'relative' },
    bioQuoteMark: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 72, lineHeight: 50, color: 'rgba(249,115,22,0.12)', position: 'absolute', top: 18, left: 18 },
    heroBioText: { fontFamily: 'Outfit-Light', fontSize: 16, color: '#F0ECE6', lineHeight: 30, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: 'rgba(249,115,22,0.15)', marginLeft: 4 },

    // Section (services / gallery / facts) — mirrors ProfileScreen.skillsSection/sectionLabel/sectionDivider
    skillsSection: { paddingHorizontal: 20, paddingTop: 20 },
    heroSectionLabel: { fontFamily: 'Outfit-Bold', fontSize: 10, color: '#4A4656', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14, paddingLeft: 4 },
    sectionDivider: { marginHorizontal: 20, marginTop: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
    privacyNoteAgency: { marginHorizontal: 20, marginTop: 24 },

    agencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,107,53,0.12)',
        borderRadius: 99,
        paddingHorizontal: 9,
        paddingVertical: 3,
    },
    agencyBadgeText: {
        fontFamily: 'Outfit-SemiBold',
        color: '#FF6B35',
        fontSize: 11,
    },
    cityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 99,
        paddingHorizontal: 9,
        paddingVertical: 3,
    },
    cityChipText: {
        fontFamily: 'Outfit-Regular',
        color: '#C9C4BA',
        fontSize: 11,
    },
    websiteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginBottom: 14,
    },
    websiteText: {
        fontFamily: 'Outfit-Regular',
        color: '#FF6B35',
        fontSize: 13,
        flexShrink: 1,
    },
    pillCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    servicePill: {
        backgroundColor: 'rgba(255,107,53,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(255,107,53,0.25)',
        borderRadius: 99,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    servicePillText: {
        fontFamily: 'Outfit-Regular',
        color: '#FF8B5E',
        fontSize: 12,
    },
    galleryImg: {
        width: 150,
        height: 150,
        borderRadius: 14,
        backgroundColor: '#15151C',
    },
    factRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        marginBottom: 10,
    },
    factText: {
        fontFamily: 'Outfit-Regular',
        color: '#C9C4BA',
        fontSize: 13,
    },
});
