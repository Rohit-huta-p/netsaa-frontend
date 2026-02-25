// src/components/auth/StepInput.tsx
// Reusable text input for registration steps
import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { REG_COLORS as C } from '@/constants/registration';

export interface StepInputProps extends Omit<TextInputProps, 'style'> {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    icon?: React.ReactNode;
    error?: boolean;
}

export const StepInput = ({ label, value, onChangeText, icon, error, ...props }: StepInputProps) => (
    <View style={{ marginBottom: 16 }}>
        <Text style={{ color: C.w30, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>{label}</Text>
        <View style={{
            flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 16,
            borderWidth: 1, borderColor: error ? 'rgba(239,68,68,0.5)' : C.w08,
            backgroundColor: C.w03, paddingHorizontal: icon ? 0 : 16,
        }}>
            {icon && <View style={{ paddingLeft: 14, paddingRight: 6 }}>{icon}</View>}
            <TextInput
                value={value} onChangeText={onChangeText}
                placeholderTextColor={C.w15}
                className="outline-none"
                style={{ flex: 1, color: C.w80, fontSize: 15, paddingHorizontal: icon ? 8 : 0, height: '100%' }}
                {...props}
            />
        </View>
    </View>
);
