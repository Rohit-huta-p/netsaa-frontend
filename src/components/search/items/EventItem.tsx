// src/components/search/items/EventItem.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

interface EventItemProps {
    item: any;
    onPress?: () => void;
}

const GOLD = '#D4A155';

export const EventItem = ({ item, onPress }: EventItemProps) => {
    const [hover, setHover] = useState(false);

    const d = item.date ? new Date(item.date) : null;
    const month =
        d && !isNaN(d.getTime()) ? d.toLocaleString('default', { month: 'short' }).toUpperCase() : '';
    const day = d && !isNaN(d.getTime()) ? d.getDate() : '';

    const meta: string[] = [];
    if (item.eventType) meta.push(String(item.eventType));
    if (typeof item.attendeeCount === 'number') meta.push(`${item.attendeeCount} attending`);

    const webHover =
        Platform.OS === 'web'
            ? {
                  onMouseEnter: () => setHover(true),
                  onMouseLeave: () => setHover(false),
              }
            : {};

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            {...(webHover as any)}
            style={{
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(212, 161, 85, 0.10)',
                backgroundColor: hover ? 'rgba(212, 161, 85, 0.04)' : 'transparent',
            }}
            className="flex-row items-center py-4 px-1"
        >
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: hover ? GOLD : 'rgba(212, 161, 85, 0.25)',
                    backgroundColor: 'rgba(212, 161, 85, 0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Text
                    className="font-mono text-[9px] tracking-widest"
                    style={{ color: GOLD, marginBottom: -1 }}
                >
                    {month}
                </Text>
                <Text className="font-serif text-white text-lg leading-none" style={{ marginTop: 2 }}>
                    {day}
                </Text>
            </View>
            <View className="flex-1 ml-4">
                <Text className="font-outfit-semibold text-white text-[15px]" numberOfLines={1}>
                    {item.title}
                </Text>
                {meta.length > 0 ? (
                    <Text
                        className="font-outfit text-zinc-500 text-[12px] mt-0.5"
                        numberOfLines={1}
                        style={{ letterSpacing: 0.2 }}
                    >
                        {meta.join(' · ')}
                    </Text>
                ) : null}
            </View>
            <Text
                className="font-mono text-[9px] tracking-widest"
                style={{ color: GOLD, opacity: hover ? 1 : 0.4 }}
            >
                EVENT
            </Text>
        </TouchableOpacity>
    );
};
