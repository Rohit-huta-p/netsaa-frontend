import { useState } from 'react';
import { Modal, View, Text, Pressable, Switch, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { useRegisterForEvent } from '@/hooks/useEvents';
import { eventTokens } from '@/lib/eventTokens';

interface Props {
  eventId: string;
  open: boolean;
  onClose: () => void;
}

export default function EventRegisterSheetV2({ eventId, open, onClose }: Props) {
  const [showPublic, setShowPublic] = useState(false); // default private
  const [submitted, setSubmitted] = useState(false);
  const mutation = useRegisterForEvent(eventId);

  const onConfirm = async () => {
    try {
      await mutation.mutateAsync(showPublic ? 'public' : 'private');
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1400);
    } catch {
      // surface error inline
    }
  };

  if (!open) return null;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-event-bg rounded-t-3xl px-6 pt-5 pb-8 border-t border-event-border">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="font-serif text-event-textPrimary text-2xl">Confirm registration</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={24} color={eventTokens.textSecondary} />
            </Pressable>
          </View>

          {submitted ? (
            <View className="py-10 items-center gap-3">
              <Text className="text-event-brand text-3xl">✓</Text>
              <Text className="font-outfit text-event-textPrimary text-base">You're in.</Text>
              <Text className="font-outfit text-event-textSecondary text-sm">Details sent via push + email.</Text>
            </View>
          ) : (
            <>
              <View className="flex-row items-center justify-between p-4 rounded-2xl bg-event-surface border border-event-border mb-3">
                <View className="flex-1 pr-3">
                  <Text className="font-outfit text-event-textPrimary text-base font-semibold">
                    Show I'm going to others
                  </Text>
                  <Text className="font-outfit text-event-textSecondary text-xs mt-1">
                    Off by default. Organizer always sees registrations.
                  </Text>
                </View>
                <Switch
                  testID="visibility-toggle"
                  value={showPublic}
                  onValueChange={setShowPublic}
                  accessibilityState={{ checked: showPublic }}
                  trackColor={{ false: '#252330', true: eventTokens.brand }}
                  thumbColor="#F5F4F0"
                />
              </View>

              <Text className="font-outfit text-event-textSecondary text-xs mb-5 leading-5">
                Your phone number and email are shared with the organizer only when hire is confirmed downstream — not at registration. (Per NETSA's privacy policy.)
              </Text>

              {mutation.isError ? (
                <Text className="font-outfit text-event-capacityUrgent text-sm mb-3">
                  Couldn't register. Event may be full. Try again.
                </Text>
              ) : null}

              <Pressable
                onPress={onConfirm}
                disabled={mutation.isPending}
                className={`rounded-2xl py-4 items-center ${mutation.isPending ? 'bg-event-surface' : 'bg-event-brand'}`}
              >
                {mutation.isPending ? (
                  <ActivityIndicator color={eventTokens.textPrimary} />
                ) : (
                  <Text className="font-outfit font-bold text-white text-base">Confirm</Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
