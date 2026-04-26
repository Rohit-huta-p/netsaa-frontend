// src/features/hirer-hub/components/HubEssentials.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

const COLORS = { text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', orange: '#FF6B35', line: 'rgba(255,255,255,0.05)' };

type Props = {
    eventDate?: string;
    venue?: string;
    city?: string;
    scope?: string;
    postedDate?: string;
    onEditGig?: () => void;
};

export function HubEssentials({ eventDate, venue, city, scope, postedDate, onEditGig }: Props) {
    const [open, setOpen] = useState(false);

    const fmt = (iso?: string) => {
        if (!iso) return '—';
        try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
        catch { return '—'; }
    };

    return (
        <View style={{ paddingTop: 28, paddingHorizontal: 24 }}>
            <TouchableOpacity onPress={() => setOpen((o) => !o)} style={{ paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text1, letterSpacing: -0.3 }}>
                    Gig essentials
                </Text>
                <ChevronRight
                    size={16}
                    color={COLORS.text2}
                    style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}
                />
            </TouchableOpacity>

            {open && (
                <View style={{ paddingTop: 16, gap: 16 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <View style={{ width: '50%', marginBottom: 16 }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Event</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>{fmt(eventDate)}</Text>
                        </View>
                        <View style={{ width: '50%', marginBottom: 16 }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Venue</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>{venue || '—'}</Text>
                            <Text style={{ fontSize: 12, color: COLORS.text2 }}>{city || ''}</Text>
                        </View>
                        <View style={{ width: '50%' }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Posted</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>{fmt(postedDate)}</Text>
                        </View>
                    </View>
                    {scope ? (
                        <View>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Scope</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text1, marginTop: 6, lineHeight: 22 }}>{scope}</Text>
                        </View>
                    ) : null}
                    {onEditGig && (
                        <TouchableOpacity onPress={onEditGig}>
                            <Text style={{ fontSize: 12, color: COLORS.orange, fontWeight: '700' }}>Edit gig →</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}
