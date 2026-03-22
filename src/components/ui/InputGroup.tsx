import React from 'react';
import { View, Text } from 'react-native';
import { Typography, getLineHeight } from '@/constants/Typography';
const T = Typography;

interface InputGroupProps {
    label: string;
    children: React.ReactNode;
    required?: boolean;
    subtitle?: string;
    error?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, children, required, subtitle, error }) => (
    <View className="mb-6 space-y-2">
        <View className="flex-col justify-between items-baseline mb-2">
            <Text
                style={{
                    fontSize: T.size.xs,
                    fontWeight: T.weight.medium as any,
                    color: '#d4d4d8', // zinc-300
                    lineHeight: getLineHeight('secondary', 'tight')
                }}
            >
                {label} {required && <Text style={{ color: '#f43f5e' }}>*</Text>}
            </Text>
            {subtitle && (
                <Text
                    style={{
                        fontSize: T.size.xs,
                        color: '#71717a', // zinc-500
                        marginLeft: 8
                    }}
                >
                    {subtitle}
                </Text>
            )}
        </View>
        {children}
        {error && (
            <Text
                style={{
                    fontSize: T.size.xs,
                    color: '#f43f5e', // rose-500
                    marginTop: 4
                }}
            >
                {error}
            </Text>
        )}
    </View>
);
