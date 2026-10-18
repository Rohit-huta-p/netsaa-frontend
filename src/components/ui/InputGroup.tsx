import React from 'react';
import { View, Text } from 'react-native';
import { TEXT, FONT, ACCENT, STATUS } from '@/constants/formTokens';

interface InputGroupProps {
    label: string;
    children: React.ReactNode;
    required?: boolean;
    subtitle?: string;
    error?: string;
}

// Shared form field wrapper (gig + event forms, profile editors). Type
// hierarchy: the field name is a real title (prominent, bright) with the
// helper text tucked beneath it, so the form reads as titled sections rather
// than a stack of boxes. Input wells / values stay lighter (never bold).
// Colors come from the shared formTokens system.
export const InputGroup: React.FC<InputGroupProps> = ({ label, children, required, subtitle, error }) => (
    <View style={{ marginBottom: 22 }}>
        <Text
            style={{
                fontFamily: FONT.semibold,
                fontSize: 15,
                color: TEXT.label,
                letterSpacing: -0.2,
            }}
        >
            {label}
            {required ? <Text style={{ color: ACCENT.primary }}> *</Text> : null}
        </Text>
        {subtitle ? (
            <Text
                style={{
                    fontFamily: FONT.regular,
                    fontSize: 11.5,
                    color: TEXT.helper,
                    marginTop: 3,
                }}
            >
                {subtitle}
            </Text>
        ) : null}
        <View style={{ marginTop: 10 }}>{children}</View>
        {error ? (
            <Text style={{ fontSize: 12, color: STATUS.error, marginTop: 4 }}>{error}</Text>
        ) : null}
    </View>
);
