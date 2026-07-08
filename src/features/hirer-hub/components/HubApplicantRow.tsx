// src/features/hirer-hub/components/HubApplicantRow.tsx
//
// Gig-hub redesign v1 — applicant CARD. Bordered surface, serif-initial
// avatar, name + ★rating, "type · yrs · time-ago" sub. New (status='applied')
// applicants get a warm "fresh" treatment. Quick Reject (neutral X) + Hire
// (orange ✓); Shortlist + View profile live in the action sheet (tap body).
// See DOCS/04-design/mockups/gig-hub-redesign-v1.html.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text2: '#6B6878', gold: '#F59E0B', orange: '#FF6B35',
    surface: '#0D0B12', line: 'rgba(243,239,232,0.07)', freshBorder: 'rgba(255,107,53,0.28)',
    avatarIdle: '#26222C',
};

function timeAgo(iso?: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
}

type Props = {
    application: any;
    onTap?: (applicationId: string) => void;
    onQuickHire?: (applicationId: string) => void;
    onQuickReject?: (applicationId: string) => void;
};

export function HubApplicantRow({ application, onTap, onQuickHire, onQuickReject }: Props) {
    const displayName = ((application.artistSnapshot?.displayName ?? '') as string).trim() || 'Anonymous';
    const initial = (displayName[0] || 'A').toUpperCase();
    const isFresh = application.status === 'applied';
    const rating = application.artistSnapshot?.rating;
    const exp = application.artistSnapshot?.experience;
    const sub = [
        application.artistSnapshot?.artistType,
        exp ? `${exp} yrs` : null,
        timeAgo(application.appliedAt) || null,
    ].filter(Boolean).join(' · ');

    const stopAndCall = (handler?: (id: string) => void) => (e: any) => {
        e?.stopPropagation?.();
        handler?.(application._id);
    };

    return (
        <TouchableOpacity
            onPress={() => onTap?.(application._id)}
            accessibilityLabel={`Open applicant ${displayName}`}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                padding: 14,
                marginBottom: 10,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isFresh ? COLORS.freshBorder : COLORS.line,
                backgroundColor: COLORS.surface,
            }}>
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: isFresh ? COLORS.orange : COLORS.avatarIdle,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: isFresh ? '#160A04' : COLORS.text0 }}>
                    {initial}
                </Text>
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 14.5, color: COLORS.text0 }} numberOfLines={1}>
                        {displayName}
                    </Text>
                    {rating ? (
                        <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 11, color: COLORS.gold }}>★ {rating}</Text>
                    ) : null}
                </View>
                <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 3 }} numberOfLines={1}>
                    {sub || '—'}
                </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 7 }}>
                {onQuickReject && (
                    <TouchableOpacity
                        onPress={stopAndCall(onQuickReject)}
                        accessibilityLabel={`Reject ${displayName}`}
                        hitSlop={6}
                        style={{
                            width: 38, height: 38, borderRadius: 12,
                            borderWidth: 1, borderColor: 'rgba(243,239,232,0.12)',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                        <X size={16} color={COLORS.text2} strokeWidth={2.2} />
                    </TouchableOpacity>
                )}
                {onQuickHire && (
                    <TouchableOpacity
                        onPress={stopAndCall(onQuickHire)}
                        accessibilityLabel={`Hire ${displayName}`}
                        hitSlop={6}
                        style={{
                            width: 38, height: 38, borderRadius: 12,
                            backgroundColor: COLORS.orange,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                        <Check size={16} color="#160A04" strokeWidth={3} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
}
