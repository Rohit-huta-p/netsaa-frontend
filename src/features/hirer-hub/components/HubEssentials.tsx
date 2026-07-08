// src/features/hirer-hub/components/HubEssentials.tsx
//
// Gig-hub redesign v1 — editorial "Essentials" block: always-visible hairline
// rows with icons (When / Where / Scope / Posted) + an "Edit gig" link.
// See DOCS/04-design/mockups/gig-hub-redesign-v1.html.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar, MapPin, FileText, Clock } from 'lucide-react-native';

const COLORS = { text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', orange: '#FF6B35', line: 'rgba(243,239,232,0.07)' };

type Props = {
    eventDate?: string;
    venue?: string;
    city?: string;
    scope?: string;
    postedDate?: string;
    onEditGig?: () => void;
};

function fmtEvent(iso?: string): string {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
    catch { return '—'; }
}
function fmtPosted(iso?: string): string {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return '—'; }
}

function Row({ icon: Icon, label, value, sub, last }: { icon: any; label: string; value: string; sub?: string; last?: boolean }) {
    return (
        <View
            style={{
                flexDirection: 'row',
                gap: 14,
                paddingVertical: 15,
                borderBottomWidth: last ? 0 : 1,
                borderBottomColor: COLORS.line,
                alignItems: 'flex-start',
            }}>
            <View style={{ width: 24, paddingTop: 1 }}>
                <Icon size={18} color={COLORS.text2} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: COLORS.text2, fontWeight: '600' }}>
                    {label}
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.text0, marginTop: 3, lineHeight: 20, fontWeight: '500' }}>
                    {value}
                    {sub ? <Text style={{ color: COLORS.text2, fontWeight: '400' }}>  {sub}</Text> : null}
                </Text>
            </View>
        </View>
    );
}

export function HubEssentials({ eventDate, venue, city, scope, postedDate, onEditGig }: Props) {
    return (
        <View style={{ paddingTop: 28, paddingHorizontal: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 23, color: COLORS.text0, letterSpacing: -0.4 }}>
                    Essentials
                </Text>
                {onEditGig && (
                    <TouchableOpacity onPress={onEditGig} accessibilityLabel="Edit gig" hitSlop={8}>
                        <Text style={{ fontSize: 12, color: COLORS.orange, fontFamily: 'Outfit-Bold' }}>Edit gig</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View>
                <Row icon={Calendar} label="When" value={fmtEvent(eventDate)} />
                <Row
                    icon={MapPin}
                    label="Where"
                    value={venue || city || '—'}
                    sub={venue && city ? `· ${city}` : undefined}
                />
                {scope ? <Row icon={FileText} label="Scope" value={scope} /> : null}
                <Row icon={Clock} label="Posted" value={fmtPosted(postedDate)} last />
            </View>
        </View>
    );
}
