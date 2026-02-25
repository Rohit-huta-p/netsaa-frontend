import React from 'react';
import { Text, View, StyleSheet, Linking } from 'react-native';

/**
 * Lightweight Markdown renderer for NETSA dark theme.
 * Handles: headers (h1-h3), bold, italic, code, links, bullet lists, paragraphs.
 */
interface MarkdownViewerProps {
    content: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
    const lines = content.split('\n');

    const renderLine = (line: string, index: number) => {
        const trimmed = line.trim();

        if (!trimmed) return <View key={index} style={{ height: 8 }} />;

        if (trimmed.startsWith('### ')) {
            return (
                <Text key={index} style={styles.h3}>
                    {renderInline(trimmed.slice(4))}
                </Text>
            );
        }
        if (trimmed.startsWith('## ')) {
            return (
                <Text key={index} style={styles.h2}>
                    {renderInline(trimmed.slice(3))}
                </Text>
            );
        }
        if (trimmed.startsWith('# ')) {
            return (
                <Text key={index} style={styles.h1}>
                    {renderInline(trimmed.slice(2))}
                </Text>
            );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
                <View key={index} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.body}>{renderInline(trimmed.slice(2))}</Text>
                </View>
            );
        }

        return (
            <Text key={index} style={styles.body}>
                {renderInline(trimmed)}
            </Text>
        );
    };

    const renderInline = (text: string): React.ReactNode => {
        const parts: React.ReactNode[] = [];
        let key = 0;

        const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }

            if (match[2]) {
                parts.push(
                    <Text key={`b${key++}`} style={{ fontWeight: '700', color: '#FFFFFF' }}>
                        {match[2]}
                    </Text>
                );
            } else if (match[4]) {
                parts.push(
                    <Text key={`i${key++}`} style={{ fontStyle: 'italic' }}>
                        {match[4]}
                    </Text>
                );
            } else if (match[6]) {
                parts.push(
                    <Text
                        key={`c${key++}`}
                        style={{
                            fontFamily: 'monospace',
                            backgroundColor: 'rgba(199, 125, 255, 0.1)',
                            color: '#C77DFF',
                            paddingHorizontal: 4,
                            borderRadius: 4,
                        }}
                    >
                        {match[6]}
                    </Text>
                );
            } else if (match[8] && match[9]) {
                parts.push(
                    <Text
                        key={`l${key++}`}
                        style={{ color: '#EA698B', textDecorationLine: 'underline' }}
                        onPress={() => Linking.openURL(match[9])}
                    >
                        {match[8]}
                    </Text>
                );
            }

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    return (
        <View style={{ gap: 4 }}>
            {lines.map((line, i) => renderLine(line, i))}
        </View>
    );
};

const styles = StyleSheet.create({
    h1: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 16, marginBottom: 8, fontFamily: 'Outfit_800ExtraBold' },
    h2: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 14, marginBottom: 6, fontFamily: 'Outfit_700Bold' },
    h3: { fontSize: 17, fontWeight: '600', color: '#E0AAFF', marginTop: 12, marginBottom: 4, fontFamily: 'Outfit_600SemiBold' },
    body: { fontSize: 15, color: '#a1a1aa', lineHeight: 24, fontFamily: 'Outfit_400Regular' },
    bulletRow: { flexDirection: 'row', paddingLeft: 8, gap: 8 },
    bullet: { fontSize: 15, color: '#C77DFF', lineHeight: 24 },
});

export default MarkdownViewer;
