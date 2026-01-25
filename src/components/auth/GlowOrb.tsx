// src/components/auth/GlowOrb.tsx
import React from "react";
import { View, Platform } from "react-native";

const isWeb = Platform.OS === "web";

interface GlowOrbProps {
    color: string;
    size: number;
    top: number;
    left: number | string;
    blur: number;
}

/** Glowing orb decoration for background depth */
export const GlowOrb = ({ color, size, top, left, blur }: GlowOrbProps) => (
    <View
        style={{
            position: 'absolute',
            top,
            left: typeof left === 'string' ? undefined : left,
            right: typeof left === 'string' ? 0 : undefined,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: 0.15,
            ...(isWeb ? { filter: `blur(${blur}px)` } : {}),
        }}
    />
);
