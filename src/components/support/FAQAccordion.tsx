import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQAccordionProps {
    items: FAQItem[];
    accentColor?: string;
}

const FAQAccordion: React.FC<FAQAccordionProps> = ({ items, accentColor = '#C77DFF' }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggle = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <View style={{ gap: 8 }}>
            {items.map((item, index) => {
                const isExpanded = expandedIndex === index;
                return (
                    <View
                        key={index}
                        style={{
                            backgroundColor: isExpanded ? 'rgba(157, 78, 221, 0.08)' : '#18181b',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: isExpanded ? 'rgba(199, 125, 255, 0.25)' : 'rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => toggle(index)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 16,
                            }}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={{
                                    flex: 1,
                                    fontSize: 15,
                                    fontWeight: '600',
                                    color: isExpanded ? '#C77DFF' : '#FFFFFF',
                                    marginRight: 12,
                                    fontFamily: 'Outfit_600SemiBold',
                                }}
                            >
                                {item.question}
                            </Text>
                            <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={isExpanded ? '#C77DFF' : '#71717a'}
                            />
                        </TouchableOpacity>

                        {isExpanded && (
                            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                                <Text style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 22, fontFamily: 'Outfit_400Regular' }}>
                                    {item.answer}
                                </Text>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
};

export default FAQAccordion;
