// src/features/contract-workspace/components/ContractDocuments.tsx
//
// Horizontal PDF chip list. Tap → Linking.openURL if URL present, else
// fall back to on-device PDF generation via the parent-supplied callback.

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking, ActivityIndicator } from 'react-native';
import { FileText, Download } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35', green: '#22C55E',
};

type Doc = { label: string; url?: string; date?: string };

type Props = {
    documents: Doc[];
    onGeneratePdf?: () => Promise<void> | void;
    isGeneratingPdf?: boolean;
};

export function ContractDocuments({ documents, onGeneratePdf, isGeneratingPdf }: Props) {
    const handlePress = (url?: string) => {
        if (url) {
            Linking.openURL(url).catch(() => Alert.alert('Could not open', 'The document URL is invalid.'));
            return;
        }
        if (onGeneratePdf) {
            onGeneratePdf();
            return;
        }
        Alert.alert('Coming soon', 'Document downloads ship in a follow-up release.');
    };

    if (documents.length === 0 && !onGeneratePdf) return null;

    if (documents.length === 0 && onGeneratePdf) {
        return (
            <View style={{ paddingTop: 28 }}>
                <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>Documents</Text>
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>0 files</Text>
                </View>
                <View style={{ paddingHorizontal: 24 }}>
                    <TouchableOpacity
                        onPress={onGeneratePdf}
                        disabled={isGeneratingPdf}
                        accessibilityLabel="Generate contract PDF"
                        style={{
                            paddingVertical: 16, borderRadius: 12,
                            backgroundColor: 'rgba(255,107,53,0.08)',
                            borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,107,53,0.30)',
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                            opacity: isGeneratingPdf ? 0.5 : 1,
                        }}>
                        {isGeneratingPdf
                            ? <ActivityIndicator size="small" color={COLORS.orange} />
                            : <FileText size={14} color={COLORS.orange} />}
                        <Text style={{ color: COLORS.orange, fontSize: 13, fontWeight: '700' }}>
                            {isGeneratingPdf ? 'Generating…' : 'Generate contract PDF'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={{ paddingTop: 28 }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>Documents</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {documents.length} {documents.length === 1 ? 'file' : 'files'}
                </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
                {documents.map((d, i) => {
                    const showSpinner = isGeneratingPdf && i === 0 && !d.url;
                    return (
                        <TouchableOpacity
                            key={i}
                            onPress={() => handlePress(d.url)}
                            disabled={showSpinner}
                            accessibilityLabel={`Download ${d.label}`}
                            style={{
                                paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
                                backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line,
                                flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 200,
                                opacity: showSpinner ? 0.6 : 1,
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
                            {showSpinner
                                ? <ActivityIndicator size="small" color={COLORS.orange} />
                                : <Download size={14} color={COLORS.text2} />}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}
