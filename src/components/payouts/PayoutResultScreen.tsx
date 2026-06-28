import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check, X, Clock } from 'lucide-react-native';
import type { PayoutStatus } from '@/services/payoutService';

interface Props {
  status: PayoutStatus;
  rejectionReason?: string;
  onPrimary: () => void;
  onRetry?: () => void;
}

export default function PayoutResultScreen({ status, rejectionReason, onPrimary, onRetry }: Props) {
  if (status === 'verified') {
    return (
      <View className="flex-1 items-center justify-center gap-6 px-6 py-10">
        <View className="w-20 h-20 rounded-full bg-green-500/20 items-center justify-center">
          <Check size={40} color="#22C55E" strokeWidth={2.5} />
        </View>
        <View className="items-center gap-2">
          <Text className="font-serif text-event-textPrimary text-3xl text-center">
            You're all set
          </Text>
          <Text className="font-outfit text-event-textSecondary text-base text-center leading-6">
            Your bank account is verified and linked. You'll receive payouts instantly after each paid event.
          </Text>
        </View>
        <Pressable
          onPress={onPrimary}
          className="w-full rounded-2xl py-4 items-center bg-event-brand mt-2"
        >
          <Text className="font-outfit font-bold text-white text-base">Done</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'pending_kyc' || status === 'submitted') {
    return (
      <View className="flex-1 items-center justify-center gap-6 px-6 py-10">
        <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center">
          <Clock size={40} color="#F59E0B" strokeWidth={2.5} />
        </View>
        <View className="items-center gap-2">
          <Text className="font-serif text-event-textPrimary text-3xl text-center">
            Verification in progress
          </Text>
          <Text className="font-outfit text-event-textSecondary text-base text-center leading-6">
            We'll email you within a few hours once Razorpay completes KYC.{'\n'}No action needed on your end.
          </Text>
        </View>
        <Pressable
          onPress={onPrimary}
          className="w-full rounded-2xl py-4 items-center bg-event-brand mt-2"
        >
          <Text className="font-outfit font-bold text-white text-base">Done</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'rejected') {
    return (
      <View className="flex-1 items-center justify-center gap-6 px-6 py-10">
        <View className="w-20 h-20 rounded-full bg-red-500/20 items-center justify-center">
          <X size={40} color="#EF4444" strokeWidth={2.5} />
        </View>
        <View className="items-center gap-2">
          <Text className="font-serif text-event-textPrimary text-3xl text-center">
            Couldn't verify
          </Text>
          {rejectionReason ? (
            <View className="rounded-2xl bg-event-surface border border-red-500/30 px-4 py-3 mt-1">
              <Text className="font-outfit text-event-textSecondary text-sm text-center leading-5">
                {rejectionReason}
              </Text>
            </View>
          ) : (
            <Text className="font-outfit text-event-textSecondary text-base text-center leading-6">
              We couldn't verify your details. Please check your PAN and bank information and try again.
            </Text>
          )}
        </View>
        <Pressable
          onPress={onRetry}
          className="w-full rounded-2xl py-4 items-center bg-event-brand mt-2"
        >
          <Text className="font-outfit font-bold text-white text-base">Try again</Text>
        </Pressable>
      </View>
    );
  }

  // Fallback / not_started / suspended
  return (
    <View className="flex-1 items-center justify-center gap-6 px-6 py-10">
      <View className="w-20 h-20 rounded-full bg-event-surface border border-event-border items-center justify-center">
        <Clock size={40} color="#6E6C76" strokeWidth={2} />
      </View>
      <View className="items-center gap-2">
        <Text className="font-serif text-event-textPrimary text-3xl text-center">
          Something went wrong
        </Text>
        <Text className="font-outfit text-event-textSecondary text-base text-center leading-6">
          Please close and try again.
        </Text>
      </View>
      <Pressable
        onPress={onPrimary}
        className="w-full rounded-2xl py-4 items-center bg-event-surface border border-event-border mt-2"
      >
        <Text className="font-outfit font-bold text-event-textMuted text-base">Close</Text>
      </Pressable>
    </View>
  );
}
