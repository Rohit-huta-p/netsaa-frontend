import React from 'react';
import { View, Text, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, Calendar, Users, Heart, LayoutDashboard } from 'lucide-react-native';
import useAuthStore from '@/stores/authStore';

// Tab bar height constants for consistent bottom padding across the app
export const TAB_BAR_BASE_HEIGHT = 56; // Icon + label + padding
export const MOBILE_BREAKPOINT = 768;

/**
 * Mobile bottom tab navigation bar
 * Visible only on mobile screens (< 768px width)
 * Shows 4-5 tabs based on user role: Dashboard (organizer), Gigs, Events, Network, Saved
 */

interface TabItem {
    key: string;
    label: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    route: string;
    organizerOnly?: boolean;
    activeColor?: string;
}

const baseTabs: TabItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/(app)/dashboard', organizerOnly: true, activeColor: '#FF6B35' },
    { key: 'gigs', label: 'Gigs', icon: Briefcase, route: '/(app)/gigs' },
    { key: 'events', label: 'Events', icon: Calendar, route: '/(app)/events' },
    { key: 'connections', label: 'Network', icon: Users, route: '/(app)/connections' },
    { key: 'saved', label: 'Saved', icon: Heart, route: '/(app)/saved' },
];

const ACTIVE_COLOR = '#ff006e';
const INACTIVE_COLOR = '#71717a';

/**
 * Hook to get the mobile tab bar height including safe area insets
 * Use this to add bottom padding to scrollable content on pages
 * Returns 0 on desktop (width >= 768px)
 */
export function useMobileTabBarHeight() {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    if (width >= MOBILE_BREAKPOINT) {
        return 0; // No tab bar on desktop
    }

    // TAB_BAR_BASE_HEIGHT + safe area bottom inset (iOS) or 8px (Android)
    const bottomPadding = Platform.OS === 'ios' ? insets.bottom : 8;
    return TAB_BAR_BASE_HEIGHT + bottomPadding;
}

export default function MobileTabBar() {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const user = useAuthStore((state) => state.user);

    const isOrganizer = user?.role === 'organizer' || user?.roles?.includes('organizer');

    // Filter tabs based on user role
    const tabs = baseTabs.filter(tab => !tab.organizerOnly || isOrganizer);

    // Hide on desktop (width >= 768px) OR if on /create page
    if (width >= MOBILE_BREAKPOINT || pathname.startsWith('/create')) {
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
                const tabActiveColor = tab.activeColor || ACTIVE_COLOR;

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
                                    backgroundColor: tabActiveColor,
                                    borderRadius: 2,
                                }}
                            />
                        )}

                        <IconComponent
                            size={22}
                            color={active ? tabActiveColor : INACTIVE_COLOR}
                        />
                        <Text
                            style={{
                                fontSize: 11,
                                marginTop: 4,
                                color: active ? tabActiveColor : INACTIVE_COLOR,
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
