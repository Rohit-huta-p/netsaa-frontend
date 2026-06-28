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

const BG = 'rgba(9,9,11,0.92)';
const HAIRLINE_2 = 'rgba(255,255,255,0.10)';
const SURFACE = 'rgba(255,255,255,0.04)';
const TEXT_0 = '#f4f4f5';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const ORANGE_INK = '#1A0D06';
const PAD = 20;

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

  const ticketPrice = (event as any).pricing?.amount ?? 0;

  const priceLabel = isFreeRsvp ? 'Free' : formatRupees(ticketPrice);

  const buttonLabel = isRegistered
    ? "You're going · Tap to cancel"
    : deadlinePassed
      ? 'Registration closed'
      : isFull
        ? 'Sold out'
        : !isLive
          ? 'Not accepting registrations'
          : 'Reserve →';

  const ctaDisabled = !isRegistered && (deadlinePassed || isFull || !isLive || regLoading);
  const ctaOnPress = isRegistered
    ? () => setCancelOpen(true)
    : () => !ctaDisabled && setSheetOpen(true);

  return (
    <View style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: PAD,
      paddingTop: 14,
      paddingBottom: 24,
      backgroundColor: BG,
      borderTopWidth: 1,
      borderColor: HAIRLINE_2,
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
    }}>
      {/* Price column */}
      <View style={{ paddingHorizontal: 4, justifyContent: 'center' }}>
        <Text className="font-mono" style={{
          color: TEXT_3,
          fontSize: 9.5,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          fontWeight: '600',
          marginBottom: 2,
        }}>
          {isFreeRsvp ? 'Cost' : 'Per seat'}
        </Text>
        <Text className="font-serif" style={{
          color: TEXT_0,
          fontSize: 22,
          lineHeight: 24,
        }}>
          {priceLabel}
        </Text>
      </View>

      {/* CTA */}
      <Pressable
        onPress={ctaOnPress}
        disabled={ctaDisabled && !isRegistered}
        style={{
          flex: 1,
          borderRadius: 12,
          height: 52,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isRegistered
            ? SURFACE
            : ctaDisabled
              ? SURFACE
              : TEXT_0,
          borderWidth: isRegistered || ctaDisabled ? 1 : 0,
          borderColor: HAIRLINE_2,
        }}>
        <Text className="font-outfit" style={{
          color: isRegistered
            ? TEXT_2
            : ctaDisabled
              ? TEXT_3
              : ORANGE_INK,
          fontWeight: '700',
          fontSize: 14,
        }}>
          {urgent && !isRegistered && !ctaDisabled
            ? `Reserve · ${slotsLeft} left →`
            : buttonLabel}
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
