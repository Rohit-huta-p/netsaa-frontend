// src/components/inputs/MarkdownText.tsx
//
// Tiny, themeable Markdown renderer — the read-side pair to RichTextInput.
// Covers exactly the subset that toolbar produces: **bold**, *italic*,
// "- " bullets, "1. " numbered lists, "> " quotes, and plain paragraphs.
// No dependencies; styled via props so it fits anywhere (a compact Featured
// card, a roomy About block, …).
import { type ReactNode } from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

export interface MarkdownTextProps {
    value: string;
    color?: string;
    size?: number;
    lineHeight?: number;
    font?: string;      // regular family
    boldFont?: string;  // bold family (custom fonts rarely synthesize weight)
    accent?: string;    // bullet dot / quote bar
    blockGap?: number;  // vertical space between blocks
    style?: StyleProp<ViewStyle>;
    numberOfLines?: number; // clamp (best-effort; applies per text block)
}

type Block =
    | { kind: 'p'; text: string }
    | { kind: 'ul'; items: string[] }
    | { kind: 'ol'; items: string[] }
    | { kind: 'quote'; text: string };

const isUl = (l: string) => /^- +/.test(l);
const isOl = (l: string) => /^\d+\. +/.test(l);
const isQuote = (l: string) => /^> ?/.test(l);

function parseBlocks(src: string): Block[] {
    const lines = (src || '').replace(/\r\n/g, '\n').split('\n');
    const blocks: Block[] = [];
    let i = 0;
    while (i < lines.length) {
        const l = lines[i];
        if (l.trim() === '') { i++; continue; }
        if (isUl(l)) {
            const items: string[] = [];
            while (i < lines.length && isUl(lines[i])) { items.push(lines[i].replace(/^- +/, '')); i++; }
            blocks.push({ kind: 'ul', items });
        } else if (isOl(l)) {
            const items: string[] = [];
            while (i < lines.length && isOl(lines[i])) { items.push(lines[i].replace(/^\d+\. +/, '')); i++; }
            blocks.push({ kind: 'ol', items });
        } else if (isQuote(l)) {
            const qs: string[] = [];
            while (i < lines.length && isQuote(lines[i])) { qs.push(lines[i].replace(/^> ?/, '')); i++; }
            blocks.push({ kind: 'quote', text: qs.join('\n') });
        } else {
            const ps: string[] = [];
            while (i < lines.length && lines[i].trim() !== '' && !isUl(lines[i]) && !isOl(lines[i]) && !isQuote(lines[i])) {
                ps.push(lines[i]); i++;
            }
            blocks.push({ kind: 'p', text: ps.join('\n') });
        }
    }
    return blocks;
}

// Inline: **bold** and *italic* (bold wins when nested isn't used).
function renderInline(text: string, boldFont: string): ReactNode[] {
    const out: ReactNode[] = [];
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let last = 0;
    let key = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) out.push(text.slice(last, m.index));
        const tok = m[0];
        if (tok.startsWith('**')) {
            out.push(<Text key={key++} style={{ fontFamily: boldFont, fontWeight: '700' }}>{tok.slice(2, -2)}</Text>);
        } else {
            out.push(<Text key={key++} style={{ fontStyle: 'italic' }}>{tok.slice(1, -1)}</Text>);
        }
        last = m.index + tok.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
}

export function MarkdownText({
    value,
    color = '#C9C4CC',
    size = 13,
    lineHeight = 20,
    font = 'Outfit-Regular',
    boldFont = 'Outfit-Bold',
    accent = '#FF6B35',
    blockGap = 8,
    style,
    numberOfLines,
}: MarkdownTextProps) {
    if (!value?.trim()) return null;
    const blocks = parseBlocks(value);
    const base = { fontFamily: font, fontSize: size, color, lineHeight };

    return (
        <View style={style}>
            {blocks.map((b, bi) => {
                const mt = bi === 0 ? 0 : blockGap;
                if (b.kind === 'p') {
                    return (
                        <Text key={bi} style={[base, { marginTop: mt }]} numberOfLines={numberOfLines}>
                            {renderInline(b.text, boldFont)}
                        </Text>
                    );
                }
                if (b.kind === 'quote') {
                    return (
                        <View key={bi} style={[st.quote, { marginTop: mt, borderLeftColor: accent }]}>
                            <Text style={[base, { fontStyle: 'italic', color }]}>{renderInline(b.text, boldFont)}</Text>
                        </View>
                    );
                }
                // ul / ol
                return (
                    <View key={bi} style={{ marginTop: mt }}>
                        {b.items.map((it, ii) => (
                            <View key={ii} style={st.liRow}>
                                <Text style={[base, { color: accent, width: b.kind === 'ol' ? 20 : 14 }]}>
                                    {b.kind === 'ol' ? `${ii + 1}.` : '•'}
                                </Text>
                                <Text style={[base, { flex: 1 }]}>{renderInline(it, boldFont)}</Text>
                            </View>
                        ))}
                    </View>
                );
            })}
        </View>
    );
}

const st = StyleSheet.create({
    liRow: { flexDirection: 'row', gap: 7, paddingRight: 2 },
    quote: { borderLeftWidth: 2, paddingLeft: 10 },
});

export default MarkdownText;
