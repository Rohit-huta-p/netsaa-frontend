/**
 * CancellationReasonModal — attendee cancels their registration.
 *
 * - Shows a refund preview computed client-side from event.cancellationPolicy
 *   (mirrors backend computeRefundPaise windows; attendee eats the service fee).
 * - Collects a reason (radio + optional free text for "Something else").
 * - On confirm → useCancelRegistration → calls onCancelled(result).
 *
 * Sprint 3, Task 7.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useCancelRegistration } from '@/hooks/useEvents';
import type { EventDoc, EventCancellationPolicy } from '@/services/eventService';
import { PROCESSING_FEE_PERCENT } from '@/lib/eventPricing';

export interface CancelRegistrationResult {
  status: string;
  refundId: string | null;
  refundAmountPaise: number;
}

interface Props {
  visible: boolean;
  registrationId: string | undefined;
  event: EventDoc;
  onClose: () => void;
  onCancelled: (result: CancelRegistrationResult) => void;
}

const REASONS = [
  'Schedule conflict',
  'Health or travel',
  'Changed my mind',
  'Something else',
] as const;

// ── Refund preview ──────────────────────────────────────────────────────────
function computeRefundPreview(
  event: EventDoc,
  ticketPriceRupees: number,
): { label: string; detail: string } {
  const isFree = event.registrationMode === 'free_rsvp' || ticketPriceRupees === 0;
  if (isFree) {
    return {
      label: 'Free event',
      detail: 'Your seat will be released back to event capacity.',
    };
  }

  const policy: EventCancellationPolicy | undefined = event.cancellationPolicy;
  const now = Date.now();

  const serviceFee = Math.round(ticketPriceRupees * (PROCESSING_FEE_PERCENT / 100) * 100) / 100;

  if (policy?.fullRefundUntil && now <= new Date(policy.fullRefundUntil).getTime()) {
    return {
      label: `Full refund · ₹${ticketPriceRupees.toLocaleString('en-IN')}`,
      detail: 'To your payment method in 3–5 business days · service fee non-refundable',
    };
  }

  if (
    policy?.partialRefundUntil &&
    policy?.partialRefundPercent != null &&
    now <= new Date(policy.partialRefundUntil).getTime()
  ) {
    const refundAmount =
      Math.round(ticketPriceRupees * (policy.partialRefundPercent / 100) * 100) / 100;
    return {
      label: `${policy.partialRefundPercent}% refund · ₹${refundAmount.toLocaleString('en-IN')}`,
      detail: '3–5 business days · service fee non-refundable',
    };
  }

  return {
    label: 'No refund',
    detail: 'Outside the cancellation window — no refund will be issued.',
  };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function CancellationReasonModal({
  visible,
  registrationId,
  event,
  onClose,
  onCancelled,
}: Props) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cancelMutation = useCancelRegistration();

  const ticketPriceRupees: number = (event as any).pricing?.amount ?? 0;
  const refundPreview = computeRefundPreview(event, ticketPriceRupees);

  const handleConfirm = async () => {
    if (!selectedReason) {
      setError('Please select a reason to continue.');
      return;
    }
    if (!registrationId) {
      setError('Registration not found. Please close and try again.');
      return;
    }
    const reason =
      selectedReason === 'Something else' && freeText.trim()
        ? `Something else: ${freeText.trim()}`
        : selectedReason;

    setError(null);
    try {
      const result = await cancelMutation.mutateAsync({ id: registrationId, reason });
      // Reset local state for next open
      setSelectedReason(null);
      setFreeText('');
      onCancelled(result);
    } catch {
      setError("Couldn't cancel right now. Please try again.");
    }
  };

  const handleClose = () => {
    if (cancelMutation.isPending) return;
    setSelectedReason(null);
    setFreeText('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-event-bg border border-event-border p-6">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Text className="font-serif text-event-textPrimary text-xl mb-1">
              Cancel registration?
            </Text>
            <Text className="font-outfit text-event-textMuted text-sm mb-5">
              {event.title}
            </Text>

            {/* Refund preview */}
            <View className="rounded-xl bg-event-surface border border-event-border p-4 mb-5">
              <Text className="font-outfit font-bold text-event-textPrimary text-sm mb-1">
                {refundPreview.label}
              </Text>
              <Text className="font-outfit text-event-textMuted text-xs leading-5">
                {refundPreview.detail}
              </Text>
            </View>

            {/* Reason list */}
            <Text className="font-outfit font-semibold text-event-textSecondary text-xs uppercase tracking-wider mb-3">
              Why are you cancelling?
            </Text>
            {REASONS.map((reason) => (
              <Pressable
                key={reason}
                onPress={() => setSelectedReason(reason)}
                className="flex-row items-center gap-3 py-3 border-b border-event-border"
              >
                <View
                  className={`w-4 h-4 rounded-full border-2 items-center justify-center ${
                    selectedReason === reason
                      ? 'border-event-brand bg-event-brand'
                      : 'border-event-border'
                  }`}
                >
                  {selectedReason === reason ? (
                    <View className="w-1.5 h-1.5 rounded-full bg-white" />
                  ) : null}
                </View>
                <Text className="font-outfit text-event-textPrimary text-sm flex-1">
                  {reason}
                </Text>
              </Pressable>
            ))}

            {/* Free text for "Something else" */}
            {selectedReason === 'Something else' ? (
              <TextInput
                value={freeText}
                onChangeText={setFreeText}
                placeholder="Tell us more (optional)"
                placeholderTextColor="#6B6878"
                multiline
                maxLength={200}
                className="font-outfit text-event-textPrimary text-sm border border-event-border rounded-xl bg-event-surface p-3 mt-3 min-h-[72px]"
                style={{ textAlignVertical: 'top' }}
              />
            ) : null}

            {/* Error */}
            {error ? (
              <Text className="font-outfit text-event-capacityUrgent text-sm mt-3">
                {error}
              </Text>
            ) : null}

            {/* Actions */}
            <View className="flex-row gap-3 mt-5">
              <Pressable
                onPress={handleClose}
                disabled={cancelMutation.isPending}
                className="flex-1 rounded-2xl py-3 items-center bg-event-surface border border-event-border"
              >
                <Text className="font-outfit font-semibold text-event-textPrimary">
                  Keep my seat
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                disabled={cancelMutation.isPending || !selectedReason}
                className="flex-1 rounded-2xl py-3 items-center"
                style={{
                  backgroundColor:
                    cancelMutation.isPending || !selectedReason
                      ? 'rgba(239,68,68,0.4)'
                      : '#EF4444',
                }}
              >
                {cancelMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-outfit font-bold text-white">
                    Cancel registration
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
