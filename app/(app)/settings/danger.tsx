// app/(app)/settings/danger.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    Alert,
    Pressable,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useAuthStore } from '@/stores/authStore';
import dangerService from '@/services/dangerService';
import { AlertTriangle, Trash2 } from 'lucide-react-native';

const COUNTDOWN_SECONDS = 10;

/* ── Confirmation Modal with 10-second countdown ── */
function DangerConfirmModal({
    visible,
    onClose,
    action,
}: {
    visible: boolean;
    onClose: () => void;
    action: 'deactivate' | 'delete';
}) {
    const router = useRouter();
    const clearAuth = useAuthStore((s) => s.clearAuth);

    const [password, setPassword] = useState('');
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const [isPending, setIsPending] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setPassword('');
            setCountdown(COUNTDOWN_SECONDS);
            setIsPending(false);

            intervalRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [visible]);

    const handleConfirm = useCallback(async () => {
        if (!password.trim()) {
            return Alert.alert('Required', 'Please enter your password to continue.');
        }

        setIsPending(true);
        try {
            if (action === 'deactivate') {
                await dangerService.deactivateAccount(password);
                Alert.alert(
                    'Account Deactivated',
                    'Your account has been deactivated. You can reactivate by logging back in.',
                    [{ text: 'OK', onPress: () => { clearAuth(); router.replace('/'); } }],
                );
            } else {
                await dangerService.deleteAccount(password);
                Alert.alert(
                    'Account Deleted',
                    'Your account has been deleted. Financial and contract records are preserved.',
                    [{ text: 'OK', onPress: () => { clearAuth(); router.replace('/'); } }],
                );
            }
            onClose();
        } catch (err: any) {
            const message = err?.response?.data?.message || 'Something went wrong. Please try again.';
            Alert.alert('Error', message);
        } finally {
            setIsPending(false);
        }
    }, [action, password, clearAuth, router, onClose]);

    const isDeactivate = action === 'deactivate';
    const canConfirm = countdown === 0 && password.trim().length > 0 && !isPending;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable className="flex-1 bg-black/70 justify-end" onPress={onClose}>
                <Pressable className="bg-zinc-900 rounded-t-2xl p-5 pb-10" onPress={() => { }}>
                    {/* Header */}
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-full bg-red-500/15 items-center justify-center mr-3">
                            {isDeactivate ? (
                                <AlertTriangle size={20} color="#f87171" />
                            ) : (
                                <Trash2 size={20} color="#f87171" />
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-red-400 text-lg font-['Outfit-SemiBold']">
                                {isDeactivate ? 'Deactivate Account' : 'Delete Account'}
                            </Text>
                        </View>
                    </View>

                    {/* Warning */}
                    <View className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 mb-5">
                        <Text className="text-red-300/80 text-[13px] font-['SourceSans3-Regular'] leading-5">
                            {isDeactivate
                                ? 'Your profile will be hidden and you will be logged out. You can reactivate anytime by logging back in.'
                                : 'This will permanently remove your personal data. Financial and contract records will be preserved for compliance. This action cannot be undone.'}
                        </Text>
                    </View>

                    {/* Password field */}
                    <Text className="text-zinc-400 text-[13px] font-['SourceSans3-Regular'] mb-1 ml-1">
                        Confirm Password
                    </Text>
                    <TextInput
                        className="bg-white/5 rounded-xl px-4 py-3 text-white text-[15px] font-['SourceSans3-Regular'] mb-5"
                        placeholder="Enter your password"
                        placeholderTextColor="#52525b"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        editable={!isPending}
                    />

                    {/* Confirm button with countdown */}
                    <Pressable
                        className={`rounded-xl py-3.5 items-center ${canConfirm
                                ? 'bg-red-600 active:opacity-80'
                                : 'bg-red-600/30'
                            }`}
                        onPress={handleConfirm}
                        disabled={!canConfirm}
                    >
                        {isPending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : countdown > 0 ? (
                            <Text className="text-white/50 text-[15px] font-['Outfit-SemiBold']">
                                {isDeactivate ? 'Deactivate' : 'Permanently Delete'} ({countdown}s)
                            </Text>
                        ) : (
                            <Text className="text-white text-[15px] font-['Outfit-SemiBold']">
                                {isDeactivate ? 'Deactivate My Account' : 'Permanently Delete My Account'}
                            </Text>
                        )}
                    </Pressable>

                    {/* Cancel */}
                    <Pressable
                        className="mt-3 py-3 items-center active:opacity-60"
                        onPress={onClose}
                    >
                        <Text className="text-zinc-400 text-[14px] font-['Outfit-Medium']">Cancel</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

/* ── Main Screen ── */

export default function DangerSettings() {
    const [modalAction, setModalAction] = useState<'deactivate' | 'delete' | null>(null);

    return (
        <>
            <Stack.Screen options={{ title: 'Danger Zone' }} />
            <View className="flex-1 bg-[#09090b]">
                <AppScrollView>
                    <View className="mt-6">
                        {/* Warning banner */}
                        <View className="bg-red-500/5 border border-red-500/10 rounded-xl mx-4 p-4 mb-4">
                            <Text className="text-red-400 text-[13px] font-['SourceSans3-Regular'] leading-5">
                                These actions have serious consequences. Please proceed with caution.
                            </Text>
                        </View>

                        {/* Deactivate */}
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Temporary
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden mb-6">
                            <SettingRow
                                type="danger"
                                label="Deactivate Account"
                                description="Temporarily hide your profile — reversible"
                                onPress={() => setModalAction('deactivate')}
                            />
                        </View>

                        {/* Delete */}
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Permanent
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="danger"
                                label="Delete Account"
                                description="Permanently delete personal data — preserves financial records"
                                onPress={() => setModalAction('delete')}
                            />
                        </View>
                    </View>
                </AppScrollView>
            </View>

            {/* Confirmation Modal */}
            <DangerConfirmModal
                visible={modalAction !== null}
                onClose={() => setModalAction(null)}
                action={modalAction ?? 'deactivate'}
            />
        </>
    );
}
