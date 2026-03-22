import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, TextInputProps } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import gigService from '@/services/gigService';

interface AITextInputProps extends TextInputProps {
    label?: string;
    onRephrased?: (newText: string) => void;
    containerStyle?: any;
}

export const AITextInput: React.FC<AITextInputProps> = ({
    label,
    value,
    onChangeText,
    onRephrased,
    style,
    containerStyle,
    ...props
}) => {
    const [isRephrasing, setIsRephrasing] = useState(false);

    const handleRephrase = async () => {
        if (!value?.trim()) return;
        setIsRephrasing(true);
        try {
            const result = await gigService.rephraseText(value);
            if (result && result.rephrased) {
                if (onRephrased) {
                    onRephrased(result.rephrased);
                } else if (onChangeText) {
                    onChangeText(result.rephrased);
                }
            }
        } catch (error) {
            console.error("AI Rephrase failed:", error);
        } finally {
            setIsRephrasing(false);
        }
    };

    return (
        <View style={[{ gap: 4 }, containerStyle]}>
            {label && <Text className="text-zinc-400 text-[12px] uppercase font-bold tracking-widest ml-1">{label}</Text>}
            <View style={{
                borderRadius: 12,
                backgroundColor: "#18181bcc",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                overflow: 'hidden',
            }}>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    style={[{
                        minHeight: 100,
                        color: "#fff",
                        padding: 14,
                        fontSize: 14,
                        textAlignVertical: 'top',
                        outlineStyle: 'none',
                    } as any, style]}
                    multiline
                    placeholderTextColor="#52525b"
                    {...props}
                />
                {/* Rephrase with AI - Moves with content */}
                <View style={{
                    padding: 8,
                    borderTopWidth: 1,
                    borderColor: "rgba(255,255,255,0.05)",
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    backgroundColor: "rgba(255,255,255,0.02)",
                }}>
                    <TouchableOpacity
                        onPress={handleRephrase}
                        disabled={isRephrasing || !value?.trim()}
                        style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 100,
                            borderWidth: 1,
                            backgroundColor: !value?.trim() ? 'rgba(79,70,229,0.05)' : 'rgba(79,70,229,0.15)',
                            borderColor: !value?.trim() ? 'rgba(79,70,229,0.1)' : 'rgba(79,70,229,0.3)',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {isRephrasing ? (
                            <ActivityIndicator size="small" color="#818cf8" />
                        ) : (
                            <Sparkles size={12} color={!value?.trim() ? "#4f46e580" : "#818cf8"} />
                        )}
                        <Text style={{
                            fontSize: 10,
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            color: !value?.trim() ? 'rgba(129,140,248,0.4)' : '#818cf8',
                        }}>
                            {isRephrasing ? 'AI Magic...' : 'Rephrase with AI'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
