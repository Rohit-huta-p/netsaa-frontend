// src/features/contract-workspace/components/ContractDocuments.tsx
//
// Horizontal PDF chip list. Tap → Linking.openURL if URL present.

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { FileText, Download } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35', green: '#22C55E',
};

type Doc = { label: string; url?: string; date?: string };

type Props = { documents: Doc[] };

function comingSoon() {
    Alert.alert('Coming soon', 'Document downloads ship in a follow-up release.');
}

export function ContractDocuments({ documents }: Props) {
    const handlePress = (url?: string) => {
        if (!url) {
            comingSoon();
            return;
        }
        Linking.openURL(url).catch(() => Alert.alert('Could not open', 'The document URL is invalid.'));
    };

    if (documents.length === 0) return null;

    return (
        <View style={{ paddingTop: 28 }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>Documents</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {documents.length} {documents.length === 1 ? 'file' : 'files'}
                </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
                {documents.map((d, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => handlePress(d.url)}
                        accessibilityLabel={`Download ${d.label}`}
                        style={{
                            paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
                            backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line,
                            flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 200,
                        }}>
                        <View style={{
                            width: 36, height: 36, borderRadius: 10,
                            backgroundColor: 'rgba(255,107,53,0.10)',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <FileText size={14} color={COLORS.orange} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: COLORS.text0, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{d.label}</Text>
                            {d.date && (
                                <Text style={{ color: COLORS.text2, fontSize: 10, fontFamily: 'SpaceMono-Regular', marginTop: 2 }}>
                                    {d.date}
                                </Text>
                            )}
                        </View>
                        <Download size={14} color={COLORS.text2} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}
