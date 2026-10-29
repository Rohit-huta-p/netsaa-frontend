// src/features/hirer-hub/components/ApplicantDetailScreen.tsx
//
// Full-screen applicant detail — the "Applicant detail · opened" frame of
// DOCS/04-design/mockups/applicant-card-D.html (screen 6). Opened by tapping an
// applicant card body or a Discussion asker's ↗ chip. Shows the full pitch,
// every skill, the portfolio, and the gig context, then the decision bar.
//
// Anatomy (mockup .dhd / .dsec / .quote / .drow / .dbar):
//   .dhd  — back chevron + hero (avatar, name, status tag, ★rating, craft chip,
//           location pin, "APPLIED Xh AGO")
//   body  — Skills (full list) · cover-note quote · Portfolio (named links) ·
//           Applying-for / Dates / Pay rows · "View full profile →"
//   .dbar — decision bar, status-aware:
//             applied/reviewed → Reject · Message · Shortlist
//             shortlisted      → Reject · Message · Hire
//             hired            → Message · Remove
//           (applied→hired is not a valid server transition — B3 state machine
//            is applied→shortlisted→hired — so the forward action on an applied
//            applicant is Shortlist, not Hire.)
//
// Pay follows [[pay-as-fact-rule]]: a plain "₹X per performer" fact is allowed
// in the detail (never on the card, no take-home / fee math).

import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MapPin, Star, Link2, MessageSquare, X, Check, ArrowRight } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#5C5A66', text4: '#3F3D4A',
    canvas: '#121216', card: '#1C1C23', cardLine: 'rgba(243,239,232,0.07)',
    orange: '#FF6B35', orangeTint: '#FFCBB2', gold: '#F59E0B',
    green: '#22C55E', red: '#F0858A', blue: '#8DC0FB', amber: '#F0B65A',
    chipBg: 'rgba(255,255,255,0.04)', chipLine: 'rgba(255,255,255,0.09)',
    avatarIdle: '#26222C',
};

const STATUS_TAG: Record<string, { label: string; color: string }> = {
    applied: { label: 'Applied', color: COLORS.blue },
    reviewed: { label: 'Reviewed', color: COLORS.blue },
    viewed: { label: 'Reviewed', color: COLORS.blue },
    shortlisted: { label: 'Shortlisted', color: COLORS.amber },
    hired: { label: 'Hired', color: COLORS.green },
};

const sameCity = (a?: string, b?: string) =>
    !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

// "APPLIED 2H AGO" from the application's appliedAt.
function appliedAgo(iso?: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
    let s: string;
    if (mins < 1) s = 'JUST NOW';
    else if (mins < 60) s = `${mins}M AGO`;
    else {
        const hrs = Math.round(mins / 60);
        s = hrs < 24 ? `${hrs}H AGO` : `${Math.round(hrs / 24)}D AGO`;
    }
    return `APPLIED ${s}`;
}

// Friendly label for a portfolio URL — known hosts get a name, others the
// capitalised domain root. "Instagram ↗", "YouTube ↗", "example ↗".
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

type Props = {
    visible: boolean;
    application: any | null;
    /** Venue city → amber "out of town" tint on the location pin. */
    venueCity?: string;
    /** Gig-context rows (composed by the hub). Each renders only when present. */
    applyingForLabel?: string;
    datesLabel?: string;
    payLabel?: string;
    onClose: () => void;
    onReject: (id: string) => void;
    onShortlist: (id: string) => void;
    onHire: (id: string) => void;
    onViewProfile: (artistId: string) => void;
    onMessage?: (id: string) => void;
    /** Hired state only (e.g. a hired asker opened from Discussion). */
    onRemove?: (id: string) => void;
};

export function ApplicantDetailScreen({
    visible, application, venueCity, applyingForLabel, datesLabel, payLabel,
    onClose, onReject, onShortlist, onHire, onViewProfile, onMessage, onRemove,
}: Props) {
    const insets = useSafeAreaInsets();
    if (!visible || !application) return null;

    const snap = application.artistSnapshot ?? {};
    const displayName = ((snap.displayName ?? '') as string).trim() || 'Anonymous';
    const initial = (displayName[0] || 'A').toUpperCase();
    const status: string = application.status ?? 'applied';
    const tag = STATUS_TAG[status] ?? STATUS_TAG.applied;

    const artistType: string | undefined = snap.artistType;
    const city: string | undefined = snap.primaryCity ?? snap.location;
    const outOfTown = !!city && !!venueCity && !sameCity(city, venueCity);
    const rating: number | undefined =
        typeof snap.rating === 'number' && snap.rating > 0 ? snap.rating : undefined;

    const specialities: string[] = Array.isArray(snap.specialities) ? snap.specialities.filter(Boolean) : [];
    const coverNote: string = (application.coverNote ?? '').trim();
    const portfolioLinks: string[] = Array.isArray(application.portfolioLinks)
        ? application.portfolioLinks.filter((l: any) => typeof l === 'string' && l.trim())
        : [];
    const applied = appliedAgo(application.appliedAt);
    const isHired = status === 'hired';

    const call = (handler?: (id: string) => void) => () => handler?.(application._id);
    const openLink = (url: string) => {
        const href = url.includes('://') ? url : `https://${url}`;
        Linking.openURL(href).catch(() => {});
    };

    return (
        <Modal visible animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: COLORS.canvas }}>
                {/* warm wash behind the header — mirrors the mockup .dhd radial */}
                <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150 }}>
                    <LinearGradient
                        colors={['rgba(255,107,53,0.06)', 'transparent']}
                        style={{ flex: 1 }}
                    />
                </View>

                {/* .dhd — back chevron + hero */}
                <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 18, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
                    <TouchableOpacity
                        onPress={onClose}
                        accessibilityLabel="Back"
                        hitSlop={8}
                        style={{ width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: COLORS.chipLine, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                        <ChevronLeft size={18} color={COLORS.text1} strokeWidth={2} />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                        <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: COLORS.avatarIdle, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 20, color: COLORS.text0 }}>{initial}</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 19, color: COLORS.text0, letterSpacing: -0.3 }} numberOfLines={1}>
                                    {displayName}
                                </Text>
                                <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: `${tag.color}1F`, borderWidth: 1, borderColor: `${tag.color}4D` }}>
                                    <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8, letterSpacing: 0.8, color: tag.color, textTransform: 'uppercase' }}>{tag.label}</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 7 }}>
                                {rating != null ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                        <Star size={12} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
                                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 13, color: COLORS.gold }}>{rating}</Text>
                                    </View>
                                ) : null}
                                {artistType ? (
                                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,107,53,0.14)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.28)' }}>
                                        <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8, letterSpacing: 0.8, color: COLORS.orangeTint, textTransform: 'uppercase' }}>{artistType}</Text>
                                    </View>
                                ) : null}
                                {city ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 0 }}>
                                        <MapPin size={11} color={outOfTown ? COLORS.amber : COLORS.text3} strokeWidth={1.8} />
                                        <Text style={{ fontSize: 10.5, color: outOfTown ? COLORS.amber : COLORS.text2 }} numberOfLines={1}>
                                            {outOfTown ? `${city} · out of town` : city}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                            {applied ? (
                                <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8.5, letterSpacing: 0.8, color: COLORS.text4, marginTop: 7 }}>{applied}</Text>
                            ) : null}
                        </View>
                    </View>
                </View>

                {/* body */}
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                    {/* Skills — full list */}
                    {specialities.length > 0 ? (
                        <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
                            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: COLORS.text3 }}>Skills</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                                {specialities.map((s, i) => (
                                    <View key={`${s}-${i}`} style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: COLORS.chipBg, borderWidth: 1, borderColor: COLORS.chipLine }}>
                                        <Text style={{ fontSize: 11, color: '#A1A1AA' }}>{s}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : null}

                    {/* cover note — quote */}
                    {coverNote ? (
                        <View style={{ marginHorizontal: 18, marginTop: 18, paddingVertical: 15, paddingLeft: 20, paddingRight: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardLine, borderLeftWidth: 2, borderLeftColor: COLORS.orange, borderTopRightRadius: 13, borderBottomRightRadius: 13 }}>
                            <Text style={{ position: 'absolute', top: 2, left: 7, fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color: 'rgba(255,107,53,0.35)' }}>“</Text>
                            <Text style={{ fontSize: 13, lineHeight: 21, color: COLORS.text1 }}>{coverNote}</Text>
                        </View>
                    ) : null}

                    {/* Portfolio — named links */}
                    {portfolioLinks.length > 0 ? (
                        <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
                            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: COLORS.text3 }}>
                                Portfolio · {portfolioLinks.length} {portfolioLinks.length === 1 ? 'link' : 'links'}
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                                {portfolioLinks.map((link, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => openLink(link)}
                                        accessibilityLabel={`Open ${portfolioLabel(link)}`}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: COLORS.chipBg, borderWidth: 1, borderColor: COLORS.chipLine }}>
                                        <Link2 size={12} color={COLORS.text2} strokeWidth={1.8} />
                                        <Text style={{ fontSize: 11, color: COLORS.text1 }}>{portfolioLabel(link)} ↗</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : null}

                    {/* gig-context rows */}
                    <View style={{ marginTop: 20 }}>
                        {applyingForLabel ? <DetailRow k="Applying for" v={applyingForLabel} /> : null}
                        {datesLabel ? <DetailRow k="Dates" v={datesLabel} /> : null}
                        {payLabel ? <DetailRow k="Pay" v={payLabel} /> : null}
                    </View>

                    {/* view full profile */}
                    <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
                        <TouchableOpacity
                            onPress={() => onViewProfile(typeof application.artistId === 'object' ? application.artistId?._id : application.artistId)}
                            accessibilityLabel="View full profile"
                            style={{ height: 44, borderRadius: 12, borderWidth: 1, borderColor: COLORS.chipLine, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                            <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 12.5, color: COLORS.text1 }}>View full profile</Text>
                            <ArrowRight size={14} color={COLORS.text1} strokeWidth={2} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* .dbar — decision bar, status-aware */}
                <View style={{ flexDirection: 'row', gap: 9, paddingHorizontal: 17, paddingTop: 13, paddingBottom: insets.bottom + 13, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
                    {isHired ? (
                        <>
                            {onMessage ? <BarBtn flex={1} label="Message" icon={MessageSquare} tint={COLORS.text1} border={COLORS.chipLine} onPress={call(onMessage)} /> : null}
                            {onRemove ? <BarBtn flex={1.4} label="Remove" icon={X} tint={COLORS.red} border="rgba(240,101,107,0.3)" onPress={call(onRemove)} /> : null}
                        </>
                    ) : (
                        <>
                            <BarBtn flex={0} width={48} label="" accessibilityLabel="Reject" icon={X} tint={COLORS.red} border="rgba(240,101,107,0.3)" onPress={call(onReject)} />
                            {onMessage ? <BarBtn flex={1} label="Message" icon={MessageSquare} tint={COLORS.text1} border={COLORS.chipLine} onPress={call(onMessage)} /> : null}
                            {status === 'shortlisted' ? (
                                <BarBtn flex={1.4} label="Hire" icon={Check} primary onPress={call(onHire)} />
                            ) : (
                                <BarBtn flex={1.4} label="Shortlist" primary onPress={call(onShortlist)} />
                            )}
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

function DetailRow({ k, v }: { k: string; v: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 18, paddingVertical: 13, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.055)' }}>
            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', color: COLORS.text3 }}>{k}</Text>
            <Text style={{ flex: 1, textAlign: 'right', fontSize: 12.5, color: COLORS.text1, fontWeight: '500' }} numberOfLines={2}>{v}</Text>
        </View>
    );
}

function BarBtn({
    flex, width, label, accessibilityLabel, icon: Icon, tint, border, primary, onPress,
}: {
    flex: number; width?: number; label: string; accessibilityLabel?: string;
    icon?: any; tint?: string; border?: string; primary?: boolean; onPress: () => void;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityLabel={accessibilityLabel ?? label}
            style={{
                flex: flex || undefined, width, height: 48, borderRadius: 12,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                backgroundColor: primary ? COLORS.orange : 'transparent',
                borderWidth: primary ? 0 : 1, borderColor: border ?? COLORS.chipLine,
            }}>
            {Icon ? <Icon size={16} color={primary ? '#160A04' : tint} strokeWidth={2.2} /> : null}
            {label ? <Text style={{ fontFamily: primary ? 'Outfit-Bold' : 'Outfit-SemiBold', fontSize: 13, color: primary ? '#160A04' : tint }}>{label}</Text> : null}
        </TouchableOpacity>
    );
}
