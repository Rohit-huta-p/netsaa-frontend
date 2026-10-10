// src/components/inputs/RichTextInput.tsx
//
// Reusable rich-text input with a formatting toolbar. Drop it into any form in
// place of a multiline <TextInput>: same `value` / `onChangeText` contract, but
// the toolbar lets the user tap to format the selected text. It stores and
// returns a **Markdown string** (Route A):
//   **bold**, *italic*, "- " bullets, "1. " numbered, "> " quotes.
//
// To SHOW the formatting, render that string with a Markdown renderer wherever
// the text is displayed (e.g. the existing MarkdownViewer). While EDITING, the
// raw marks are visible — a plain RN <TextInput> can't style ranges inline.
//
// Exports:
//   • RichTextInput (default)      — the field + toolbar, imperatively focusable
//   • FormattingToolbar            — the bar alone, if you wire your own input
//   • applyFormat(text, sel, act)  — the pure Markdown transform (testable)
import { forwardRef, useImperativeHandle, useRef, useState, type ComponentProps } from 'react';
import {
    View, TextInput, Pressable, StyleSheet,
    type TextStyle, type ViewStyle, type StyleProp,
} from 'react-native';
import { Bold, Italic, List, ListOrdered, Quote } from 'lucide-react-native';

export type FormatAction = 'bold' | 'italic' | 'bullet' | 'number' | 'quote';
type Sel = { start: number; end: number };

const INLINE_MARK: Partial<Record<FormatAction, string>> = { bold: '**', italic: '*' };
const LIST_PREFIX_RE = /^(- |\d+\. |> )/; // any existing block prefix, for switching types

// ── Pure Markdown transforms ──────────────────────────────────────────────
export function applyFormat(text: string, sel: Sel, action: FormatAction): { text: string; selection: Sel } {
    const mark = INLINE_MARK[action];
    return mark ? toggleInline(text, sel, mark) : toggleBlock(text, sel, action);
}

function toggleInline(text: string, sel: Sel, m: string): { text: string; selection: Sel } {
    const { start, end } = sel;
    const selected = text.slice(start, end);
    const before = text.slice(0, start);
    const after = text.slice(end);
    const L = m.length;

    // Already wrapped, marks inside the selection → unwrap.
    if (selected.length >= 2 * L && selected.startsWith(m) && selected.endsWith(m)) {
        const inner = selected.slice(L, selected.length - L);
        return { text: before + inner + after, selection: { start, end: start + inner.length } };
    }
    // Marks sit just outside the selection → unwrap.
    if (before.endsWith(m) && after.startsWith(m)) {
        return { text: before.slice(0, -L) + selected + after.slice(L), selection: { start: start - L, end: end - L } };
    }
    // Empty selection → drop a pair, place the cursor between the marks.
    if (start === end) {
        return { text: before + m + m + after, selection: { start: start + L, end: start + L } };
    }
    // Wrap the selection.
    return { text: before + m + selected + m + after, selection: { start: start + L, end: end + L } };
}

function toggleBlock(text: string, sel: Sel, action: FormatAction): { text: string; selection: Sel } {
    const { start, end } = sel;
    // Expand the selection to whole lines.
    const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    let lineEnd = text.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = text.length;

    const block = text.slice(lineStart, lineEnd);
    const lines = block.split('\n');
    const matcher = action === 'bullet' ? /^- / : action === 'number' ? /^\d+\. / : /^> /;
    const nonEmpty = lines.filter((l) => l.trim() !== '');
    const allHave = nonEmpty.length > 0 && nonEmpty.every((l) => matcher.test(l));

    let out: string[];
    if (allHave) {
        out = lines.map((l) => l.replace(matcher, '')); // toggle OFF
    } else {
        let n = 0;
        out = lines.map((l) => {
            if (l.trim() === '') return l;
            const bare = l.replace(LIST_PREFIX_RE, ''); // strip any other list type first
            n += 1;
            const prefix = action === 'bullet' ? '- ' : action === 'number' ? `${n}. ` : '> ';
            return prefix + bare;
        });
    }
    const newBlock = out.join('\n');
    const newText = text.slice(0, lineStart) + newBlock + text.slice(lineEnd);
    return { text: newText, selection: { start: lineStart, end: lineStart + newBlock.length } };
}

// ── Toolbar ────────────────────────────────────────────────────────────────
const DEFAULT_ACTIONS: FormatAction[] = ['bold', 'italic', 'bullet', 'number', 'quote'];
const ICONS: Record<FormatAction, typeof Bold> = { bold: Bold, italic: Italic, bullet: List, number: ListOrdered, quote: Quote };
const LABELS: Record<FormatAction, string> = { bold: 'Bold', italic: 'Italic', bullet: 'Bulleted list', number: 'Numbered list', quote: 'Quote' };

export function FormattingToolbar({ onAction, actions = DEFAULT_ACTIONS, style, iconColor = '#D4D4D8' }: {
    onAction: (a: FormatAction) => void;
    actions?: FormatAction[];
    style?: StyleProp<ViewStyle>;
    iconColor?: string;
}) {
    return (
        <View style={[st.bar, style]}>
            {actions.map((a) => {
                const Icon = ICONS[a];
                return (
                    <Pressable
                        key={a}
                        onPress={() => onAction(a)}
                        accessibilityRole="button"
                        accessibilityLabel={LABELS[a]}
                        hitSlop={6}
                        style={({ pressed }) => [st.btn, pressed && st.btnPressed]}
                    >
                        <Icon size={17} color={iconColor} />
                    </Pressable>
                );
            })}
        </View>
    );
}

// ── Field ────────────────────────────────────────────────────────────────
export interface RichTextInputHandle { focus: () => void; blur: () => void; }

export interface RichTextInputProps {
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    minHeight?: number;
    maxLength?: number;
    autoFocus?: boolean;
    editable?: boolean;
    /** Which toolbar buttons to show, in order. Defaults to all five. */
    actions?: FormatAction[];
    toolbarPosition?: 'top' | 'bottom';
    /** Only render the toolbar while the field is focused. */
    showToolbarOnFocusOnly?: boolean;
    style?: StyleProp<ViewStyle>;      // outer container
    inputStyle?: StyleProp<TextStyle>; // the TextInput
    onFocus?: ComponentProps<typeof TextInput>['onFocus'];
    onBlur?: ComponentProps<typeof TextInput>['onBlur'];
}

export const RichTextInput = forwardRef<RichTextInputHandle, RichTextInputProps>(function RichTextInput({
    value, onChangeText, placeholder, placeholderTextColor = '#71717A',
    minHeight = 120, maxLength, autoFocus, editable = true,
    actions = DEFAULT_ACTIONS, toolbarPosition = 'top', showToolbarOnFocusOnly = false,
    style, inputStyle, onFocus, onBlur,
}, ref) {
    const inputRef = useRef<TextInput>(null);
    const selRef = useRef<Sel>({ start: 0, end: 0 });
    // We only drive the `selection` prop right after a programmatic format,
    // then release it — so normal typing isn't controlled (avoids cursor jumps,
    // especially on Android).
    const [forcedSel, setForcedSel] = useState<Sel | null>(null);
    const [focused, setFocused] = useState(false);

    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        blur: () => inputRef.current?.blur(),
    }));

    const onAction = (a: FormatAction) => {
        const { text, selection } = applyFormat(value, selRef.current, a);
        onChangeText(text);
        selRef.current = selection;
        setForcedSel(selection);
        // Tapping a toolbar button can blur the field on iOS — keep the keyboard.
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    const toolbar = (!showToolbarOnFocusOnly || focused) ? (
        <FormattingToolbar
            onAction={onAction}
            actions={actions}
            style={toolbarPosition === 'bottom' ? st.barBottom : st.barTop}
        />
    ) : null;

    return (
        <View style={[st.wrap, style]}>
            {toolbarPosition === 'top' && toolbar}
            <TextInput
                ref={inputRef}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={placeholderTextColor}
                multiline
                editable={editable}
                autoFocus={autoFocus}
                maxLength={maxLength}
                selection={forcedSel ?? undefined}
                onSelectionChange={(e) => {
                    selRef.current = e.nativeEvent.selection;
                    if (forcedSel) setForcedSel(null);
                }}
                onFocus={(e) => { setFocused(true); onFocus?.(e); }}
                onBlur={(e) => { setFocused(false); onBlur?.(e); }}
                textAlignVertical="top"
                style={[st.input, { minHeight }, inputStyle]}
            />
            {toolbarPosition === 'bottom' && toolbar}
        </View>
    );
});

const st = StyleSheet.create({
    wrap: { borderWidth: 1, borderColor: '#2A2A30', borderRadius: 12, backgroundColor: '#0E0E13', overflow: 'hidden' },
    input: { paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Outfit-Regular', fontSize: 14, color: '#E5E5E5', lineHeight: 21 },
    bar: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 5, backgroundColor: '#121216' },
    barTop: { borderBottomWidth: 1, borderBottomColor: '#1F1F23' },
    barBottom: { borderTopWidth: 1, borderTopColor: '#1F1F23' },
    btn: { width: 34, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    btnPressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
});

export default RichTextInput;
