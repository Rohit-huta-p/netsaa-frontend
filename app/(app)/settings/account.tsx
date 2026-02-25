// app/(app)/settings/account.tsx
import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Modal, Pressable, FlatList, Alert } from 'react-native';
import { Stack } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useAuthStore } from '@/stores/authStore';
import { Link2, ToggleRight } from 'lucide-react-native';

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'te', label: 'Telugu' },
    { value: 'ta', label: 'Tamil' },
    { value: 'kn', label: 'Kannada' },
    { value: 'ml', label: 'Malayalam' },
    { value: 'mr', label: 'Marathi' },
    { value: 'bn', label: 'Bengali' },
];

const CURRENCIES = [
    { value: 'INR', label: 'INR — Indian Rupee' },
    { value: 'USD', label: 'USD — US Dollar' },
    { value: 'EUR', label: 'EUR — Euro' },
    { value: 'GBP', label: 'GBP — British Pound' },
];

const TIMEZONES = [
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
    { value: 'America/New_York', label: 'America/New_York (EST)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
    { value: 'Europe/London', label: 'Europe/London (GMT)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
];

type PickerField = 'language' | 'timezone' | 'currency' | null;

export default function AccountSettings() {
    const { data: settings, isLoading } = useSettings();
    const { mutate: updateSettings } = useUpdateSettings();
    const [activePicker, setActivePicker] = useState<PickerField>(null);
    const role = useAuthStore((s) => s.user?.role);

    const handlePortfolioLink = () => {
        Alert.alert('Coming Soon', 'Portfolio link configuration will be available in a future update.');
    };

    if (isLoading || !settings) {
        return (
            <>
                <Stack.Screen options={{ title: 'Account' }} />
                <View className="flex-1 bg-[#09090b] items-center justify-center">
                    <ActivityIndicator size="large" color="#A855F7" />
                </View>
            </>
        );
    }

    const account = settings.account;

    const pickerConfig = {
        language: { title: 'Language', options: LANGUAGES, current: account.language },
        timezone: { title: 'Timezone', options: TIMEZONES, current: account.timezone },
        currency: { title: 'Currency', options: CURRENCIES, current: account.currency },
    };

    const activeConfig = activePicker ? pickerConfig[activePicker] : null;

    const handleSelect = (value: string) => {
        if (activePicker) {
            updateSettings({ account: { [activePicker]: value } });
            setActivePicker(null);
        }
    };

    const languageLabel = LANGUAGES.find(l => l.value === account.language)?.label ?? account.language;
    const currencyLabel = CURRENCIES.find(c => c.value === account.currency)?.label ?? account.currency;
    const timezoneLabel = TIMEZONES.find(t => t.value === account.timezone)?.label ?? account.timezone;

    return (
        <>
            <Stack.Screen options={{ title: 'Account' }} />
            <View className="flex-1 bg-[#09090b]">
                <AppScrollView>
                    <View className="mt-6">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Regional
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="select"
                                label="Language"
                                value={languageLabel}
                                onPress={() => setActivePicker('language')}
                            />
                            <SettingRow
                                type="select"
                                label="Timezone"
                                value={timezoneLabel}
                                onPress={() => setActivePicker('timezone')}
                            />
                            <SettingRow
                                type="select"
                                label="Currency"
                                value={currencyLabel}
                                onPress={() => setActivePicker('currency')}
                            />
                        </View>
                    </View>

                    {/* Artist-only — portfolio */}
                    {role === 'artist' && (
                        <View className="mt-8">
                            <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                                Artist Profile
                            </Text>
                            <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                                <SettingRow
                                    type="nav"
                                    label="Portfolio Link"
                                    description="External portfolio or website URL"
                                    icon={<Link2 size={20} color="#a78bfa" />}
                                    onPress={handlePortfolioLink}
                                />
                            </View>
                        </View>
                    )}

                    {/* Organizer-only — auto-close gig */}
                    {role === 'organizer' && (
                        <View className="mt-8">
                            <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                                Gig Automation
                            </Text>
                            <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                                <SettingRow
                                    type="toggle"
                                    label="Auto-Close Gigs"
                                    description="Automatically close gigs after their deadline"
                                    value={false}
                                    onToggle={() => Alert.alert('Coming Soon', 'Auto-close gig feature will be available in a future update.')}
                                />
                            </View>
                        </View>
                    )}
                </AppScrollView>
            </View>

            {/* Shared Picker Modal */}
            <Modal visible={!!activePicker} transparent animationType="fade">
                <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setActivePicker(null)}>
                    <View className="bg-zinc-900 rounded-t-2xl p-5 pb-10 max-h-[60%]">
                        <Text className="text-white text-lg font-['Outfit-SemiBold'] mb-4">{activeConfig?.title}</Text>
                        <FlatList
                            data={activeConfig?.options ?? []}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <Pressable
                                    className={`p-4 rounded-xl mb-2 ${activeConfig?.current === item.value ? 'bg-violet-600/20 border border-violet-500/30' : 'bg-white/5'}`}
                                    onPress={() => handleSelect(item.value)}
                                >
                                    <Text className="text-white text-[15px] font-['Outfit-Medium']">{item.label}</Text>
                                </Pressable>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}
