import React from 'react';
import { View, Text, Alert, ActivityIndicator, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Lock, Smartphone, Monitor, Tablet, Shield, X } from 'lucide-react-native';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useActiveSessions, useLogoutDevice, useLogoutAllDevices } from '@/hooks/useSecurity';

/* ── A·Minimal tokens ── */
const BG = '#121216';
const SURFACE = 'rgba(255,255,255,0.028)';
const HAIR = 'rgba(255,255,255,0.055)';
const ORANGE = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.08)';
const ORANGE_LINE = 'rgba(255,107,53,0.2)';
const TEXT_0 = '#FFFFFF';
const TEXT_2 = '#A1A1AA';
const TEXT_3 = '#71717A';
const TEXT_4 = '#52525B';
const RED = '#EF4444';
const RED_SOFT = 'rgba(239,68,68,0.08)';

const platformMeta = (platform: string) => {
    switch (platform) {
        case 'ios':     return { Icon: Smartphone, label: 'iPhone' };
        case 'android': return { Icon: Smartphone, label: 'Android' };
        case 'web':     return { Icon: Monitor,    label: 'Web Browser' };
        default:        return { Icon: Tablet,     label: platform };
    }
};

const formatLastActive = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    const d = new Date(dateStr), now = new Date();
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    const h = Math.floor(mins / 60);
    if (h < 24)     return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7)   return `${days}d ago`;
    return d.toLocaleDateString();
};

export default function SecuritySettings() {
    const router = useRouter();
    const { data: devices, isLoading } = useActiveSessions();
    const { mutate: logoutDevice, variables: loggingOutId, isPending: isLoggingOutDevice } = useLogoutDevice();
    const { mutate: logoutAll, isPending: isLoggingOutAll } = useLogoutAllDevices();

    const handleLogoutAll = () => {
        Alert.alert(
            'Sign out of all other devices',
            'All sessions except this one will be ended.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out', style: 'destructive', onPress: () => logoutAll() },
            ],
        );
    };

    const handleLogoutDevice = (id: string) => {
        Alert.alert(
            'Remove device',
            'This device will be signed out.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => logoutDevice(id) },
            ],
        );
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Security' }} />
            <View style={{ flex: 1, backgroundColor: BG }}>
                <AppScrollView>

                    {/* ── Authentication ── */}
                    <View style={{ marginTop: 24 }}>
                        <Text style={{
                            fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
                            letterSpacing: 0.8, textTransform: 'uppercase',
                            paddingHorizontal: 20, marginBottom: 8,
                        }}>
                            Authentication
                        </Text>
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            <SettingRow
                                type="nav"
                                label="Change Password"
                                description="Update your account password"
                                icon={<Lock size={18} color={TEXT_2} />}
                                onPress={() => router.push('/settings/change-password')}
                            />
                            <SettingRow
                                type="nav"
                                label="Two-Factor Auth"
                                description="Add a second layer of security · Coming soon"
                                icon={<Shield size={18} color={TEXT_4} />}
                                onPress={() => {}}
                            />
                        </View>
                    </View>

                    {/* ── Active Sessions ── */}
                    <View style={{ marginTop: 24 }}>
                        <Text style={{
                            fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
                            letterSpacing: 0.8, textTransform: 'uppercase',
                            paddingHorizontal: 20, marginBottom: 8,
                        }}>
                            Active Sessions
                        </Text>
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            {isLoading ? (
                                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color={ORANGE} />
                                </View>
                            ) : !devices || devices.length === 0 ? (
                                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 14, fontFamily: 'Outfit-Regular', color: TEXT_3 }}>
                                        No active sessions
                                    </Text>
                                </View>
                            ) : (
                                devices.map((device, i) => {
                                    const { Icon, label } = platformMeta(device.platform);
                                    const isCurrent = i === 0;
                                    return (
                                        <View
                                            key={device._id}
                                            style={{
                                                flexDirection: 'row', alignItems: 'center',
                                                paddingHorizontal: 16, paddingVertical: 14,
                                                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: HAIR,
                                            }}
                                        >
                                            <View style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                backgroundColor: isCurrent ? ORANGE_SOFT : 'rgba(255,255,255,0.05)',
                                                borderWidth: 1,
                                                borderColor: isCurrent ? ORANGE_LINE : HAIR,
                                                alignItems: 'center', justifyContent: 'center',
                                                marginRight: 12,
                                            }}>
                                                <Icon size={18} color={isCurrent ? ORANGE : TEXT_2} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                                                    <Text style={{ fontSize: 14, fontFamily: 'Outfit-Medium', color: TEXT_0 }}>
                                                        {label}
                                                    </Text>
                                                    {isCurrent && (
                                                        <View style={{
                                                            backgroundColor: ORANGE_SOFT,
                                                            borderWidth: 1, borderColor: ORANGE_LINE,
                                                            borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1,
                                                        }}>
                                                            <Text style={{
                                                                fontSize: 8, fontFamily: 'SpaceMono-Regular',
                                                                color: ORANGE, letterSpacing: 0.6, textTransform: 'uppercase',
                                                            }}>
                                                                Current
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: TEXT_3, marginTop: 2 }}>
                                                    {formatLastActive(device.lastActive)}
                                                    {device.appVersion ? ` · v${device.appVersion}` : ''}
                                                </Text>
                                            </View>
                                            {!isCurrent && (
                                                <Pressable
                                                    onPress={() => handleLogoutDevice(device._id)}
                                                    disabled={isLoggingOutDevice && loggingOutId === device._id}
                                                    style={({ pressed }) => ({
                                                        padding: 6,
                                                        backgroundColor: pressed ? RED_SOFT : 'transparent',
                                                        borderRadius: 6,
                                                    })}
                                                >
                                                    {isLoggingOutDevice && loggingOutId === device._id
                                                        ? <ActivityIndicator size="small" color={RED} />
                                                        : <X size={15} color={TEXT_4} />
                                                    }
                                                </Pressable>
                                            )}
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </View>

                    {/* ── Session Management ── */}
                    <View style={{ marginTop: 24, marginBottom: 48 }}>
                        <Text style={{
                            fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
                            letterSpacing: 0.8, textTransform: 'uppercase',
                            paddingHorizontal: 20, marginBottom: 8,
                        }}>
                            Session Management
                        </Text>
                        <Pressable
                            onPress={handleLogoutAll}
                            disabled={isLoggingOutAll}
                            style={({ pressed }) => ({
                                marginHorizontal: 16, borderRadius: 14,
                                backgroundColor: pressed ? RED_SOFT : 'rgba(239,68,68,0.06)',
                                borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)',
                                paddingVertical: 14, paddingHorizontal: 16,
                                alignItems: 'center',
                            })}
                        >
                            {isLoggingOutAll
                                ? <ActivityIndicator size="small" color={RED} />
                                : <Text style={{ fontSize: 15, fontFamily: 'Outfit-Medium', color: RED }}>
                                    Sign out of all other devices
                                  </Text>
                            }
                        </Pressable>
                        <Text style={{
                            fontSize: 11, fontFamily: 'Outfit-Regular', color: TEXT_3,
                            paddingHorizontal: 20, marginTop: 8, lineHeight: 16,
                        }}>
                            This ends all sessions except your current one. You'll need to sign in again on those devices.
                        </Text>
                    </View>

                </AppScrollView>
            </View>
        </>
    );
}
