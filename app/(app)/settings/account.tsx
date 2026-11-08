import React, { useState } from 'react';
import { View, Text, Modal, Pressable, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useAuthStore } from '@/stores/authStore';
import { Link2 } from 'lucide-react-native';

/* ── A·Minimal tokens ── */
const BG = '#121216';
const SURFACE = 'rgba(255,255,255,0.028)';
const HAIR = 'rgba(255,255,255,0.055)';
const ORANGE = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.08)';
const TEXT_0 = '#FFFFFF';
const TEXT_2 = '#A1A1AA';
const TEXT_3 = '#71717A';
const MODAL_BG = '#1A1A1F';

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
    { value: 'Asia/Kolkata',         label: 'Asia/Kolkata (IST)' },
    { value: 'America/New_York',     label: 'America/New_York (EST)' },
    { value: 'America/Los_Angeles',  label: 'America/Los_Angeles (PST)' },
    { value: 'Europe/London',        label: 'Europe/London (GMT)' },
    { value: 'Asia/Dubai',           label: 'Asia/Dubai (GST)' },
    { value: 'Asia/Singapore',       label: 'Asia/Singapore (SGT)' },
];

type PickerField = 'language' | 'timezone' | 'currency' | null;

const PICKER_CONFIG = {
    language: { title: 'Language',  options: LANGUAGES  },
    timezone: { title: 'Timezone',  options: TIMEZONES  },
    currency: { title: 'Currency',  options: CURRENCIES },
} as const;

export default function AccountSettings() {
    const { data: settings } = useSettings();
    const { mutate: updateSettings } = useUpdateSettings();
    const [activePicker, setActivePicker] = useState<PickerField>(null);
    const role = useAuthStore((s) => s.user?.role);

    const account = settings?.account;
    if (!account) return null;

    const languageLabel = LANGUAGES.find(l => l.value === account.language)?.label ?? account.language;
    const currencyLabel = CURRENCIES.find(c => c.value === account.currency)?.label ?? account.currency;
    const timezoneLabel = TIMEZONES.find(t => t.value === account.timezone)?.label ?? account.timezone;

    const activeConfig = activePicker ? PICKER_CONFIG[activePicker] : null;
    const activeCurrent = activePicker ? account[activePicker] : '';

    return (
        <>
            <Stack.Screen options={{ title: 'Account' }} />
            <View style={{ flex: 1, backgroundColor: BG }}>
                <AppScrollView>

                    {/* ── Regional ── */}
                    <View style={{ marginTop: 24 }}>
                        <Text style={{
                            fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
                            letterSpacing: 0.8, textTransform: 'uppercase',
                            paddingHorizontal: 20, marginBottom: 8,
                        }}>
                            Regional
                        </Text>
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            <SettingRow type="select" label="Language" value={languageLabel} onPress={() => setActivePicker('language')} />
                            <SettingRow type="select" label="Timezone" value={timezoneLabel} onPress={() => setActivePicker('timezone')} />
                            <SettingRow type="select" label="Currency" value={currencyLabel} onPress={() => setActivePicker('currency')} />
                        </View>
                    </View>

                    {/* ── Artist: Portfolio Link (Soon) ── */}
                    {role === 'artist' && (
                        <View style={{ marginTop: 24, marginBottom: 48 }}>
                            <Text style={{
                                fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
                                letterSpacing: 0.8, textTransform: 'uppercase',
                                paddingHorizontal: 20, marginBottom: 8,
                            }}>
                                Artist Profile
                            </Text>
                            <View style={{
                                backgroundColor: SURFACE, borderRadius: 14,
                                marginHorizontal: 16, overflow: 'hidden',
                                borderWidth: 1, borderColor: HAIR,
                                opacity: 0.5,
                            }}>
                                <SettingRow
                                    type="nav"
                                    label="Portfolio Link"
                                    description="External portfolio or website · Coming soon"
                                    icon={<Link2 size={18} color={TEXT_2} />}
                                    onPress={() => {}}
                                />
                            </View>
                        </View>
                    )}

                </AppScrollView>
            </View>

            {/* ── Picker Modal ── */}
            <Modal visible={!!activePicker} transparent animationType="fade">
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
                    onPress={() => setActivePicker(null)}
                >
                    <View style={{
                        backgroundColor: MODAL_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20,
                        padding: 20, paddingBottom: 36, maxHeight: '60%',
                        borderTopWidth: 1, borderColor: HAIR,
                    }}>
                        <Text style={{
                            fontSize: 17, fontFamily: 'Outfit-SemiBold', color: TEXT_0,
                            marginBottom: 16,
                        }}>
                            {activeConfig?.title}
                        </Text>
                        <FlatList
                            data={activeConfig?.options ?? []}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => {
                                const selected = activeCurrent === item.value;
                                return (
                                    <Pressable
                                        onPress={() => {
                                            if (activePicker) {
                                                updateSettings({ account: { [activePicker]: item.value } });
                                            }
                                            setActivePicker(null);
                                        }}
                                        style={({ pressed }) => ({
                                            paddingHorizontal: 14, paddingVertical: 13,
                                            borderRadius: 10, marginBottom: 4,
                                            backgroundColor: selected
                                                ? ORANGE_SOFT
                                                : pressed ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                                            borderWidth: selected ? 1 : 0,
                                            borderColor: ORANGE,
                                        })}
                                    >
                                        <Text style={{
                                            fontSize: 15, fontFamily: 'Outfit-Medium',
                                            color: selected ? ORANGE : TEXT_0,
                                        }}>
                                            {item.label}
                                        </Text>
                                    </Pressable>
                                );
                            }}
                        />
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}
