import { useState, useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import type { EventDoc } from '@/services/eventService';
import { computeSlotsLeft, isCapacityUrgent } from '@/lib/eventTokens';
import { useMyRegistration } from '@/hooks/useMyRegistration';
import EventRegisterSheetV2 from '@/components/events/register/EventRegisterSheetV2';
import CancelRegistrationDialog from '@/components/events/register/CancelRegistrationDialog';

interface Props {
  event: EventDoc;
  initialOpen?: boolean;
  onInitialOpenConsumed?: () => void;
}

export default function EventCtaBar({ event, initialOpen, onInitialOpenConsumed }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: myRegistration, isLoading: regLoading } = useMyRegistration(event._id);
  const isRegistered = !!myRegistration;

  useEffect(() => {
    if (initialOpen) {
      setSheetOpen(true);
      onInitialOpenConsumed?.();
    }
  }, [initialOpen]);

  const slotsLeft = computeSlotsLeft(event.capacity.total, event.capacity.registeredCount);
  const urgent = isCapacityUrgent(event.capacity.total, event.capacity.registeredCount);
  const isFull = slotsLeft === 0;
  const isLive = event.status === 'live';
  const isFreeRsvp = event.registrationMode === 'free_rsvp';

  // ─── Registered state ────────────────────────────────────────────────────────
  if (isRegistered) {
    return (
      <View className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-6 bg-event-bg/95 border-t border-event-border">
        <Pressable
          onPress={() => setCancelOpen(true)}
          className="rounded-2xl py-4 items-center bg-event-surface border border-event-border"
        >
          <Text className="font-outfit font-semibold text-base text-event-textSecondary">
            You're going · Cancel registration
          </Text>
        </Pressable>

        <CancelRegistrationDialog
          eventId={event._id}
          open={cancelOpen}
          onClose={() => setCancelOpen(false)}
        />
      </View>
    );
  }

  // ─── Not registered state ─────────────────────────────────────────────────────
  const label = isFull
    ? 'Event full'
    : !isLive
      ? 'Not accepting registrations'
      : isFreeRsvp
        ? `Register · ${slotsLeft} ${slotsLeft === 1 ? 'spot' : 'spots'} left`
        : `Get ticket · ${slotsLeft} left`;

  const disabled = isFull || !isLive || regLoading;

  return (
    <View className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-6 bg-event-bg/95 border-t border-event-border">
      <Pressable
        onPress={() => !disabled && setSheetOpen(true)}
        disabled={disabled}
        className={`rounded-2xl py-4 items-center ${disabled ? 'bg-event-surface' : urgent ? 'bg-event-capacityUrgent' : 'bg-event-brand'}`}
      >
        <Text className={`font-outfit font-bold text-base ${disabled ? 'text-event-textMuted' : 'text-white'}`}>
          {label}
        </Text>
      </Pressable>

      <EventRegisterSheetV2
        eventId={event._id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}
