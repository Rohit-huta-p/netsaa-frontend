import React from 'react';
import { View, Text, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, Calendar, Users, Heart } from 'lucide-react-native';

/**
 * Mobile bottom tab navigation bar
 * Visible only on mobile screens (< 768px width)
 * Shows 4 tabs: Gigs, Events, Connections, Saved
 */

interface TabItem {
    key: string;
    label: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    route: string;
}

const tabs: TabItem[] = [
    { key: 'gigs', label: 'Gigs', icon: Briefcase, route: '/(app)/gigs' },
    { key: 'events', label: 'Events', icon: Calendar, route: '/(app)/events' },
    { key: 'connections', label: 'Connections', icon: Users, route: '/(app)/connections' },
    { key: 'saved', label: 'Saved', icon: Heart, route: '/(app)/saved' },
];

const ACTIVE_COLOR = '#ff006e';
const INACTIVE_COLOR = '#71717a';
const MOBILE_BREAKPOINT = 768;

export default function MobileTabBar() {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    // Hide on desktop (width >= 768px)
    if (width >= MOBILE_BREAKPOINT) {
        return null;
    }

    const isActive = (route: string) => {
        // Check if current path starts with the route path (handles nested routes)
        const routePath = route.replace('/(app)', '');
        return pathname.startsWith(routePath);
    };

    const handleTabPress = (route: string) => {
        router.push(route as any);
    };

    return (
        <View
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#09090b',
                borderTopWidth: 1,
                borderTopColor: 'rgba(255, 255, 255, 0.1)',
                paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
                paddingTop: 8,
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
            }}
        >
            {tabs.map((tab) => {
                const active = isActive(tab.route);
                const IconComponent = tab.icon;

                return (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => handleTabPress(tab.route)}
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 4,
                        }}
                        activeOpacity={0.7}
                    >
                        {/* Active indicator bar */}
                        {active && (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: -8,
                                    width: 32,
                                    height: 3,
                                    backgroundColor: ACTIVE_COLOR,
                                    borderRadius: 2,
                                }}
                            />
                        )}

                        <IconComponent
                            size={22}
                            color={active ? ACTIVE_COLOR : INACTIVE_COLOR}
                        />
                        <Text
                            style={{
                                fontSize: 11,
                                marginTop: 4,
                                color: active ? ACTIVE_COLOR : INACTIVE_COLOR,
                                fontFamily: active ? 'Outfit-SemiBold' : 'Outfit-Regular',
                            }}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
