import { useState, useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import type { EventDoc } from '@/services/eventService';
import { computeSlotsLeft, isCapacityUrgent } from '@/lib/eventTokens';
import { formatRupees } from '@/lib/eventPricing';
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
  const deadlinePassed = !!event.registrationDeadline && Date.now() > new Date(event.registrationDeadline).getTime();

  // CTA label / disabled state — compute up front, switch on registration.
  const ticketPrice = event.pricing?.amount ?? 0;
  const slotsCopy = urgent ? `only ${slotsLeft} left` : `${slotsLeft} left`;

  const ctaLabel = isRegistered
    ? "You're going · Cancel registration"
    : deadlinePassed
      ? 'Registration closed'
      : isFull
        ? 'Sold out'
        : !isLive
          ? 'Not accepting registrations'
          : isFreeRsvp
            ? `Register · ${slotsLeft} ${slotsLeft === 1 ? 'spot' : 'spots'} left`
            : `Get ticket ${formatRupees(ticketPrice)} · ${slotsCopy}`;

  const ctaDisabled = !isRegistered && (deadlinePassed || isFull || !isLive || regLoading);
  const ctaOnPress = isRegistered
    ? () => setCancelOpen(true)
    : () => !ctaDisabled && setSheetOpen(true);

  // Critical: render BOTH sheets unconditionally so they don't unmount when
  // the registration state flips mid-flow. Otherwise the register sheet
  // disappears the instant the mutation succeeds — useMyRegistration
  // refetches, isRegistered flips true, the form-branch JSX unmounts
  // (taking the modal with it), and the receipt card never gets to render.
  // The sheets' own `open` prop controls visibility from now on.
  return (
    <View className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-6 bg-event-bg/95 border-t border-event-border">
      <Pressable
        onPress={ctaOnPress}
        disabled={ctaDisabled}
        className={`rounded-2xl py-4 items-center ${
          isRegistered
            ? 'bg-event-surface border border-event-border'
            : ctaDisabled
              ? 'bg-event-surface'
              : urgent
                ? 'bg-event-capacityUrgent'
                : 'bg-event-brand'
        }`}
      >
        <Text
          className={`font-outfit font-bold text-base ${
            isRegistered
              ? 'text-event-textSecondary font-semibold'
              : ctaDisabled
                ? 'text-event-textMuted'
                : 'text-white'
          }`}
        >
          {ctaLabel}
        </Text>
      </Pressable>

      <EventRegisterSheetV2
        eventId={event._id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
      <CancelRegistrationDialog
        eventId={event._id}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
      />
    </View>
  );
}
