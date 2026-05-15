import { Modal, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useCancelMyRegistration, useEvent } from '@/hooks/useEvents';
import { useMyRegistration } from '@/hooks/useMyRegistration';
import { eventTokens } from '@/lib/eventTokens';

interface Props {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type RefundState =
  | { kind: 'free' }
  | { kind: 'flex_24h_eligible'; amount: number }
  | { kind: 'flex_24h_outside_window' }
  | { kind: 'firm'; amount: number }
  | { kind: 'custom' };

function computeRefundState(
  paymentStatus: string | undefined,
  paidAmount: number | undefined,
  refundPolicy: string | undefined,
  startsAt: string | Date | undefined,
): RefundState {
  // Free or unpaid → no refund logic
  if (!paidAmount || paymentStatus !== 'completed') return { kind: 'free' };

  const policy = refundPolicy ?? 'flex_24h';
  if (policy === 'firm') return { kind: 'firm', amount: paidAmount };
  if (policy === 'custom') return { kind: 'custom' };

  // flex_24h
  const startMs = startsAt ? new Date(startsAt).getTime() : 0;
  const hoursUntil = (startMs - Date.now()) / 3_600_000;
  if (hoursUntil > 24) return { kind: 'flex_24h_eligible', amount: paidAmount };
  return { kind: 'flex_24h_outside_window' };
}

function refundMessage(state: RefundState): string {
  switch (state.kind) {
    case 'free':
      return 'Your spot will be released back to the event capacity. You can re-register later if spots are still available.';
    case 'flex_24h_eligible':
      return `Full refund of ₹${state.amount} will be issued via Razorpay to your original payment method. Processing typically takes 5-7 business days.`;
    case 'flex_24h_outside_window':
      return 'Cancellation window has passed. You can keep your registration, but no refund is available within 24 hours of the event.';
    case 'firm':
      return `No refunds — the organizer set this event's policy to firm. Your registration cost (₹${state.amount}) is non-refundable. Cancel anyway?`;
    case 'custom':
      return "This event has a custom refund policy. Your cancellation will be sent to the organizer for review. We'll update you within 48 hours.";
  }
}

export default function CancelRegistrationDialog({ eventId, open, onClose, onSuccess }: Props) {
  const mutation = useCancelMyRegistration(eventId);
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: registration, isLoading: regLoading } = useMyRegistration(eventId);

  const handle = async () => {
    try {
      await mutation.mutateAsync();
      onSuccess?.();
      onClose();
    } catch {
      // error surfaced inline below
    }
  };

  if (!open) return null;

  const isLoading = eventLoading || regLoading;
  const hasNoRegistration = !isLoading && registration === null;

  const refundState = computeRefundState(
    (registration as any)?.paymentStatus,
    (registration as any)?.paidAmount,
    (event as any)?.pricing?.refundPolicy,
    (event as any)?.startsAt,
  );

  const cancelDisabled = refundState.kind === 'flex_24h_outside_window';

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-event-bg p-6 border border-event-border">
          <Text className="font-serif text-event-textPrimary text-xl mb-3">
            Cancel registration?
          </Text>

          {isLoading ? (
            <View className="py-6 items-center">
              <ActivityIndicator color={eventTokens.textPrimary} />
            </View>
          ) : hasNoRegistration ? (
            <Text className="font-outfit text-event-textSecondary text-sm leading-6 mb-6">
              No active registration found.
            </Text>
          ) : (
            <Text className="font-outfit text-event-textSecondary text-sm leading-6 mb-6">
              {refundMessage(refundState)}
            </Text>
          )}

          {mutation.isError ? (
            <Text className="font-outfit text-event-capacityUrgent text-sm mb-3">
              Couldn't cancel right now. Try again.
            </Text>
          ) : null}

          {isLoading ? null : hasNoRegistration ? (
            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="flex-1 rounded-2xl py-3 items-center bg-event-surface border border-event-border"
              >
                <Text className="font-outfit text-event-textPrimary">Close</Text>
              </Pressable>
            </View>
          ) : cancelDisabled ? (
            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="flex-1 rounded-2xl py-3 items-center bg-event-surface border border-event-border"
              >
                <Text className="font-outfit text-event-textPrimary">Keep my spot</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                disabled={mutation.isPending}
                className="flex-1 rounded-2xl py-3 items-center bg-event-surface border border-event-border"
              >
                <Text className="font-outfit text-event-textPrimary">Keep my spot</Text>
              </Pressable>
              <Pressable
                onPress={handle}
                disabled={mutation.isPending}
                className="flex-1 rounded-2xl py-3 items-center bg-event-capacityUrgent"
              >
                {mutation.isPending
                  ? <ActivityIndicator color={eventTokens.textPrimary} />
                  : <Text className="font-outfit font-bold text-white">Yes, cancel</Text>}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
