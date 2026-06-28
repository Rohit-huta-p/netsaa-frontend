import { useState } from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { openRazorpayCheckout } from '@/lib/razorpayCheckout';
import { eventTokens } from '@/lib/eventTokens';

interface Props {
  visible: boolean;
  orderId: string | null;
  eventId: string;
  eventTitle: string;
  amountPaise: number;
  prefill: { name: string; email: string; contact: string };
  onClose: () => void;
  onRetrySuccess: () => void;
}

export default function PaymentRetrySheet({
  visible,
  orderId,
  eventTitle,
  amountPaise,
  prefill,
  onClose,
  onRetrySuccess,
}: Props) {
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const handleRetry = async () => {
    if (!orderId) return;
    setRetrying(true);
    setRetryError(null);
    try {
      await openRazorpayCheckout({
        key_id: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID!,
        order_id: orderId,
        amount: amountPaise,
        currency: 'INR',
        eventTitle,
        prefill,
      });
      // Razorpay success — parent polls until webhook confirms registration
      onRetrySuccess();
    } catch (err: any) {
      const desc = err?.description ?? err?.message ?? 'Payment cancelled.';
      setRetryError(desc);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 24 }}
      >
        <View
          className="w-full rounded-3xl bg-event-bg border border-event-border"
          style={{ maxWidth: 400, padding: 24 }}
        >
          {/* Header row */}
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-row items-center gap-2 flex-1 pr-3">
              <AlertCircle size={20} color={eventTokens.capacityUrgent ?? '#EF4444'} />
              <Text className="font-serif text-event-textPrimary text-lg flex-1">
                Payment didn't go through
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={20} color={eventTokens.textSecondary} />
            </Pressable>
          </View>

          <Text className="font-outfit text-event-textSecondary text-sm mb-6 leading-5">
            Your seats are held for a few more minutes. You can try again with a different payment method using the same order.
          </Text>

          {retryError ? (
            <Text className="font-outfit text-event-capacityUrgent text-sm mb-4">
              {retryError}
            </Text>
          ) : null}

          {/* Primary CTA */}
          <Pressable
            onPress={handleRetry}
            disabled={retrying || !orderId}
            className={`rounded-2xl py-4 items-center mb-3 ${retrying || !orderId ? 'bg-event-surface' : 'bg-event-brand'}`}
          >
            {retrying ? (
              <ActivityIndicator color={eventTokens.textPrimary} />
            ) : (
              <Text className="font-outfit font-bold text-white text-base">Try another method</Text>
            )}
          </Pressable>

          {/* Secondary cancel */}
          <Pressable
            onPress={onClose}
            disabled={retrying}
            className="rounded-2xl py-4 items-center bg-event-surface border border-event-border"
          >
            <Text className="font-outfit text-event-textSecondary text-base">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
