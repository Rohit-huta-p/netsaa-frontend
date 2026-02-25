// app/(app)/settings/privacy.tsx
import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Modal, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';

const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Public', description: 'Anyone can find your profile' },
    { value: 'connections_only', label: 'Connections Only', description: 'Only your connections can see your profile' },
    { value: 'private', label: 'Private', description: 'Hidden from search results' },
] as const;

export default function PrivacySettings() {
    const { data: settings, isLoading } = useSettings();
    const { mutate: updateSettings } = useUpdateSettings();
    const [showVisibilityPicker, setShowVisibilityPicker] = useState(false);

    if (isLoading || !settings) {
        return (
            <>
                <Stack.Screen options={{ title: 'Privacy' }} />
                <View className="flex-1 bg-[#09090b] items-center justify-center">
                    <ActivityIndicator size="large" color="#A855F7" />
                </View>
            </>
        );
    }

    const privacy = settings.privacy;

    const visibilityLabel = VISIBILITY_OPTIONS.find(o => o.value === privacy.profileVisibility)?.label ?? privacy.profileVisibility;

    return (
        <>
            <Stack.Screen options={{ title: 'Privacy' }} />
            <View className="flex-1 bg-[#09090b]">
                <AppScrollView>
                    {/* Profile Visibility */}
                    <View className="mt-6">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Profile Visibility
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="select"
                                label="Who can see your profile"
                                value={visibilityLabel}
                                onPress={() => setShowVisibilityPicker(true)}
                            />
                        </View>
                    </View>

                    {/* Data Sharing */}
                    <View className="mt-8">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Data Sharing
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="toggle"
                                label="Show Email"
                                description="Display your email on your public profile"
                                value={privacy.showEmail}
                                onToggle={(v) => updateSettings({ privacy: { showEmail: v } })}
                            />
                            <SettingRow
                                type="toggle"
                                label="Show Phone"
                                description="Display your phone number on your profile"
                                value={privacy.showPhone}
                                onToggle={(v) => updateSettings({ privacy: { showPhone: v } })}
                            />
                            <SettingRow
                                type="toggle"
                                label="Show Location"
                                description="Display your city on your profile"
                                value={privacy.showLocation}
                                onToggle={(v) => updateSettings({ privacy: { showLocation: v } })}
                            />
                        </View>
                    </View>
                </AppScrollView>
            </View>

            {/* Visibility Picker Modal */}
            <Modal visible={showVisibilityPicker} transparent animationType="fade">
                <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowVisibilityPicker(false)}>
                    <View className="bg-zinc-900 rounded-t-2xl p-5 pb-10">
                        <Text className="text-white text-lg font-['Outfit-SemiBold'] mb-4">Profile Visibility</Text>
                        {VISIBILITY_OPTIONS.map((option) => (
                            <Pressable
                                key={option.value}
                                className={`p-4 rounded-xl mb-2 ${privacy.profileVisibility === option.value ? 'bg-violet-600/20 border border-violet-500/30' : 'bg-white/5'}`}
                                onPress={() => {
                                    updateSettings({ privacy: { profileVisibility: option.value } });
                                    setShowVisibilityPicker(false);
                                }}
                            >
                                <Text className="text-white text-[15px] font-['Outfit-Medium']">{option.label}</Text>
                                <Text className="text-zinc-400 text-[13px] font-['SourceSans3-Regular'] mt-1">{option.description}</Text>
                            </Pressable>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}
