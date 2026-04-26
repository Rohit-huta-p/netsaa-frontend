import React from 'react';
import { View, Text } from 'react-native';

type Props = {
    title: string;
    status?: string; // 'draft' | 'published' | 'closed' | 'paused'
    eventFunction?: string;
    city?: string;
    startDate?: string;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: '#6B6878' },
    published: { label: 'Live', color: '#22C55E' },
    closed: { label: 'Closed', color: '#EF4444' },
    paused: { label: 'Paused', color: '#F59E0B' },
};

function formatShortDate(iso?: string): string {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

export function HubHero({ title, status, eventFunction, city, startDate }: Props) {
    const statusInfo = STATUS_LABEL[status ?? ''] ?? STATUS_LABEL.published;
    const dateStr = formatShortDate(startDate);
    const meta = [eventFunction, city, dateStr].filter(Boolean).join(' · ');

    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 3,
                        paddingHorizontal: 9,
                        borderRadius: 999,
                        backgroundColor: `${statusInfo.color}1A`,
                    }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusInfo.color }} />
                    <Text style={{ color: statusInfo.color, fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                        {statusInfo.label}
                    </Text>
                </View>
                <Text style={{ color: '#6B6878', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {meta}
                </Text>
            </View>
            <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 36, lineHeight: 38, color: '#F3EFE8', letterSpacing: -0.6 }}>
                {title}
            </Text>
        </View>
    );
}
