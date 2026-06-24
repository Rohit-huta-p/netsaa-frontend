// src/components/ui/GradientText.tsx
//
// Landing-page gradient text, reusable across in-app screens.
// Mirrors the MaskedView + LinearGradient idiom established in
// src/components/landing/HeroSection.tsx, but packaged so callers
// don't have to repeat the (verbose) mask-element dance.
//
//   <GradientText style={{ fontFamily: LANDING.fonts.serif, fontSize: 28 }}>
//     planning?
//   </GradientText>
//
// Defaults to the brand pink→orange→gold sweep from landingTheme.ts.
import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { LANDING } from '@/constants/landingTheme';

interface GradientTextProps {
    children: React.ReactNode;
    style?: StyleProp<TextStyle>;
    colors?: readonly [string, string, ...string[]];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
}

export function GradientText({
    children,
    style,
    colors = LANDING.gradient.colorsFull,
    start = { x: 0, y: 0 },
    end = { x: 1, y: 0 },
}: GradientTextProps) {
    return (
        <MaskedView maskElement={<Text style={style}>{children}</Text>}>
            <LinearGradient colors={colors} start={start} end={end}>
                {/* The hidden text sizes the gradient to the glyphs. */}
                <Text style={[style, { opacity: 0 }]}>{children}</Text>
            </LinearGradient>
        </MaskedView>
    );
}
