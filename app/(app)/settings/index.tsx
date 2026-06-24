// app/(app)/settings/index.tsx
import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useSettings } from '@/hooks/useSettings';
import { useAuthStore } from '@/stores/authStore';
import {
    Shield,
    Bell,
    MessageCircle,
    UserCog,
    Lock,
    Repeat,
    AlertTriangle,
    Link2,
    BadgeCheck,
    ToggleRight,
    LogOut,
} from 'lucide-react-native';

/* ── Types ── */
type SectionItem = {
    key: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    route: string;
    danger?: boolean;
    /** If set, item only renders for the listed roles. If omitted, renders for ALL roles. */
    roles?: string[];
};

type Section = {
    title: string;
    items: SectionItem[];
};

/* ── Declarative config ──
 * Add role-specific items by setting `roles: ['artist']` or `roles: ['organizer']`.
 * Items without `roles` are visible to everyone.
 * When new roles are added, just add the role string — no code changes elsewhere.
 */
const SECTIONS: Section[] = [
    // {
    //     title: 'Preferences',
    //     items: [
    //         // { key: 'privacy', label: 'Privacy', description: 'Profile visibility & data sharing', icon: Shield, route: '/(app)/settings/privacy' },
    //         // { key: 'notifications', label: 'Notifications', description: 'Email, push & marketing', icon: Bell, route: '/(app)/settings/notifications' },
    //         // { key: 'messaging', label: 'Messaging', description: 'Who can message you', icon: MessageCircle, route: '/(app)/settings/messaging' },
    //         // { key: 'account', label: 'Account', description: 'Language, timezone & currency', icon: UserCog, route: '/(app)/settings/account' },
    //     ],
    // },
    // {
    //     title: 'Artist',
    //     items: [
    //         { key: 'portfolio', label: 'Portfolio Link', description: 'External portfolio or website', icon: Link2, route: '/(app)/settings/account', roles: ['artist'] },
    //     ],
    // },
    // {
    //     title: 'Organizer',
    //     items: [
    //         { key: 'verification', label: 'Business Verification', description: 'Verify your organization', icon: BadgeCheck, route: '/(app)/settings/security', roles: ['organizer'] },
    //         { key: 'autoclose', label: 'Auto-Close Gigs', description: 'Close gigs after deadline', icon: ToggleRight, route: '/(app)/settings/account', roles: ['organizer'] },
    //     ],
    // },
    {
        title: 'Account',
        items: [
            { key: 'role', label: 'Switch Role', description: 'Client, Creative Lead or Artist', icon: Repeat, route: '/(app)/settings/role' },
        ],
    },
    {
        title: 'Security',
        items: [
            { key: 'security', label: 'Security', description: 'Password & two-factor auth', icon: Lock, route: '/(app)/settings/security' },
        ],
    },
    {
        title: 'Account Actions',
        items: [
            { key: 'logout', label: 'Sign Out', description: 'Log out of your account', icon: LogOut, route: '', danger: true },
            { key: 'danger', label: 'Danger Zone', description: 'Deactivate or delete account', icon: AlertTriangle, route: '/(app)/settings/danger', danger: true },
        ],
    },
];

/* ── Filter helper ──
 * Filters sections + items to only those the current role can see.
 * Sections with no visible items are hidden entirely.
 */
function filterSectionsForRole(sections: Section[], role: string | undefined): Section[] {
    return sections
        .map((section) => ({
            ...section,
            items: section.items.filter((item) =>
                !item.roles || (role && item.roles.includes(role))
            ),
        }))
        .filter((section) => section.items.length > 0);
}

export default function SettingsIndex() {
    const router = useRouter();
    const { isLoading } = useSettings();
    const userRole = useAuthStore((s) => s.user?.role);

    const visibleSections = useMemo(
        () => filterSectionsForRole(SECTIONS, userRole),
        [userRole],
    );

    return (
        <>
            <Stack.Screen options={{ title: 'Settings' }} />
            <View className="flex-1 bg-[#09090b]">
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#A855F7" />
                    </View>
                ) : (
                    <AppScrollView>
                        {visibleSections.map((section) => (
                            <View key={section.title} className="mt-6">
                                <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                                    {section.title}
                                </Text>
                                <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                                    {section.items.map((item) => (
                                        <SettingRow
                                            key={item.key}
                                            type={item.danger ? 'danger' : 'nav'}
                                            label={item.label}
                                            description={item.description}
                                            icon={<item.icon size={20} color={item.danger ? '#f87171' : '#a78bfa'} />}
                                            onPress={() => {
                                                if (item.key === 'logout') {
                                                    useAuthStore.getState().clearAuth();
                                                    router.push('/');
                                                } else {
                                                    router.push(item.route as any);
                                                }
                                            }}
                                        />
                                    ))}
                                </View>
                            </View>
                        ))}
                    </AppScrollView>
                )}
            </View>
        </>
    );
}
