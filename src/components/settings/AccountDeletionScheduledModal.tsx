// src/components/settings/AccountDeletionScheduledModal.tsx
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import dangerService from '@/services/dangerService';
import { useAuthStore } from '@/stores/authStore';

export default function AccountDeletionScheduledModal({
    visible,
    onClose
}: {
    visible: boolean;
    onClose: () => void;
}) {
    const [isRestoring, setIsRestoring] = useState(false);
    const updateAuthUser = useAuthStore(s => s.setAuth);
    const user = useAuthStore(s => s.user);
    const accessToken = useAuthStore(s => s.accessToken);

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            await dangerService.restoreAccount();

            // Optimistically update the user state so they don't see the modal again
            if (user && accessToken) {
                updateAuthUser({
                    user: { ...user, accountStatus: 'active' },
                    accessToken
                });
            }

            onClose();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to restore account. Please try again or contact support.';
            Alert.alert('Error', msg);
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-black/80 justify-center px-5">
                <View className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                    <View className="items-center mb-5">
                        <View className="w-14 h-14 rounded-full bg-red-500/10 items-center justify-center mb-4">
                            <AlertTriangle size={28} color="#ef4444" />
                        </View>
                        <Text className="text-white text-xl font-['Outfit-SemiBold'] text-center mb-2">
                            Account Deletion Scheduled
                        </Text>
                        <Text className="text-zinc-400 text-[14px] font-['SourceSans3-Regular'] text-center leading-5">
                            Your account is currently scheduled for permanent deletion. You have a 30-day grace period to cancel this request and restore your account.
                        </Text>
                    </View>

                    <View className="gap-3 mt-4">
                        <Pressable
                            className={`py-3.5 rounded-xl items-center ${isRestoring ? 'bg-primary/50' : 'bg-primary active:opacity-80'}`}
                            onPress={handleRestore}
                            disabled={isRestoring}
                        >
                            {isRestoring ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className="text-white text-[15px] font-['Outfit-Medium']">
                                    Restore Account
                                </Text>
                            )}
                        </Pressable>

                        <Pressable
                            className="py-3.5 rounded-xl items-center border border-zinc-800 active:bg-zinc-800/50"
                            onPress={onClose}
                            disabled={isRestoring}
                        >
                            <Text className="text-zinc-300 text-[15px] font-['Outfit-Medium']">
                                Dismiss for now
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
