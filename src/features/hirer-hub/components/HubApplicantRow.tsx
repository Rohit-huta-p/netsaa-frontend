// src/features/hirer-hub/components/HubApplicantRow.tsx
//
// Manage-Gig applicant CARD — "D · compare line" (DOCS/04-design/mockups/
// applicant-card-D.html). One card across the whole pipeline; only the header
// treatment and the footer action change per stage:
//   applied / reviewed  →  Pass · Shortlist   (Pass is reversible — see below)
//   shortlisted         →  Hire
//   hired               →  Message · Remove
// Anatomy: avatar · name + craft chip + location pin · ★rating|New + time ·
// uniform skill chips (top-3 + "+N") · one-line pitch · portfolio chip + action.
// Location pin turns amber when the artist's city differs from the venue city
// ("out of town"). Fields come off the denormalised artistSnapshot (BE B1):
// artistType, rating, primaryCity (|| legacy `location`), specialities[],
// plus coverNote / portfolioLinks / appliedAt on the application.
//
// Reversible Pass: `isPassed` dims the card to 40% and swaps the footer for a
// "Passed" tag + Undo. The parent section keeps passed cards on screen for the
// session; the server flip is applied -> rejected (Pass) and rejected ->
// applied (Undo, enabled by netsaa-backend #15).

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, X, MapPin, Star, Link2, Undo2, MessageSquare } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#5C5A66',
    gold: '#F59E0B', orange: '#FF6B35', orangeTint: '#FFCBB2', amber: '#F0B65A',
    blue: '#8DC0FB', red: '#F0858A',
    surface: '#1C1C23', line: 'rgba(243,239,232,0.07)', freshBorder: 'rgba(255,107,53,0.28)',
    avatarIdle: '#26222C',
    chipBg: 'rgba(255,255,255,0.04)', chipLine: 'rgba(255,255,255,0.09)',
};

const MAX_SKILL_CHIPS = 3;

function timeAgoCompact(iso?: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.round(hrs / 24)}d`;
}

const sameCity = (a?: string, b?: string) =>
    !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

type Props = {
    application: any;
    venueCity?: string;
    isPassed?: boolean;
    onTap?: (applicationId: string) => void;
    onPass?: (applicationId: string) => void;
    onUndoPass?: (applicationId: string) => void;
    onShortlist?: (applicationId: string) => void;
    onHire?: (applicationId: string) => void;
    onMessage?: (applicationId: string) => void;
    onRemove?: (applicationId: string) => void;
};

export function HubApplicantRow({
    application, venueCity, isPassed,
    onTap, onPass, onUndoPass, onShortlist, onHire, onMessage, onRemove,
}: Props) {
    const snap = application.artistSnapshot ?? {};
    const displayName = ((snap.displayName ?? '') as string).trim() || 'Anonymous';
    const initial = (displayName[0] || 'A').toUpperCase();
    const status: string = application.status ?? 'applied';
    const isFresh = status === 'applied' && !isPassed;

    const artistType: string | undefined = snap.artistType;
    const city: string | undefined = snap.primaryCity ?? snap.location;
    const outOfTown = !!city && !!venueCity && !sameCity(city, venueCity);
    const rating: number | undefined = typeof snap.rating === 'number' && snap.rating > 0 ? snap.rating : undefined;

    const specialities: string[] = Array.isArray(snap.specialities) ? snap.specialities.filter(Boolean) : [];
    const shownSkills = specialities.slice(0, MAX_SKILL_CHIPS);
    const extraSkills = Math.max(0, specialities.length - MAX_SKILL_CHIPS);

    const coverNote: string = (application.coverNote ?? '').trim();
    const linkCount: number = Array.isArray(application.portfolioLinks) ? application.portfolioLinks.length : 0;

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
                padding: 14,
                marginBottom: 10,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isFresh ? COLORS.freshBorder : COLORS.line,
                backgroundColor: COLORS.surface,
            }}>
            {/* top + skills + pitch dim to 40% while passed; the footer stays lit */}
            <View style={{ opacity: isPassed ? 0.4 : 1 }} pointerEvents={isPassed ? 'none' : 'auto'}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                    <View style={{
                        width: 44, height: 44, borderRadius: 14,
                        backgroundColor: isFresh ? COLORS.orange : COLORS.avatarIdle,
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: isFresh ? '#160A04' : COLORS.text0 }}>
                            {initial}
                        </Text>
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 15, color: COLORS.text0, letterSpacing: -0.1 }} numberOfLines={1}>
                            {displayName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5, flexWrap: 'wrap' }}>
                            {artistType ? (
                                <View style={{
                                    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                                    backgroundColor: 'rgba(255,107,53,0.14)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.28)',
                                }}>
                                    <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8, letterSpacing: 0.8, color: COLORS.orangeTint, textTransform: 'uppercase' }}>
                                        {artistType}
                                    </Text>
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
                            {status === 'hired' ? (
                                <View style={{
                                    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                                    backgroundColor: 'rgba(34,197,94,0.10)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.28)',
                                }}>
                                    <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 7.5, letterSpacing: 0.8, color: '#6EE7A0', textTransform: 'uppercase' }}>
                                        Hired
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        {rating != null ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <Star size={13} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
                                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 16, color: COLORS.gold }}>{rating}</Text>
                            </View>
                        ) : (
                            <View style={{
                                paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                                backgroundColor: 'rgba(96,165,250,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)',
                            }}>
                                <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8, letterSpacing: 1, color: COLORS.blue, textTransform: 'uppercase' }}>New</Text>
                            </View>
                        )}
                        {timeAgoCompact(application.appliedAt) ? (
                            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8, color: COLORS.text3 }}>
                                {timeAgoCompact(application.appliedAt)}
                            </Text>
                        ) : null}
                    </View>
                </View>

                {shownSkills.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 11 }}>
                        {shownSkills.map((s, i) => (
                            <View key={`${s}-${i}`} style={{
                                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7,
                                backgroundColor: COLORS.chipBg, borderWidth: 1, borderColor: COLORS.chipLine,
                            }}>
                                <Text style={{ fontSize: 10, color: '#A1A1AA' }}>{s}</Text>
                            </View>
                        ))}
                        {extraSkills > 0 ? (
                            <View style={{
                                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7,
                                borderWidth: 1, borderColor: COLORS.chipLine, borderStyle: 'dashed',
                            }}>
                                <Text style={{ fontSize: 10, color: COLORS.text3 }}>+{extraSkills}</Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                {coverNote ? (
                    <Text style={{ fontSize: 11.5, color: COLORS.text2, marginTop: 11, lineHeight: 16 }} numberOfLines={1}>
                        {coverNote}
                    </Text>
                ) : null}
            </View>

            {/* footer — per stage, or the Passed/Undo row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 }}>
                {isPassed ? (
                    <>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 5,
                            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7,
                            backgroundColor: COLORS.chipBg, borderWidth: 1, borderColor: COLORS.chipLine,
                        }}>
                            <X size={10} color={COLORS.text3} strokeWidth={2.2} />
                            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8.5, letterSpacing: 0.8, color: COLORS.text2, textTransform: 'uppercase' }}>Passed</Text>
                        </View>
                        <View style={{ flex: 1 }} />
                        <GhostBtn label="Undo" accessibilityLabel={`Undo pass for ${displayName}`} tint={COLORS.orangeTint} border="rgba(255,107,53,0.3)" icon={Undo2} onPress={call(onUndoPass)} />
                    </>
                ) : (
                    <>
                        <PortfolioChip count={linkCount} />
                        <View style={{ flex: 1 }} />
                        {status === 'shortlisted' ? (
                            <PrimaryBtn label="Hire" accessibilityLabel={`Hire ${displayName}`} icon={Check} onPress={call(onHire)} />
                        ) : status === 'hired' ? (
                            <>
                                {onMessage ? <GhostBtn label="Message" accessibilityLabel={`Message ${displayName}`} tint={COLORS.text1} border={COLORS.chipLine} icon={MessageSquare} onPress={call(onMessage)} /> : null}
                                {onRemove ? <GhostBtn label="Remove" accessibilityLabel={`Remove ${displayName}`} tint={COLORS.red} border="rgba(240,101,107,0.3)" icon={X} onPress={call(onRemove)} /> : null}
                            </>
                        ) : (
                            <>
                                <GhostBtn label="Pass" accessibilityLabel={`Pass ${displayName}`} tint={COLORS.text1} border="#2E2E38" onPress={call(onPass)} />
                                <PrimaryBtn label="Shortlist" accessibilityLabel={`Shortlist ${displayName}`} onPress={call(onShortlist)} />
                            </>
                        )}
                    </>
                )}
            </View>
        </TouchableOpacity>
    );
}

function PortfolioChip({ count }: { count: number }) {
    const empty = count <= 0;
    const label = empty ? 'No links' : `${count} ${count === 1 ? 'link' : 'links'}`;
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
            backgroundColor: empty ? 'transparent' : COLORS.chipBg,
            borderWidth: 1, borderColor: COLORS.chipLine, borderStyle: empty ? 'dashed' : 'solid',
        }}>
            <Link2 size={11} color={empty ? COLORS.text3 : COLORS.text2} strokeWidth={1.8} />
            <Text style={{ fontSize: 9.5, color: empty ? COLORS.text3 : COLORS.text1 }}>{label}</Text>
        </View>
    );
}

function PrimaryBtn({ label, accessibilityLabel, icon: Icon, onPress }: { label: string; accessibilityLabel: string; icon?: any; onPress: (e: any) => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityLabel={accessibilityLabel}
            hitSlop={6}
            style={{
                height: 31, paddingHorizontal: 14, borderRadius: 9,
                backgroundColor: COLORS.orange,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            {Icon ? <Icon size={13} color="#160A04" strokeWidth={2.6} /> : null}
            <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 12.5, color: '#160A04', letterSpacing: 0.2 }}>{label}</Text>
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
                height: 31, paddingHorizontal: 13, borderRadius: 9,
                borderWidth: 1, borderColor: border, backgroundColor: 'transparent',
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            {Icon ? <Icon size={13} color={tint} strokeWidth={2} /> : null}
            <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 12, color: tint }}>{label}</Text>
        </TouchableOpacity>
    );
}
