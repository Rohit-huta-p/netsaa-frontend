// app/(app)/settings/messaging.tsx
import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Modal, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';

const MESSAGE_OPTIONS = [
    { value: 'connections', label: 'Connections Only', description: "Only people you're connected with" },
    { value: 'anyone', label: 'Anyone', description: 'Allow messages from all users' },
    { value: 'none', label: 'Nobody', description: 'Block all incoming messages' },
] as const;

export default function MessagingSettings() {
    const { data: settings, isLoading } = useSettings();
    const { mutate: updateSettings } = useUpdateSettings();
    const [showPicker, setShowPicker] = useState(false);

    if (isLoading || !settings) {
        return (
            <>
                <Stack.Screen options={{ title: 'Messaging' }} />
                <View className="flex-1 bg-[#09090b] items-center justify-center">
                    <ActivityIndicator size="large" color="#A855F7" />
                </View>
            </>
        );
    }

    const messaging = settings.messaging;
    const currentLabel = MESSAGE_OPTIONS.find(o => o.value === messaging.allowMessagesFrom)?.label ?? messaging.allowMessagesFrom;

    return (
        <>
            <Stack.Screen options={{ title: 'Messaging' }} />
            <View className="flex-1 bg-[#09090b]">
                <AppScrollView>
                    {/* Who Can Message */}
                    <View className="mt-6">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Incoming Messages
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="select"
                                label="Allow messages from"
                                value={currentLabel}
                                onPress={() => setShowPicker(true)}
                            />
                        </View>
                        <Text className="text-zinc-600 text-[12px] font-['SourceSans3-Regular'] px-5 mt-2">
                            This only affects new incoming messages. Existing conversations are unaffected.
                        </Text>
                    </View>

                    {/* Read Receipts */}
                    <View className="mt-8">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Read Receipts
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="toggle"
                                label="Read Receipts"
                                description="Let others know when you've read their messages"
                                value={messaging.readReceipts}
                                onToggle={(v) => updateSettings({ messaging: { readReceipts: v } })}
                            />
                        </View>
                    </View>
                </AppScrollView>
            </View>

            {/* Message Filter Picker */}
            <Modal visible={showPicker} transparent animationType="fade">
                <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowPicker(false)}>
                    <View className="bg-zinc-900 rounded-t-2xl p-5 pb-10">
                        <Text className="text-white text-lg font-['Outfit-SemiBold'] mb-4">Allow Messages From</Text>
                        {MESSAGE_OPTIONS.map((option) => (
                            <Pressable
                                key={option.value}
                                className={`p-4 rounded-xl mb-2 ${messaging.allowMessagesFrom === option.value ? 'bg-violet-600/20 border border-violet-500/30' : 'bg-white/5'}`}
                                onPress={() => {
                                    updateSettings({ messaging: { allowMessagesFrom: option.value } });
                                    setShowPicker(false);
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
