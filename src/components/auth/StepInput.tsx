// src/components/auth/StepInput.tsx
// Reusable text input for registration steps
import React from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
const C = Colors.auth;

export interface StepInputProps extends Omit<TextInputProps, 'style'> {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    icon?: React.ReactNode;
    prefix?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconPress?: () => void;
    error?: boolean;
    hideLabel?: boolean;
}

export const StepInput = ({ 
    label, value, onChangeText, icon, prefix, rightIcon, onRightIconPress, error, hideLabel, ...props 
}: StepInputProps) => (
    <View style={{ marginBottom: 16 }}>
        {!hideLabel && <Text style={{ color: C.w30, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>{label}</Text>}
        <View style={{
            flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 16,
            borderWidth: 1, borderColor: error ? 'rgba(239,68,68,0.5)' : C.w08,
            backgroundColor: C.w03, paddingHorizontal: (icon || prefix) ? 0 : 16,
        }}>
            {icon && <View style={{ paddingLeft: 14, paddingRight: 6 }}>{icon}</View>}
            {prefix && <View style={{ paddingLeft: icon ? 0 : 14, paddingRight: 8 }}>{prefix}</View>}
            <TextInput
                value={value} onChangeText={onChangeText}
                placeholderTextColor={C.w15}
                className="outline-none"
                style={{ 
                    flex: 1, color: C.w80, fontSize: 15, 
                    paddingHorizontal: (icon || prefix) ? 8 : 16, 
                    height: '100%', outlineStyle: 'none' 
                } as any}
                {...props}
            />
            {rightIcon && (
                <TouchableOpacity 
                    onPress={onRightIconPress} 
                    disabled={!onRightIconPress}
                    style={{ paddingRight: 14, paddingLeft: 6 }}
                >
                    {rightIcon}
                </TouchableOpacity>
            )}
        </View>
    </View>
);
