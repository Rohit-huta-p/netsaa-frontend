// app/(app)/settings/notifications.tsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';

export default function NotificationSettings() {
    const { data: settings, isLoading } = useSettings();
    const { mutate: updateSettings } = useUpdateSettings();

    if (isLoading || !settings) {
        return (
            <>
                <Stack.Screen options={{ title: 'Notifications' }} />
                <View className="flex-1 bg-[#09090b] items-center justify-center">
                    <ActivityIndicator size="large" color="#A855F7" />
                </View>
            </>
        );
    }

    const n = settings.notifications;

    return (
        <>
            <Stack.Screen options={{ title: 'Notifications' }} />
            <View className="flex-1 bg-[#09090b]">
                <AppScrollView>
                    {/* Channels */}
                    <View className="mt-6">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Channels
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="toggle"
                                label="Email Notifications"
                                description="Receive updates via email"
                                value={n.emailNotifications}
                                onToggle={(v) => updateSettings({ notifications: { emailNotifications: v } })}
                            />
                            <SettingRow
                                type="toggle"
                                label="Push Notifications"
                                description="Receive push notifications on device"
                                value={n.pushNotifications}
                                onToggle={(v) => updateSettings({ notifications: { pushNotifications: v } })}
                            />
                        </View>
                    </View>

                    {/* Activity */}
                    <View className="mt-8">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Activity
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="toggle"
                                label="Connection Requests"
                                description="Notify when someone wants to connect"
                                value={n.allowConnectionRequests}
                                onToggle={(v) => updateSettings({ notifications: { allowConnectionRequests: v } })}
                            />
                            <SettingRow
                                type="toggle"
                                label="Messages"
                                description="Notify for new messages"
                                value={n.messages}
                                onToggle={(v) => updateSettings({ notifications: { messages: v } })}
                            />
                            <SettingRow
                                type="toggle"
                                label="Gig Updates"
                                description="Status changes on gigs you applied to"
                                value={n.gigUpdates}
                                onToggle={(v) => updateSettings({ notifications: { gigUpdates: v } })}
                            />
                            <SettingRow
                                type="toggle"
                                label="Event Updates"
                                description="Updates on events you registered for"
                                value={n.eventUpdates}
                                onToggle={(v) => updateSettings({ notifications: { eventUpdates: v } })}
                            />
                        </View>
                    </View>

                    {/* Marketing */}
                    <View className="mt-8">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Marketing
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="toggle"
                                label="Marketing Emails"
                                description="Product news, tips & special offers"
                                value={n.marketing}
                                onToggle={(v) => updateSettings({ notifications: { marketing: v } })}
                            />
                        </View>
                    </View>
                </AppScrollView>
            </View>
        </>
    );
}
