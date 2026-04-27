// src/features/hirer-hub/components/HubApplicantRow.tsx
//
// Compact applicant row. Tap row body → onTap (opens action sheet in parent).
// Two quick buttons on the right: Reject (X) + Hire (✓). Shortlist + View
// profile live in the action sheet.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text2: '#6B6878', bg: '#16161F',
    green: '#22C55E', red: '#EF4444',
};

type Props = {
    application: any;
    onTap?: (applicationId: string) => void;
    onQuickHire?: (applicationId: string) => void;
    onQuickReject?: (applicationId: string) => void;
};

export function HubApplicantRow({ application, onTap, onQuickHire, onQuickReject }: Props) {
    const displayName = ((application.artistSnapshot?.displayName ?? '') as string).trim() || 'Anonymous';
    const initials = displayName.split(/\s+/).map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'A';

    const matchScore = application.matchScore;
    const stats = [
        application.artistSnapshot?.artistType,
        application.artistSnapshot?.rating ? `${application.artistSnapshot.rating}★` : null,
        application.artistSnapshot?.experience ? `${application.artistSnapshot.experience}y` : null,
    ].filter(Boolean).join(' · ');

    const stopAndCall = (handler?: (id: string) => void) => (e: any) => {
        e?.stopPropagation?.();
        handler?.(application._id);
    };

    return (
        <TouchableOpacity
            onPress={() => onTap?.(application._id)}
            accessibilityLabel={`Open applicant ${displayName}`}
            style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center',
            }}>
                <Text style={{ color: COLORS.text0, fontWeight: '700', fontSize: 12 }}>{initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: COLORS.text0, fontWeight: '700', fontSize: 14 }}>{displayName}</Text>
                <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {matchScore != null ? `${matchScore}% · ` : ''}{stats || '—'}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
                {onQuickReject && (
                    <TouchableOpacity
                        onPress={stopAndCall(onQuickReject)}
                        accessibilityLabel={`Reject ${displayName}`}
                        style={{
                            width: 32, height: 32, borderRadius: 10,
                            backgroundColor: 'rgba(239,68,68,0.10)',
                            borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                        <X size={14} color={COLORS.red} strokeWidth={2.5} />
                    </TouchableOpacity>
                )}
                {onQuickHire && (
                    <TouchableOpacity
                        onPress={stopAndCall(onQuickHire)}
                        accessibilityLabel={`Hire ${displayName}`}
                        style={{
                            width: 32, height: 32, borderRadius: 10,
                            backgroundColor: COLORS.green,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                        <Check size={14} color="#0A0A0F" strokeWidth={3} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
}
