import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, useWindowDimensions, Animated, StyleProp, ViewStyle, TouchableOpacity, ScrollView } from 'react-native';
import { twMerge } from "tailwind-merge";

export interface TabOption {
    key: string;
    title: string;
}

interface SegmentedTabsProps {
    tabs: TabOption[];
    activeTab: string;
    onTabChange: (key: string) => void;
    containerStyle?: StyleProp<ViewStyle>;
}

export function SegmentedTabs({
    tabs,
    activeTab,
    onTabChange,
    containerStyle
}: SegmentedTabsProps) {
    const layout = useWindowDimensions();
    console.log('[SegmentedTabs] Rendering', { activeTab, tabsCount: tabs.length });

    return (
        <View style={[containerStyle, { width: '100%' }]}>
            <View style={{ flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 16 }}>
                {tabs.map((tab) => {
                    const isActive = tab.key === activeTab;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => {
                                console.log('[SegmentedTabs] Pressing tab:', tab.key);
                                onTabChange(tab.key);
                            }}
                            style={{
                                flex: 1,
                                paddingVertical: 8,
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isActive ? 'white' : 'transparent',
                                shadowColor: isActive ? '#000' : 'transparent',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: isActive ? 0.05 : 0,
                                shadowRadius: isActive ? 2 : 0,
                                elevation: isActive ? 1 : 0,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: isActive ? '#111827' : '#6b7280',
                                }}
                            >
                                {tab.title}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
