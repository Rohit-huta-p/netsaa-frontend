import { Modal, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useCancelMyRegistration } from '@/hooks/useEvents';
import { eventTokens } from '@/lib/eventTokens';

interface Props {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CancelRegistrationDialog({ eventId, open, onClose, onSuccess }: Props) {
  const mutation = useCancelMyRegistration(eventId);

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

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-event-bg p-6 border border-event-border">
          <Text className="font-serif text-event-textPrimary text-xl mb-3">
            Cancel registration?
          </Text>
          <Text className="font-outfit text-event-textSecondary text-sm leading-6 mb-6">
            Your spot will be released back to the event capacity. You can re-register later if spots are still available.
          </Text>

          {mutation.isError ? (
            <Text className="font-outfit text-event-capacityUrgent text-sm mb-3">
              Couldn't cancel right now. Try again.
            </Text>
          ) : null}

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
        </View>
      </View>
    </Modal>
  );
}
