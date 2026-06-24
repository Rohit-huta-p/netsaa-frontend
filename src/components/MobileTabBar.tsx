import React from 'react';
import { View, Text, TouchableOpacity, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Briefcase, Calendar, Plus, Search, User } from 'lucide-react-native';
import useAuthStore from '@/stores/authStore';

export const TAB_BAR_BASE_HEIGHT = 56;
export const MOBILE_BREAKPOINT = 768;

interface TabItem {
    key: string;
    label: string;
    icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
    route: string;
    isCreate?: boolean;
}

const baseTabs: TabItem[] = [
    { key: 'gigs', label: 'Gigs', icon: Briefcase, route: '/(app)/gigs' },
    { key: 'events', label: 'Events', icon: Calendar, route: '/(app)/events' },
    { key: 'create', label: 'Post', icon: Plus, route: '/(app)/create', isCreate: true },
    { key: 'search', label: 'Search', icon: Search, route: '/(app)/search' },
    { key: 'profile', label: 'Profile', icon: User, route: '/(app)/profile' },
];

const ACTIVE_COLOR = '#F97316';
const INACTIVE_COLOR = '#6B6878';

export function useMobileTabBarHeight() {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    if (width >= MOBILE_BREAKPOINT) return 0;
    const bottomPadding = Platform.OS === 'ios' ? insets.bottom : 8;
    return TAB_BAR_BASE_HEIGHT + bottomPadding;
}

export default function MobileTabBar() {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    if (width >= MOBILE_BREAKPOINT || pathname.startsWith('/create')) {
        return null;
    }

    const isActive = (route: string) => {
        const routePath = route.replace('/(app)', '');
        return pathname.startsWith(routePath);
    };

    return (
        <View style={[styles.bar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8 }]}>
            {baseTabs.map((tab) => {
                const active = isActive(tab.route);

                if (tab.isCreate) {
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => router.push(tab.route as any)}
                            style={styles.createWrap}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#EC4899', '#F97316']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.createBtn}
                            >
                                <Plus size={24} color="#fff" strokeWidth={2.5} />
                            </LinearGradient>
                            <Text style={styles.createLabel}>Post</Text>
                        </TouchableOpacity>
                    );
                }

                return (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => router.push(tab.route as any)}
                        style={styles.tab}
                        activeOpacity={0.7}
                    >
                        {active && <View style={[styles.activeBar, { backgroundColor: ACTIVE_COLOR }]} />}
                        <tab.icon size={22} color={active ? ACTIVE_COLOR : INACTIVE_COLOR} />
                        <Text style={[styles.tabLabel, { color: active ? ACTIVE_COLOR : INACTIVE_COLOR, fontFamily: active ? 'Outfit-SemiBold' : 'Outfit-Regular' }]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0A0A10',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    activeBar: {
        position: 'absolute',
        top: -8,
        width: 32,
        height: 3,
        borderRadius: 2,
    },
    tabLabel: {
        fontSize: 11,
        marginTop: 4,
    },
    createWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 0,
        marginTop: -12,
    },
    createBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    createLabel: {
        fontSize: 10,
        marginTop: 4,
        color: INACTIVE_COLOR,
        fontFamily: 'Outfit-Regular',
    },
});
