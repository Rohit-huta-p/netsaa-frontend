// src/components/search/items/GigItem.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Briefcase } from 'lucide-react-native';

interface GigItemProps {
    item: any;
    onPress?: () => void;
}

const ORANGE = '#FF6B35';
const GOLD = '#D4A155';

export const GigItem = ({ item, onPress }: GigItemProps) => {
    const [hover, setHover] = useState(false);

    const meta: string[] = [];
    if (item.organizerName) meta.push(String(item.organizerName));
    if (item.city) meta.push(String(item.city));
    if (item.createdAt) {
        try {
            meta.push(new Date(item.createdAt).toLocaleDateString());
        } catch {
            /* skip */
        }
    }

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
                backgroundColor: hover ? 'rgba(255, 107, 53, 0.03)' : 'transparent',
                // Subtle orange left rail on hover — "live gig" feel
                borderLeftWidth: 2,
                borderLeftColor: hover ? ORANGE : 'transparent',
                paddingLeft: 12,
            }}
            className="flex-row items-center py-4 pr-1"
        >
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 107, 53, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 107, 53, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Briefcase size={18} color={ORANGE} strokeWidth={1.5} />
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
                style={{ color: hover ? ORANGE : GOLD, opacity: hover ? 1 : 0.4 }}
            >
                GIG
            </Text>
        </TouchableOpacity>
    );
};
