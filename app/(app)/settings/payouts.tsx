import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import AppScrollView from '@/components/AppScrollView';
import PayoutStatusCard from '@/components/payouts/PayoutStatusCard';
import PayoutSetupWizard from '@/components/payouts/PayoutSetupWizard';
import type { PayoutStatus } from '@/services/payoutService';

export default function PayoutsSettings() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleDone = (status: PayoutStatus) => {
    setWizardOpen(false);
    // Refresh the payout card after wizard completes
    queryClient.invalidateQueries({ queryKey: ['payoutAccount', 'me'] });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Payouts' }} />

      <AppScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        {/* Header */}
        <View className="gap-1">
          <Text className="font-serif text-white text-3xl">Payouts</Text>
          <Text className="font-outfit text-[#9693A0] text-sm leading-5">
            Manage the bank account where your event earnings are settled.
          </Text>
        </View>

        {/* Status card */}
        <PayoutStatusCard onSetup={() => setWizardOpen(true)} />

        {/* Explainer */}
        <View className="rounded-2xl bg-[#0F0E15] border border-[#2A2833] px-4 py-4 gap-2">
          <Text className="font-mono text-[#FF6B35] text-[10px] uppercase tracking-widest">
            How it works
          </Text>
          <Text className="font-outfit text-[#9693A0] text-sm leading-6">
            When someone registers for a paid event, Razorpay splits the payment instantly — your share lands in your linked bank account, NETSA keeps 0.5%. No holding, no escrow.
          </Text>
        </View>
      </AppScrollView>

      <PayoutSetupWizard
        visible={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onDone={handleDone}
      />
    </>
  );
}
