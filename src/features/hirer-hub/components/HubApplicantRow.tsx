// src/features/hirer-hub/components/HubApplicantRow.tsx
//
// Manage-Gig applicant CARD — the "crisp" card (DOCS/04-design/mockups/
// manage-gig.html, `.pcard`). One card across the whole pipeline; only the
// name-row tag and the footer action change per stage:
//   applied / reviewed  →  Pass · Shortlist   (Pass is reversible — see below)
//   shortlisted         →  Hire
//   hired               →  Message · Remove   (+ a "● Hired" tag by the name)
//
// Crisp anatomy (pill-free, name-led, NO rating, NO craft chip — every
// applicant to a dancer gig IS a dancer):
//   avatar (initials on a stable colour) · name (+ orange dot when new) · Share
//   role line  = lead styles, first in orange, middot-joined
//   meta row   = 💼 experience · 📍 location   (experience only when the
//                snapshot carries it; see note below — today it's location-only)
//   note       = the applicant's coverNote, 2-line clamp, orange “ ” quotes
//   actions    = small, right-aligned, per stage
// The location pin turns amber when the artist's city differs from the venue
// city ("out of town"). Fields come off the denormalised artistSnapshot (BE
// B1): primaryCity (|| legacy `location`), specialities[], artistType (role
// fallback), plus coverNote on the application.
//
// Experience: the artistSnapshot does NOT carry years/level today, so the meta
// row renders location only. It reads `experienceYears` / `experienceLevel`
// defensively so the briefcase lights up the moment the snapshot captures one
// (a small BE follow-up, mirroring how B1 added primaryCity + specialities).
//
// Reversible Pass: `isPassed` dims the body to 50% and swaps the footer for a
// "Passed" tag + Undo (kept lit). The parent section keeps passed cards on
// screen for the session; the server flip is applied -> rejected (Pass) and
// rejected -> applied (Undo, enabled by netsaa-backend #15).

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, X, MapPin, Briefcase, Undo2, MessageSquare, Share as ShareIcon } from 'lucide-react-native';

const COLORS = {
    text1: '#FFFFFF', text2: '#D4D4D8', text3: '#A1A1AA', text4: '#8B8B99', text5: '#5C5C66',
    orange: '#FF6B35', orangeTint: '#FFCBB2', amber: '#F0B65A',
    hiredGreen: '#6EE7A0', greenDot: '#22C55E', red: '#F0858A',
    surface: '#15151B', border: '#23232C', passBorder: '#2E2E38',
    onOrange: '#160A04',
};

// Stable, muted avatar tints (matches the mockup's hand-picked dark fills).
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

const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const sameCity = (a?: string, b?: string) =>
    !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

const MAX_ROLES = 3;

type Props = {
    application: any;
    venueCity?: string;
    isPassed?: boolean;
    onTap?: (applicationId: string) => void;
    onShare?: (applicationId: string) => void;
    onPass?: (applicationId: string) => void;
    onUndoPass?: (applicationId: string) => void;
    onShortlist?: (applicationId: string) => void;
    onHire?: (applicationId: string) => void;
    onMessage?: (applicationId: string) => void;
    onRemove?: (applicationId: string) => void;
};

export function HubApplicantRow({
    application, venueCity, isPassed,
    onTap, onShare, onPass, onUndoPass, onShortlist, onHire, onMessage, onRemove,
}: Props) {
    const snap = application.artistSnapshot ?? {};
    const displayName = ((snap.displayName ?? '') as string).trim() || 'Anonymous';
    const status: string = application.status ?? 'applied';
    const isFresh = status === 'applied' && !isPassed;

    // Role line = the applicant's styles (lead first, in orange). Falls back to
    // the single artistType only when no specialities were captured.
    const specialities: string[] = Array.isArray(snap.specialities) ? snap.specialities.filter(Boolean) : [];
    let roles = specialities.slice(0, MAX_ROLES);
    if (roles.length === 0 && snap.artistType) roles = [snap.artistType];

    const city: string | undefined = snap.primaryCity ?? snap.location;
    const outOfTown = !!city && !!venueCity && !sameCity(city, venueCity);

    // Experience — absent from the snapshot today, so this is undefined live and
    // the meta row shows location only. Lights up if a future snapshot carries it.
    const expYears = snap.experienceYears ?? snap.yearsExperience;
    const experience =
        typeof expYears === 'number' && expYears > 0 ? `${expYears} yr${expYears === 1 ? '' : 's'}`
            : (typeof snap.experienceLevel === 'string' && snap.experienceLevel ? titleCase(snap.experienceLevel) : undefined);

    const coverNote: string = (application.coverNote ?? '').trim();

    const call = (handler?: (id: string) => void) => (e: any) => {
        e?.stopPropagation?.();
        handler?.(application._id);
    };

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onTap?.(application._id)}
            accessibilityLabel={`Open applicant ${displayName}`}
            style={{
                paddingVertical: 14,
                paddingHorizontal: 15,
                marginBottom: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface,
            }}>
            {/* top + note dim while passed; the footer (Undo) stays lit */}
            <View style={{ opacity: isPassed ? 0.5 : 1 }} pointerEvents={isPassed ? 'none' : 'auto'}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <View style={{
                        width: 44, height: 44, borderRadius: 13,
                        backgroundColor: tintFor(displayName),
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 15, color: '#FFFFFF' }}>
                            {initialsOf(displayName)}
                        </Text>
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
                                <Text
                                    numberOfLines={1}
                                    style={{ flexShrink: 1, fontFamily: 'Outfit-Bold', fontSize: 15.5, color: COLORS.text1, letterSpacing: -0.2 }}>
                                    {displayName}
                                </Text>
                                {isFresh ? (
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.orange, marginLeft: 7 }} />
                                ) : null}
                            </View>

                            {status === 'hired' ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.greenDot }} />
                                    <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8, letterSpacing: 0.8, color: COLORS.hiredGreen, textTransform: 'uppercase' }}>
                                        Hired
                                    </Text>
                                </View>
                            ) : null}

                            {onShare ? (
                                <TouchableOpacity
                                    onPress={call(onShare)}
                                    accessibilityLabel={`Share ${displayName}`}
                                    hitSlop={8}
                                    style={{ padding: 0 }}>
                                    <ShareIcon size={16} color={COLORS.text5} strokeWidth={1.8} />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {roles.length > 0 ? (
                            <Text numberOfLines={1} style={{ fontSize: 12, color: COLORS.text4, marginTop: 3 }}>
                                <Text style={{ color: COLORS.orangeTint, fontWeight: '500' }}>{roles[0]}</Text>
                                {roles.slice(1).map((r) => ` · ${r}`).join('')}
                            </Text>
                        ) : null}

                        {experience || city ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                                {experience ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <Briefcase size={12} color={COLORS.text5} strokeWidth={1.8} />
                                        <Text style={{ fontSize: 11, color: COLORS.text4 }}>{experience}</Text>
                                    </View>
                                ) : null}
                                {city ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <MapPin size={12} color={outOfTown ? COLORS.amber : COLORS.text5} strokeWidth={1.8} />
                                        <Text style={{ fontSize: 11, color: outOfTown ? COLORS.amber : COLORS.text4 }} numberOfLines={1}>
                                            {outOfTown ? `${city} · out of town` : city}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        ) : null}
                    </View>
                </View>

                {coverNote ? (
                    <Text numberOfLines={2} style={{ fontSize: 11.5, color: COLORS.text3, lineHeight: 17, marginTop: 11 }}>
                        <Text style={{ color: COLORS.orangeTint }}>“</Text>
                        {coverNote}
                        <Text style={{ color: COLORS.orangeTint }}>”</Text>
                    </Text>
                ) : null}
            </View>

            {/* footer — per stage, or the Passed / Undo row (kept lit) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13, justifyContent: 'flex-end' }}>
                {isPassed ? (
                    <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <X size={11} color={COLORS.text4} strokeWidth={2} />
                            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8.5, letterSpacing: 0.8, color: COLORS.text4, textTransform: 'uppercase' }}>Passed</Text>
                        </View>
                        <View style={{ flex: 1 }} />
                        <GhostBtn label="Undo" accessibilityLabel={`Undo pass for ${displayName}`} tint={COLORS.orangeTint} border="rgba(255,107,53,0.3)" icon={Undo2} onPress={call(onUndoPass)} />
                    </>
                ) : status === 'shortlisted' ? (
                    <PrimaryBtn label="Hire" accessibilityLabel={`Hire ${displayName}`} icon={Check} onPress={call(onHire)} />
                ) : status === 'hired' ? (
                    <>
                        {onMessage ? <GhostBtn label="Message" accessibilityLabel={`Message ${displayName}`} tint={COLORS.text2} border={COLORS.passBorder} icon={MessageSquare} onPress={call(onMessage)} /> : null}
                        {onRemove ? <GhostBtn label="Remove" accessibilityLabel={`Remove ${displayName}`} tint={COLORS.red} border="rgba(240,101,107,0.3)" icon={X} onPress={call(onRemove)} /> : null}
                    </>
                ) : (
                    <>
                        <GhostBtn label="Pass" accessibilityLabel={`Pass ${displayName}`} tint={COLORS.text2} border={COLORS.passBorder} onPress={call(onPass)} />
                        <PrimaryBtn label="Shortlist" accessibilityLabel={`Shortlist ${displayName}`} onPress={call(onShortlist)} />
                    </>
                )}
            </View>
        </TouchableOpacity>
    );
}

function PrimaryBtn({ label, accessibilityLabel, icon: Icon, onPress }: { label: string; accessibilityLabel: string; icon?: any; onPress: (e: any) => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityLabel={accessibilityLabel}
            hitSlop={6}
            style={{
                height: 32, paddingHorizontal: 13, borderRadius: 9,
                backgroundColor: COLORS.orange,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            {Icon ? <Icon size={13} color={COLORS.onOrange} strokeWidth={2.4} /> : null}
            <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 11.5, color: COLORS.onOrange, letterSpacing: 0.2 }}>{label}</Text>
        </TouchableOpacity>
    );
}

function GhostBtn({ label, accessibilityLabel, tint, border, icon: Icon, onPress }: { label: string; accessibilityLabel: string; tint: string; border: string; icon?: any; onPress: (e: any) => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityLabel={accessibilityLabel}
            hitSlop={6}
            style={{
                height: 32, paddingHorizontal: 13, borderRadius: 9,
                borderWidth: 1, borderColor: border, backgroundColor: 'transparent',
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            {Icon ? <Icon size={13} color={tint} strokeWidth={2} /> : null}
            <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 11.5, color: tint }}>{label}</Text>
        </TouchableOpacity>
    );
}
