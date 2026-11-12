// register-kit/StepHeader.tsx — Space-Mono eyebrow + DM-Serif headline + Outfit sub
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RK, RK_FONT } from './theme';

export function StepHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
    return (
        <View style={s.wrap}>
            {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
            <Text style={s.title}>{title}</Text>
            {sub ? <Text style={s.sub}>{sub}</Text> : null}
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { marginBottom: 22 },
    eyebrow: { fontFamily: RK_FONT.mono, fontSize: 9.5, letterSpacing: 2.2, color: RK.muted, marginBottom: 10 },
    title: { fontFamily: RK_FONT.serif, fontSize: 27, lineHeight: 31, color: RK.cream, letterSpacing: -0.3 },
    sub: { fontFamily: RK_FONT.body, fontSize: 12.5, lineHeight: 18, color: RK.muted, marginTop: 8 },
});
