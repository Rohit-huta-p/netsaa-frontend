// app/(app)/settings/payments.tsx
import React from 'react';
import { View, Text, Alert } from 'react-native';
import { Stack } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useAuthStore } from '@/stores/authStore';
import { CreditCard, Building, Wallet, Receipt } from 'lucide-react-native';

export default function PaymentSettings() {
    const role = useAuthStore((s) => s.user?.role);

    const handlePaymentMethods = () => {
        Alert.alert('Coming Soon', 'Payment method management will be available in a future update.');
    };

    const handleBankAccount = () => {
        Alert.alert('Coming Soon', 'Bank account linking will be available in a future update.');
    };

    const handlePayoutSetup = () => {
        Alert.alert('Coming Soon', 'Payout configuration will be available in a future update.');
    };

    const handleGST = () => {
        Alert.alert('Coming Soon', 'GST settings will be available in a future update.');
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Payments' }} />
            <View className="flex-1 bg-[#09090b]">
                <AppScrollView>
                    {/* Common — visible to all roles */}
                    <View className="mt-6">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                            Payment Setup
                        </Text>
                        <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                            <SettingRow
                                type="nav"
                                label="Payment Methods"
                                description="Manage your credit/debit cards"
                                icon={<CreditCard size={20} color="#a78bfa" />}
                                onPress={handlePaymentMethods}
                            />
                            <SettingRow
                                type="nav"
                                label="Bank Account"
                                description="Link account for payouts"
                                icon={<Building size={20} color="#a78bfa" />}
                                onPress={handleBankAccount}
                            />
                        </View>
                    </View>

                    {/* Artist-only — payout setup */}
                    {role === 'artist' && (
                        <View className="mt-8">
                            <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                                Artist Payouts
                            </Text>
                            <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                                <SettingRow
                                    type="nav"
                                    label="Payout Setup"
                                    description="Configure how you receive gig payments"
                                    icon={<Wallet size={20} color="#a78bfa" />}
                                    onPress={handlePayoutSetup}
                                />
                            </View>
                        </View>
                    )}

                    {/* Organizer-only — GST / invoicing */}
                    {role === 'organizer' && (
                        <View className="mt-8">
                            <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-5 mb-2">
                                Tax & Invoicing
                            </Text>
                            <View className="bg-white/[0.03] rounded-xl mx-4 overflow-hidden">
                                <SettingRow
                                    type="nav"
                                    label="GST Settings"
                                    description="GST number & invoice preferences"
                                    icon={<Receipt size={20} color="#a78bfa" />}
                                    onPress={handleGST}
                                />
                            </View>
                        </View>
                    )}
                </AppScrollView>
            </View>
        </>
    );
}
