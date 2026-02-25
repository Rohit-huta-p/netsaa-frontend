// app/(app)/settings/security.tsx
import React, { useState } from 'react';
import { View, Text, Alert, ActivityIndicator, Pressable, Modal, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import {
    useActiveSessions,
    useChangePassword,
    useLogoutDevice,
    useLogoutAllDevices,
} from '@/hooks/useSecurity';
import { useAuthStore } from '@/stores/authStore';
import {
    Lock,
    Smartphone,
    Monitor,
    Tablet,
    LogOut,
    BadgeCheck,
    ShieldCheck,
} from 'lucide-react-native';

/* ── Helpers ── */

/** Map platform string to icon + label */
const platformMeta = (platform: string) => {
    switch (platform) {
        case 'ios':
            return { Icon: Smartphone, label: 'iPhone' };
        case 'android':
            return { Icon: Smartphone, label: 'Android' };
        case 'web':
            return { Icon: Monitor, label: 'Web Browser' };
        default:
            return { Icon: Tablet, label: platform };
    }
};

/** Format ISO date to relative or readable string */
const formatLastActive = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

/* ── Change Password Modal ── */

function ChangePasswordModal({
    visible,
    onClose,
}: {
    visible: boolean;
    onClose: () => void;
}) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { mutate: changePassword, isPending } = useChangePassword();

    const handleSubmit = () => {
        if (!currentPassword.trim()) {
            return Alert.alert('Required', 'Please enter your current password.');
        }
        if (newPassword.length < 8) {
            return Alert.alert('Too Short', 'New password must be at least 8 characters.');
        }
        if (newPassword !== confirmPassword) {
            return Alert.alert('Mismatch', 'New passwords do not match.');
        }

        changePassword(
            { currentPassword, newPassword },
            {
                onSuccess: () => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    onClose();
                },
            },
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
                <Pressable className="bg-zinc-900 rounded-t-2xl p-5 pb-10" onPress={() => { }}>
                    <Text className="text-white text-lg font-['Outfit-SemiBold'] mb-5">Change Password</Text>

                    <Text className="text-zinc-400 text-[13px] font-['SourceSans3-Regular'] mb-1 ml-1">Current Password</Text>
                    <TextInput
                        className="bg-white/5 rounded-xl px-4 py-3 text-white text-[15px] font-['SourceSans3-Regular'] mb-4"
                        placeholder="Enter current password"
                        placeholderTextColor="#52525b"
                        secureTextEntry
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        editable={!isPending}
                    />

                    <Text className="text-zinc-400 text-[13px] font-['SourceSans3-Regular'] mb-1 ml-1">New Password</Text>
                    <TextInput
                        className="bg-white/5 rounded-xl px-4 py-3 text-white text-[15px] font-['SourceSans3-Regular'] mb-4"
                        placeholder="At least 8 characters"
                        placeholderTextColor="#52525b"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                        editable={!isPending}
                    />

                    <Text className="text-zinc-400 text-[13px] font-['SourceSans3-Regular'] mb-1 ml-1">Confirm New Password</Text>
                    <TextInput
                        className="bg-white/5 rounded-xl px-4 py-3 text-white text-[15px] font-['SourceSans3-Regular'] mb-5"
                        placeholder="Confirm new password"
                        placeholderTextColor="#52525b"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!isPending}
                    />

                    <Pressable
                        className="bg-violet-600 rounded-xl py-3.5 items-center active:opacity-80"
                        onPress={handleSubmit}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text className="text-white text-[15px] font-['Outfit-SemiBold']">Change Password</Text>
                        )}
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

/* ── Device Row ── */

function DeviceRow({
    device,
    onLogout,
    isLoggingOut,
}: {
    device: { _id: string; platform: string; lastActive?: string; appVersion?: string };
    onLogout: () => void;
    isLoggingOut: boolean;
}) {
    const { Icon, label } = platformMeta(device.platform);

    return (
        <View className="flex-row items-center px-5 py-4 border-b border-white/5">
            <View className="w-10 h-10 rounded-full bg-violet-600/15 items-center justify-center mr-3">
                <Icon size={20} color="#a78bfa" />
            </View>
            <View className="flex-1">
                <Text className="text-white text-[15px] font-['Outfit-Medium']">{label}</Text>
                <Text className="text-zinc-500 text-[12px] font-['SourceSans3-Regular'] mt-0.5">
                    Active {formatLastActive(device.lastActive)}
                    {device.appVersion ? ` · v${device.appVersion}` : ''}
                </Text>
            </View>
            <Pressable
                className="px-3 py-1.5 rounded-lg bg-red-500/10 active:bg-red-500/20"
                onPress={onLogout}
                disabled={isLoggingOut}
            >
                {isLoggingOut ? (
                    <ActivityIndicator size="small" color="#f87171" />
                ) : (
                    <Text className="text-red-400 text-[13px] font-['Outfit-Medium']">Logout</Text>
                )}
            </Pressable>
        </View>
    );
}

/* ── Main Screen ── */

export default function SecuritySettings() {
    const role = useAuthStore((s) => s.user?.role);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const { data: devices, isLoading: sessionsLoading } = useActiveSessions();
    const { mutate: logoutDevice, variables: loggingOutId, isPending: isLoggingOutDevice } = useLogoutDevice();
    const { mutate: logoutAll, isPending: isLoggingOutAll } = useLogoutAllDevices();

    const handleLogoutAll = () => {
        Alert.alert(
            'Logout All Devices',
            'This will log out all devices except the current one. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout All',
                    style: 'destructive',
                    onPress: () => logoutAll(),
                },
            ],
        );
    };

    const handleLogoutDevice = (deviceId: string) => {
        Alert.alert(
            'Logout Device',
            'This device will be logged out and stop receiving push notifications.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => logoutDevice(deviceId),
                },
            ],
        );
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Security' }} />
            <View className="flex-1 bg-[#09090b]">
                <AppScrollView>
                    {/* ── Section 1: Password ── */}
                    <View className="mt-6">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Authentication
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="nav"
                                label="Change Password"
                                description="Re-authentication required"
                                icon={<Lock size={20} color="#a78bfa" />}
                                onPress={() => setShowPasswordModal(true)}
                            />
                        </View>
                    </View>

                    {/* ── Section 2: Active Sessions ── */}
                    <View className="mt-8">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Active Sessions
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            {sessionsLoading ? (
                                <View className="py-8 items-center">
                                    <ActivityIndicator size="small" color="#A855F7" />
                                </View>
                            ) : !devices || devices.length === 0 ? (
                                <View className="py-6 items-center">
                                    <Text className="text-zinc-500 text-[14px] font-['SourceSans3-Regular']">
                                        No active sessions
                                    </Text>
                                </View>
                            ) : (
                                devices.map((device) => (
                                    <DeviceRow
                                        key={device._id}
                                        device={device}
                                        onLogout={() => handleLogoutDevice(device._id)}
                                        isLoggingOut={isLoggingOutDevice && loggingOutId === device._id}
                                    />
                                ))
                            )}
                        </View>
                    </View>

                    {/* ── Section 3: Logout All Devices ── */}
                    <View className="mt-8">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Session Management
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="danger"
                                label="Logout All Devices"
                                description="Signs out every session except this one"
                                onPress={handleLogoutAll}
                            />
                        </View>
                    </View>

                    {/* ── Section 4: 2FA (Placeholder) ── */}
                    <View className="mt-8">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Two-Factor Authentication
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="toggle"
                                label="Enable 2FA"
                                description="Coming soon — adds an extra layer of security"
                                value={false}
                                onToggle={() =>
                                    Alert.alert('Coming Soon', 'Two-factor authentication will be available in a future update.')
                                }
                                disabled
                            />
                        </View>
                    </View>

                    {/* ── Section 5: Organizer-only — Business Verification ── */}
                    {role === 'organizer' && (
                        <View className="mt-8">
                            <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                                Business Verification
                            </Text>
                            <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                                <SettingRow
                                    type="nav"
                                    label="Verify Organization"
                                    description="Submit documents to verify your business"
                                    icon={<BadgeCheck size={20} color="#a78bfa" />}
                                    onPress={() =>
                                        Alert.alert('Coming Soon', 'Business verification will be available in a future update.')
                                    }
                                />
                            </View>
                        </View>
                    )}

                    {/* Bottom spacer */}
                    <View className="h-8" />
                </AppScrollView>
            </View>

            {/* ── Password Change Modal ── */}
            <ChangePasswordModal
                visible={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </>
    );
}
