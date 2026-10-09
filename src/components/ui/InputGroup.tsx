import React from 'react';
import { View, Text } from 'react-native';

interface InputGroupProps {
    label: string;
    children: React.ReactNode;
    required?: boolean;
    subtitle?: string;
    error?: string;
}

// GigForm v2 type hierarchy: the field name is a real title (prominent,
// bright) with the helper text tucked beneath it, so the form reads as titled
// sections rather than a stack of boxes. Input wells / values stay lighter
// (never bold). Shared app-wide — also affects Event/profile forms.
export const InputGroup: React.FC<InputGroupProps> = ({ label, children, required, subtitle, error }) => (
    <View style={{ marginBottom: 22 }}>
        <Text
            style={{
                fontFamily: 'Outfit-SemiBold',
                fontSize: 15,
                color: '#F0F0F2',
                letterSpacing: -0.2,
            }}
        >
            {label}
            {required ? <Text style={{ color: '#FF6B35' }}> *</Text> : null}
        </Text>
        {subtitle ? (
            <Text
                style={{
                    fontFamily: 'Outfit-Regular',
                    fontSize: 11.5,
                    color: '#7A7A86',
                    marginTop: 3,
                }}
            >
                {subtitle}
            </Text>
        ) : null}
        <View style={{ marginTop: 10 }}>{children}</View>
        {error ? (
            <Text style={{ fontSize: 12, color: '#f43f5e', marginTop: 4 }}>{error}</Text>
        ) : null}
    </View>
);
