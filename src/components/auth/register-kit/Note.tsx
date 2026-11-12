// register-kit/Note.tsx — inline helper note (muted / accent / warn)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RK, RK_FONT } from './theme';
import { useAccent } from './AccentContext';

export function Note({
    children, variant = 'muted', icon,
}: {
    children: React.ReactNode;
    variant?: 'muted' | 'accent' | 'warn';
    icon?: React.ReactNode;
}) {
    const accent = useAccent();
    const palette =
        variant === 'accent' ? { bg: accent.soft, fg: accent.border }
        : variant === 'warn' ? { bg: 'rgba(245,158,11,0.08)', fg: '#E3B55F' }
        : { bg: 'rgba(255,255,255,0.03)', fg: RK.dim };

    return (
        <View style={[s.box, { backgroundColor: palette.bg }]}>
            {icon ? <View style={s.icon}>{icon}</View> : null}
            <Text style={[s.text, { color: palette.fg }]}>{children}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    box: { flexDirection: 'row', gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8 },
    icon: { marginTop: 1 },
    text: { flex: 1, fontFamily: RK_FONT.body, fontSize: 11, lineHeight: 16 },
});
