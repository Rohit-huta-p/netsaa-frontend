import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { CheckCircle, AlertCircle, Clock, XCircle, ArrowRight } from 'lucide-react-native';
import { usePayoutAccount } from '@/hooks/usePayoutAccount';
import type { PayoutStatus } from '@/services/payoutService';

interface Props {
  onSetup: () => void;
}

function statusMeta(status: PayoutStatus): {
  icon: React.ReactNode;
  label: string;
  labelColor: string;
  buttonText: string;
  description?: string;
} {
  switch (status) {
    case 'verified':
      return {
        icon: <CheckCircle size={18} color="#22C55E" />,
        label: 'Verified',
        labelColor: 'text-green-400',
        buttonText: 'Manage',
      };
    case 'submitted':
    case 'pending_kyc':
      return {
        icon: <Clock size={18} color="#F59E0B" />,
        label: 'Verification in progress',
        labelColor: 'text-amber-400',
        buttonText: 'Check status',
        description: "Razorpay is reviewing your details. We'll email you when it's done.",
      };
    case 'rejected':
      return {
        icon: <XCircle size={18} color="#EF4444" />,
        label: 'Verification failed',
        labelColor: 'text-red-400',
        buttonText: 'Try again',
        description: 'Your bank details could not be verified. Please re-submit with the correct information.',
      };
    case 'suspended':
      return {
        icon: <AlertCircle size={18} color="#EF4444" />,
        label: 'Account suspended',
        labelColor: 'text-red-400',
        buttonText: 'Contact support',
        description: 'Your payout account has been suspended. Please contact NETSA support.',
      };
    default: // not_started
      return {
        icon: <ArrowRight size={18} color="#FF6B35" />,
        label: 'Not set up',
        labelColor: 'text-event-brand',
        buttonText: 'Set up payouts',
        description:
          'Link your bank account to receive payments instantly when someone registers for your paid event.',
      };
  }
}

export default function PayoutStatusCard({ onSetup }: Props) {
  const { data, isLoading, isError } = usePayoutAccount();

  if (isLoading) {
    return (
      <View className="rounded-2xl bg-event-surface border border-event-border px-4 py-5 items-center gap-3">
        <ActivityIndicator color="#FF6B35" />
        <Text className="font-outfit text-event-textMuted text-sm">Loading payout account…</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="rounded-2xl bg-event-surface border border-event-border px-4 py-5 gap-3">
        <Text className="font-outfit text-event-textSecondary text-sm">
          Could not load payout account. Set up now to receive payments from paid events.
        </Text>
        <Pressable
          onPress={onSetup}
          className="flex-row items-center gap-2 rounded-2xl bg-event-brand px-4 py-3 self-start"
        >
          <Text className="font-outfit font-semibold text-white text-sm">Set up payouts</Text>
          <ArrowRight size={16} color="#ffffff" />
        </Pressable>
      </View>
    );
  }

  const status = data.status;
  const meta = statusMeta(status);

  if (status === 'verified') {
    return (
      <View className="rounded-2xl bg-event-surface border border-event-border px-4 py-5 gap-3">
        {/* Status pill */}
        <View className="flex-row items-center gap-2">
          {meta.icon}
          <Text className={`font-outfit font-semibold text-sm ${meta.labelColor}`}>{meta.label}</Text>
        </View>

        {/* Bank info */}
        <View className="gap-1">
          <Text className="font-outfit font-semibold text-event-textPrimary text-base">
            {data.accountHolderName ?? 'Account holder'}
          </Text>
          <Text className="font-mono text-event-textSecondary text-sm">
            {data.bankName ? `${data.bankName} · ` : ''}
            {'****'}
            {data.bankLast4 ?? ''}
          </Text>
        </View>

        <View className="h-px bg-event-border" />

        <Pressable
          onPress={onSetup}
          className="flex-row items-center gap-2 self-start"
        >
          <Text className="font-outfit text-event-textMuted text-sm">{meta.buttonText}</Text>
          <ArrowRight size={14} color="#9693A0" />
        </Pressable>
      </View>
    );
  }

  return (
    <View className="rounded-2xl bg-event-surface border border-event-border px-4 py-5 gap-3">
      {/* Status pill */}
      <View className="flex-row items-center gap-2">
        {meta.icon}
        <Text className={`font-outfit font-semibold text-sm ${meta.labelColor}`}>{meta.label}</Text>
      </View>

      {meta.description ? (
        <Text className="font-outfit text-event-textSecondary text-sm leading-5">
          {meta.description}
        </Text>
      ) : null}

      <Pressable
        onPress={onSetup}
        className="flex-row items-center gap-2 rounded-2xl bg-event-brand px-4 py-3 self-start"
      >
        <Text className="font-outfit font-semibold text-white text-sm">{meta.buttonText}</Text>
        <ArrowRight size={16} color="#ffffff" />
      </Pressable>
    </View>
  );
}
