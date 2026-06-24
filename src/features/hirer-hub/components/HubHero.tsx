import React from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';

type Props = {
    title: string;
    status?: string; // 'draft' | 'published' | 'closed' | 'paused'
    eventFunction?: string;
    city?: string;
    startDate?: string;
    /** When false, the status pill is hidden here (parent renders it in the header row). */
    showStatus?: boolean;
};

export const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: '#6B6878' },
    published: { label: 'Live', color: '#22C55E' },
    closed: { label: 'Closed', color: '#EF4444' },
    paused: { label: 'Paused', color: '#F59E0B' },
};

// Editorial hero (gig-hub redesign v1): status pill → orange eyebrow →
// DM Serif title → location/date submeta with a pin. See
// DOCS/designs/gig-hub-redesign-v1.html.
function formatHeroDate(iso?: string): string {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

export function HubHero({ title, status, eventFunction, city, startDate, showStatus = true }: Props) {
    const statusInfo = STATUS_LABEL[status ?? ''] ?? STATUS_LABEL.published;
    const eyebrow = eventFunction ? eventFunction.toUpperCase() : null;
    const dateStr = formatHeroDate(startDate);
    const submeta = [city, dateStr].filter(Boolean).join('   ·   ');

    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36 }}>
            {/* status pill — hidden when the parent renders it in the header row */}
            {showStatus && (
                <View style={{ flexDirection: 'row', marginBottom: 18 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            borderRadius: 999,
                            backgroundColor: `${statusInfo.color}1A`,
                            borderWidth: 1,
                            borderColor: `${statusInfo.color}38`,
                        }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusInfo.color }} />
                        <Text style={{ color: statusInfo.color, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>
            )}

            {/* eyebrow — gig type / function */}
            {eyebrow ? (
                <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', color: '#FF6B35', marginBottom: 10 }}>
                    {eyebrow}
                </Text>
            ) : null}

            {/* title */}
            <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 36, lineHeight: 38, color: '#F3EFE8', letterSpacing: -0.8 }}>
                {title}
            </Text>

            {/* submeta — where · when */}
            {submeta ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 }}>
                    <MapPin size={14} color="#6B6878" />
                    <Text style={{ color: '#B8B1A6', fontSize: 13 }}>{submeta}</Text>
                </View>
            ) : null}
        </View>
    );
}
