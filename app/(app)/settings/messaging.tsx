import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';

/* ── A·Minimal tokens ── */
const BG = '#121216';
const SURFACE = 'rgba(255,255,255,0.028)';
const HAIR = 'rgba(255,255,255,0.055)';
const ORANGE = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.07)';
const TEXT_0 = '#FFFFFF';
const TEXT_3 = '#71717A';

const MESSAGE_OPTIONS = [
    { value: 'connections' as const, label: 'Connections Only', desc: "Only people you're connected with" },
    { value: 'anyone' as const,      label: 'Everyone',         desc: 'Allow messages from all NETSA users' },
    { value: 'none' as const,        label: 'No One',           desc: 'Pause all incoming messages' },
];

/* ── Inline radio row ── */
function RadioRow({
    label, desc, selected, onPress, isFirst,
}: { label: string; desc: string; selected: boolean; onPress: () => void; isFirst?: boolean }) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 16, paddingVertical: 14,
                borderTopWidth: isFirst ? 0 : 1, borderTopColor: HAIR,
                backgroundColor: selected ? ORANGE_SOFT : pressed ? 'rgba(255,255,255,0.03)' : 'transparent',
            })}
        >
            <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{
                    fontSize: 15, fontFamily: 'Outfit-Medium',
                    color: selected ? ORANGE : TEXT_0,
                }}>
                    {label}
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: TEXT_3, marginTop: 2 }}>
                    {desc}
                </Text>
            </View>
            <View style={{
                width: 20, height: 20, borderRadius: 10,
                borderWidth: 1.5,
                borderColor: selected ? ORANGE : 'rgba(255,255,255,0.25)',
                alignItems: 'center', justifyContent: 'center',
            }}>
                {selected && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE }} />
                )}
            </View>
        </Pressable>
    );
}

export default function MessagingSettings() {
    const { data: settings } = useSettings();
    const { mutate: updateSettings } = useUpdateSettings();

    const messaging = settings?.messaging;
    if (!messaging) return null;

    return (
        <>
            <Stack.Screen options={{ title: 'Messaging' }} />
            <View style={{ flex: 1, backgroundColor: BG }}>
                <AppScrollView>

                    {/* ── Who Can Message ── */}
                    <View style={{ marginTop: 24 }}>
                        <Text style={{
                            fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
                            letterSpacing: 0.8, textTransform: 'uppercase',
                            paddingHorizontal: 20, marginBottom: 8,
                        }}>
                            Incoming Messages
                        </Text>
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            {MESSAGE_OPTIONS.map((opt, i) => (
                                <RadioRow
                                    key={opt.value}
                                    label={opt.label}
                                    desc={opt.desc}
                                    selected={messaging.allowMessagesFrom === opt.value}
                                    onPress={() => updateSettings({ messaging: { allowMessagesFrom: opt.value } })}
                                    isFirst={i === 0}
                                />
                            ))}
                        </View>
                        <Text style={{
                            fontSize: 12, fontFamily: 'Outfit-Regular', color: TEXT_3,
                            paddingHorizontal: 20, marginTop: 8, lineHeight: 17,
                        }}>
                            Existing conversations are unaffected.
                        </Text>
                    </View>

                    {/* ── Read Receipts ── */}
                    <View style={{ marginTop: 24, marginBottom: 48 }}>
                        <Text style={{
                            fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
                            letterSpacing: 0.8, textTransform: 'uppercase',
                            paddingHorizontal: 20, marginBottom: 8,
                        }}>
                            Read Receipts
                        </Text>
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
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
        </>
    );
}
