import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text2: '#6B6878', bg: '#16161F', green: '#22C55E',
};

type Props = {
    application: any;
    onHire?: (applicationId: string) => void;
    onTap?: (applicationId: string) => void;
};

export function HubApplicantRow({ application, onHire, onTap }: Props) {
    const displayName = ((application.artistSnapshot?.displayName ?? '') as string).trim() || 'Anonymous';
    const initials = displayName
        .split(/\s+/).map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'A';

    const matchScore = application.matchScore;
    const stats = [
        application.artistSnapshot?.artistType,
        application.artistSnapshot?.rating ? `${application.artistSnapshot.rating}★` : null,
        application.artistSnapshot?.experience ? `${application.artistSnapshot.experience}y` : null,
    ].filter(Boolean).join(' · ');

    return (
        <TouchableOpacity
            onPress={() => onTap?.(application._id)}
            style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center',
            }}>
                <Text style={{ color: COLORS.text0, fontWeight: '700', fontSize: 12 }}>{initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: COLORS.text0, fontWeight: '700', fontSize: 14 }}>
                    {displayName}
                </Text>
                <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {matchScore ? `${matchScore}% · ` : ''}{stats || '—'}
                </Text>
            </View>
            {onHire && (
                <TouchableOpacity
                    onPress={(e) => { e?.stopPropagation?.(); onHire(application._id); }}
                    accessibilityLabel={`Hire ${displayName}`}>
                    <Text style={{ color: COLORS.green, fontWeight: '700', fontSize: 12 }}>Hire</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}
