// src/features/hirer-hub/components/ApplicantProfileBody.tsx
//
// One page of the applicant profile modal (ApplicantProfileModal) — the
// condensed, borderless artist profile shown while triaging, matching
// DOCS/04-design/mockups/manage-gig.html (the `.psheet` interior) and its
// build plan `applicant-profile-modal-PLAN.md`.
//
// We render the hire-decision slice, NOT the whole SpotlightProfile: that
// screen sizes its cover + bento from module-level window width and overflows
// an inset card. Zones here: hero (instant, from the application snapshot) ·
// Styles · About + Featured/showcase (streamed from useUser) · Portfolio links
// (from the application) · an "Open full profile" escape hatch to /profile/:id.
// Sections the full profile keeps but triage drops (cover halo, connect,
// experience, languages, socials) live one tap away behind that row.
//
// Non-artist targets (a client-posted gig gets Creative-Lead applicants, whose
// real profile is CreativeLeadProfile) get a compact fallback + the escape
// hatch, never the artist-only zones.

import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { MapPin, BadgeCheck, Link2, Play, ArrowRight } from 'lucide-react-native';
import { useUser } from '@/hooks/useUser';
import MarkdownText from '@/components/inputs/MarkdownText';
import type { ProfileVideoReel } from '@/components/profile/types';

const C = {
    t1: '#FFFFFF', t2: '#D4D4D8', t3: '#A1A1AA', t4: '#8B8B99', t5: '#5C5C66',
    orange: '#FF6B35', orangeTint: '#FFCBB2', amber: '#F0B65A', green: '#22C55E',
    line: 'rgba(255,255,255,0.07)', thumbBg: '#1C1C23', chipLine: 'rgba(255,255,255,0.09)',
};

const AVATAR_TINTS = ['#3A2A1F', '#2A2340', '#1F3328', '#332A1F', '#24303F', '#331F2B', '#1F2A33', '#2E2A1F'];
function tintFor(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return AVATAR_TINTS[h % AVATAR_TINTS.length];
}
function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'A';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
const sameCity = (a?: string, b?: string) =>
    !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

// Friendly label for a portfolio URL (ported from the retired detail screen).
const HOST_LABELS: Record<string, string> = {
    'instagram.com': 'Instagram', 'youtube.com': 'YouTube', 'youtu.be': 'YouTube',
    'vimeo.com': 'Vimeo', 'facebook.com': 'Facebook', 'fb.com': 'Facebook',
    'tiktok.com': 'TikTok', 'spotify.com': 'Spotify', 'soundcloud.com': 'SoundCloud',
    'drive.google.com': 'Google Drive', 'linkedin.com': 'LinkedIn', 'behance.net': 'Behance',
    'x.com': 'X', 'twitter.com': 'X',
};
function portfolioLabel(url: string): string {
    try {
        const u = new URL(url.includes('://') ? url : `https://${url}`);
        const host = u.hostname.replace(/^www\./, '').toLowerCase();
        if (HOST_LABELS[host]) return HOST_LABELS[host];
        const root = host.split('.').slice(-2, -1)[0] || host;
        return root ? root.charAt(0).toUpperCase() + root.slice(1) : 'Link';
    } catch {
        return 'Link';
    }
}

type Media = { url: string; type: 'image' | 'video' };

type Props = {
    application: any;
    /** Venue city → amber "out of town" tint on the location pin. */
    venueCity?: string;
    /** The page (card inner) width — the body fills it. */
    width: number;
    /** Escape hatch + non-artist fallback → push /profile/:id. */
    onOpenFullProfile: (artistId: string) => void;
};

export function ApplicantProfileBody({ application, venueCity, width, onOpenFullProfile }: Props) {
    const snap = application?.artistSnapshot ?? {};
    const artistId: string =
        typeof application?.artistId === 'object' ? application?.artistId?._id : application?.artistId;

    const { data, isLoading } = useUser(artistId ?? '');
    const u = (data ?? {}) as any;

    // Hero fields — from the snapshot so they paint instantly, enriched by the
    // fetched user once it resolves.
    const displayName = ((u.displayName ?? snap.displayName ?? '') as string).trim() || 'Anonymous';
    const city: string | undefined = u.location || u.cached?.primaryCity || snap.primaryCity || snap.location;
    const outOfTown = !!city && !!venueCity && !sameCity(city, venueCity);
    const avatarUrl: string | undefined = u.profileImageUrl || snap.profileImageUrl;

    const phoneVerified = !!(u.phoneVerifiedAt || u.phoneVerified || u.isPhoneVerified);
    const emailVerified = !!(u.emailVerifiedAt || u.emailVerified || u.isEmailVerified);
    const verified = (phoneVerified && emailVerified) || u.trustTier === 'verified' || !!u.isVerified;

    const isArtist = !data || !u.role || u.role === 'artist';

    // Styles = the applicant's specialities (lead in orange), consistent with
    // the list card. Falls back to the single artistType.
    const specialities: string[] = Array.isArray(snap.specialities) ? snap.specialities.filter(Boolean) : [];
    let roles = specialities.slice();
    if (roles.length === 0 && snap.artistType) roles = [snap.artistType];

    const bio: string = (u.bio || u.headline || '').trim();

    // Showcase — gallery photos + ready video reels (same mapping as Spotlight).
    const photoUrls: string[] = (u.gallery?.length
        ? u.gallery.map((p: any) => p?.url)
        : (u.galleryUrls || [])).filter(Boolean);
    const reels: ProfileVideoReel[] = ((u.videoReels || []) as ProfileVideoReel[]).filter((r) => r.status === 'ready');
    const media: Media[] = [
        ...photoUrls.map((url: string) => ({ url, type: 'image' as const })),
        ...reels.map((r) => ({ url: r.thumbnailUrl || '', type: 'video' as const })),
    ].filter((m) => m.url);

    const portfolioLinks: string[] = Array.isArray(application?.portfolioLinks)
        ? application.portfolioLinks.filter((l: any) => typeof l === 'string' && l.trim())
        : [];

    const openLink = (url: string) => {
        const href = url.includes('://') ? url : `https://${url}`;
        Linking.openURL(href).catch(() => {});
    };

    return (
        <ScrollView
            style={{ width, flex: 1 }}
            contentContainerStyle={{ paddingBottom: 18 }}
            showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 18, paddingTop: 4 }}>
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={{ width: 56, height: 56, borderRadius: 17 }} />
                ) : (
                    <View style={{ width: 56, height: 56, borderRadius: 17, backgroundColor: tintFor(displayName), alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 18, color: '#FFFFFF' }}>{initialsOf(displayName)}</Text>
                    </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: 'Outfit-Bold', fontSize: 19, color: C.t1, letterSpacing: -0.3 }}>
                            {displayName}
                        </Text>
                        {verified ? <BadgeCheck size={16} color={C.green} strokeWidth={2} /> : null}
                    </View>
                    {city ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            <MapPin size={12} color={outOfTown ? C.amber : C.t5} strokeWidth={1.8} />
                            <Text numberOfLines={1} style={{ fontSize: 11.5, color: outOfTown ? C.amber : C.t4 }}>
                                {outOfTown ? `${city} · out of town` : city}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </View>

            {/* Styles — artist targets only */}
            {isArtist && roles.length > 0 ? (
                <Section label="Styles">
                    <Text style={{ fontSize: 13, lineHeight: 21 }}>
                        <Text style={{ color: C.orangeTint, fontWeight: '500' }}>{roles[0]}</Text>
                        <Text style={{ color: C.t3 }}>{roles.slice(1).map((r) => ` · ${r}`).join('')}</Text>
                    </Text>
                </Section>
            ) : null}

            {/* About */}
            {bio ? (
                <Section label="About">
                    <MarkdownText value={bio} color={C.t3} size={13} lineHeight={21} accent={C.orange} />
                </Section>
            ) : null}

            {/* Showcase — artist targets only */}
            {isArtist && media.length > 0 ? (
                <View style={{ marginTop: 20 }}>
                    <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: C.t5, paddingHorizontal: 18 }}>
                        Featured · {media.length}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 18, paddingTop: 11 }}>
                        {media.map((m, i) => (
                            <View key={i} style={{ width: 128, height: 150, borderRadius: 12, overflow: 'hidden', backgroundColor: C.thumbBg }}>
                                {m.url ? <Image source={{ uri: m.url }} style={{ width: '100%', height: '100%' }} /> : null}
                                {m.type === 'video' ? (
                                    <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' } as any}>
                                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                                            <Play size={13} color="#fff" fill="#fff" />
                                        </View>
                                    </View>
                                ) : null}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            ) : null}

            {/* Portfolio — named links carried over from the application */}
            {portfolioLinks.length > 0 ? (
                <Section label={`Portfolio · ${portfolioLinks.length} ${portfolioLinks.length === 1 ? 'link' : 'links'}`}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {portfolioLinks.map((link, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => openLink(link)}
                                accessibilityLabel={`Open ${portfolioLabel(link)}`}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, borderWidth: 1, borderColor: C.chipLine }}>
                                <Link2 size={12} color={C.t4} strokeWidth={1.8} />
                                <Text style={{ fontSize: 11, color: C.t2 }}>{portfolioLabel(link)} ↗</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Section>
            ) : null}

            {/* Still streaming the rich profile — hero already shows from the snapshot */}
            {isLoading && !data ? (
                <View style={{ paddingVertical: 22, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={C.orange} />
                </View>
            ) : null}

            {/* Escape hatch — the full profile (cover, connect, experience,
                languages, socials) is one tap away. Also the non-artist path. */}
            <View style={{ paddingHorizontal: 18, paddingTop: 20 } as any}>
                <TouchableOpacity
                    onPress={() => artistId && onOpenFullProfile(artistId)}
                    accessibilityLabel="Open full profile"
                    style={{ height: 44, borderRadius: 12, borderWidth: 1, borderColor: C.chipLine, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 12.5, color: C.t3 }}>
                        Open full profile
                    </Text>
                    <ArrowRight size={14} color={C.t3} strokeWidth={2} />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={{ paddingHorizontal: 18, paddingTop: 20 }}>
            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: C.t5, marginBottom: 9 }}>
                {label}
            </Text>
            {children}
        </View>
    );
}
