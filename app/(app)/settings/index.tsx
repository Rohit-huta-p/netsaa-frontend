import React from 'react';
import { View, Text, Switch, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useAuthStore } from '@/stores/authStore';
import {
    Bell, Shield, MessageCircle, UserCog, FileText, Lock,
    Landmark, Repeat, LogOut, Trash2, ChevronRight,
} from 'lucide-react-native';

/* ── A·Minimal tokens ── */
const BG = '#121216';
const SURFACE = 'rgba(255,255,255,0.028)';
const HAIR = 'rgba(255,255,255,0.055)';
const ORANGE = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.10)';
const TEXT_0 = '#FFFFFF';
const TEXT_2 = '#A1A1AA';
const TEXT_3 = '#71717A';

/* ── Preference nav items ── */
const PREF_ITEMS = [
    { key: 'notifications', label: 'Notifications', desc: 'Push, email & SMS', Icon: Bell },
    { key: 'privacy',       label: 'Privacy',       desc: 'Profile visibility & data sharing', Icon: Shield },
    { key: 'messaging',     label: 'Messaging',     desc: 'Who can contact you', Icon: MessageCircle },
    { key: 'account',       label: 'Account',       desc: 'Language, timezone & currency', Icon: UserCog },
    { key: 'legal',         label: 'Legal',         desc: 'Terms, privacy & data consent', Icon: FileText },
    { key: 'security',      label: 'Security',      desc: 'Password & active sessions', Icon: Lock },
] as const;

/* ── Artist-only toggle row with ARTIST pill ── */
function ArtistToggleRow({ label, desc, value, onToggle }: {
    label: string; desc: string; value: boolean; onToggle: (v: boolean) => void;
}) {
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: HAIR,
        }}>
            <View style={{ flex: 1, marginRight: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={{ fontSize: 15, fontFamily: 'Outfit-Medium', color: TEXT_0 }}>{label}</Text>
                    <View style={{
                        backgroundColor: ORANGE_SOFT, borderRadius: 4,
                        paddingHorizontal: 5, paddingVertical: 1,
                    }}>
                        <Text style={{ fontSize: 9, fontFamily: 'Outfit-SemiBold', color: ORANGE, letterSpacing: 0.6 }}>ARTIST</Text>
                    </View>
                </View>
                <Text style={{ fontSize: 13, fontFamily: 'Outfit-Regular', color: TEXT_3 }}>{desc}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: ORANGE }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(255,255,255,0.12)"
            />
        </View>
    );
}

/* ── Section header ── */
function SectionHeader({ title }: { title: string }) {
    return (
        <Text style={{
            fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
            letterSpacing: 0.8, textTransform: 'uppercase',
            paddingHorizontal: 20, marginBottom: 8,
        }}>
            {title}
        </Text>
    );
}

export default function SettingsIndex() {
    const router = useRouter();
    const { data: settings } = useSettings();
    const { mutate: updateSettings } = useUpdateSettings();
    const userRole = useAuthStore((s) => s.user?.role);
    const isArtist = userRole === 'artist';

    const isAvailable   = settings?.availability?.isAvailableForWork ?? false;
    const isDiscoverable = settings?.privacy?.showInDiscovery ?? true;

    return (
        <>
            <Stack.Screen options={{ title: 'Settings' }} />
            <View style={{ flex: 1, backgroundColor: BG }}>
                <AppScrollView>

                    {/* ── Artist: Profile signals ── */}
                    {isArtist && (
                        <View style={{ marginTop: 24 }}>
                            <SectionHeader title="Profile" />
                            <View style={{
                                backgroundColor: SURFACE, borderRadius: 14,
                                marginHorizontal: 16, overflow: 'hidden',
                                borderWidth: 1, borderColor: HAIR,
                            }}>
                                <ArtistToggleRow
                                    label="Available for work"
                                    desc="Signal you're open to new gigs"
                                    value={isAvailable}
                                    onToggle={(v) => updateSettings({ availability: { isAvailableForWork: v } })}
                                />
                                <ArtistToggleRow
                                    label="Discoverable"
                                    desc="Appear in Talent search"
                                    value={isDiscoverable}
                                    onToggle={(v) => updateSettings({ privacy: { showInDiscovery: v } })}
                                />
                            </View>
                        </View>
                    )}

                    {/* ── Payments ── */}
                    <View style={{ marginTop: 24 }}>
                        <SectionHeader title="Payments" />
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            <SettingRow
                                type="nav"
                                label="Payouts & Billing"
                                description="Bank account for getting paid"
                                icon={<Landmark size={18} color={TEXT_2} />}
                                onPress={() => router.push('/(app)/settings/payouts' as any)}
                            />
                        </View>
                    </View>

                    {/* ── Preferences ── */}
                    <View style={{ marginTop: 24 }}>
                        <SectionHeader title="Preferences" />
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            {PREF_ITEMS.map((item) => (
                                <SettingRow
                                    key={item.key}
                                    type="nav"
                                    label={item.label}
                                    description={item.desc}
                                    icon={<item.Icon size={18} color={TEXT_2} />}
                                    onPress={() => router.push(`/(app)/settings/${item.key}` as any)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* ── Account Actions ── */}
                    <View style={{ marginTop: 24, marginBottom: 48 }}>
                        <SectionHeader title="Account Actions" />
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            {/* Switch Role — orange accent, non-danger */}
                            <Pressable
                                onPress={() => router.push('/(app)/settings/role' as any)}
                                style={({ pressed }) => ({
                                    flexDirection: 'row', alignItems: 'center',
                                    paddingHorizontal: 16, paddingVertical: 14,
                                    borderBottomWidth: 1, borderBottomColor: HAIR,
                                    backgroundColor: pressed ? ORANGE_SOFT : 'transparent',
                                })}
                            >
                                <View style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    backgroundColor: ORANGE_SOFT,
                                    alignItems: 'center', justifyContent: 'center',
                                    marginRight: 12,
                                }}>
                                    <Repeat size={15} color={ORANGE} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontFamily: 'Outfit-Medium', color: TEXT_0 }}>Switch Role</Text>
                                    <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: TEXT_3, marginTop: 1 }}>
                                        Client, Creative Lead or Artist
                                    </Text>
                                </View>
                                <ChevronRight size={16} color={ORANGE} />
                            </Pressable>

                            {/* Sign Out */}
                            <SettingRow
                                type="danger"
                                label="Sign Out"
                                description="Log out of your account"
                                onPress={() => {
                                    useAuthStore.getState().clearAuth();
                                    router.push('/' as any);
                                }}
                            />

                            {/* Delete Account */}
                            <SettingRow
                                type="danger"
                                label="Delete Account"
                                description="Deactivate or permanently delete"
                                onPress={() => router.push('/(app)/settings/danger' as any)}
                            />
                        </View>
                    </View>

                </AppScrollView>
            </View>
        </>
    );
}
