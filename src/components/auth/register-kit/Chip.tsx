// register-kit/Chip.tsx — selectable pill (selected = accent). Also a dashed "add" variant.
import React from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { RK, RK_FONT } from './theme';
import { useAccent } from './AccentContext';

export function Chip({
    label, selected, onPress, dashed, style,
}: {
    label: string;
    selected?: boolean;
    onPress?: () => void;
    dashed?: boolean;
    style?: ViewStyle;
}) {
    const accent = useAccent();
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                s.chip,
                dashed && s.dashed,
                selected && { backgroundColor: accent.base, borderColor: accent.base },
                pressed && { opacity: 0.85 },
                style,
            ]}
        >
            <Text style={[s.label, selected && { color: accent.on }, dashed && s.dashedLabel]}>{label}</Text>
        </Pressable>
    );
}

const s = StyleSheet.create({
    chip: {
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9,
        backgroundColor: RK.surface, borderWidth: 1, borderColor: RK.hair,
    },
    dashed: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: RK.hair2 },
    label: { fontFamily: RK_FONT.body, fontSize: 11.5, color: RK.muted },
    dashedLabel: { color: RK.dim },
});
