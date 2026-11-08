import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useAuthStore } from '@/stores/authStore';

/* ── A·Minimal tokens ── */
const BG = '#121216';
const SURFACE = 'rgba(255,255,255,0.028)';
const HAIR = 'rgba(255,255,255,0.055)';
const ORANGE = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.07)';
const TEXT_0 = '#FFFFFF';
const TEXT_3 = '#71717A';

const VISIBILITY_OPTIONS = [
    { value: 'public' as const,           label: 'Public',            desc: 'Anyone can find your profile' },
    { value: 'connections_only' as const, label: 'Connections Only',  desc: 'Only your connections can see your profile' },
    { value: 'private' as const,          label: 'Private',           desc: 'Hidden from search results' },
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
            {/* Radio dot */}
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

export default function PrivacySettings() {
    const { data: settings } = useSettings();
    const { mutate: updateSettings } = useUpdateSettings();
    const userRole = useAuthStore((s) => s.user?.role);
    const isArtist = userRole === 'artist';

    const privacy = settings?.privacy;
    if (!privacy) return null;

    return (
        <>
            <Stack.Screen options={{ title: 'Privacy' }} />
            <View style={{ flex: 1, backgroundColor: BG }}>
                <AppScrollView>

                    {/* ── Profile Visibility ── */}
                    <View style={{ marginTop: 24 }}>
                        <Text style={{
                            fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
                            letterSpacing: 0.8, textTransform: 'uppercase',
                            paddingHorizontal: 20, marginBottom: 8,
                        }}>
                            Profile Visibility
                        </Text>
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            {VISIBILITY_OPTIONS.map((opt, i) => (
                                <RadioRow
                                    key={opt.value}
                                    label={opt.label}
                                    desc={opt.desc}
                                    selected={privacy.profileVisibility === opt.value}
                                    onPress={() => updateSettings({ privacy: { profileVisibility: opt.value } })}
                                    isFirst={i === 0}
                                />
                            ))}
                        </View>
                    </View>

                    {/* ── Discovery (artist-only) ── */}
                    {isArtist && (
                        <View style={{ marginTop: 24 }}>
                            <Text style={{
                                fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
                                letterSpacing: 0.8, textTransform: 'uppercase',
                                paddingHorizontal: 20, marginBottom: 8,
                            }}>
                                Discovery
                            </Text>
                            <View style={{
                                backgroundColor: SURFACE, borderRadius: 14,
                                marginHorizontal: 16, overflow: 'hidden',
                                borderWidth: 1, borderColor: HAIR,
                            }}>
                                <SettingRow
                                    type="toggle"
                                    label="Discoverable"
                                    description="Appear in Talent search results"
                                    value={privacy.showInDiscovery}
                                    onToggle={(v) => updateSettings({ privacy: { showInDiscovery: v } })}
                                />
                            </View>
                        </View>
                    )}

                    {/* ── Data Sharing ── */}
                    <View style={{ marginTop: 24, marginBottom: 48 }}>
                        <Text style={{
                            fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
                            letterSpacing: 0.8, textTransform: 'uppercase',
                            paddingHorizontal: 20, marginBottom: 8,
                        }}>
                            Data Sharing
                        </Text>
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
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
        </>
    );
}
