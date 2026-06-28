import { useState, useEffect } from 'react';
import { View, Pressable, Text, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import type { EventDoc } from '@/services/eventService';
import { eventService } from '@/services/eventService';
import { computeSlotsLeft, isCapacityUrgent } from '@/lib/eventTokens';
import { formatRupees } from '@/lib/eventPricing';
import { useMyRegistration } from '@/hooks/useMyRegistration';
import { useMyWaitlistEntry } from '@/hooks/useMyWaitlistEntry';
import { useQueryClient } from '@tanstack/react-query';
import EventRegisterSheetV2 from '@/components/events/register/EventRegisterSheetV2';
import CancellationReasonModal, { type CancelRegistrationResult } from '@/components/events/register/CancellationReasonModal';
import RefundStatusCard from '@/components/events/register/RefundStatusCard';
import { DPDPConsentScreen } from '@/components/events/register/DPDPConsentScreen';
import { useRegisterFlowStore } from '@/stores/registerFlowStore';
import WaitlistJoinSheet from '@/components/events/register/WaitlistJoinSheet';
import LeaveWaitlistConfirm from '@/components/events/register/LeaveWaitlistConfirm';

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
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [cancelResult, setCancelResult] = useState<CancelRegistrationResult | null>(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [confirmingPromotion, setConfirmingPromotion] = useState(false);
  const recordConsent = useRegisterFlowStore((s) => s.recordConsent);
  const isConsentValid = useRegisterFlowStore((s) => s.isConsentValid);
  // subscribe to the timestamp so the bar re-evaluates after consent is recorded
  const dpdpConsentAt = useRegisterFlowStore((s) => s.dpdpConsentAt);
  const queryClient = useQueryClient();

  // Open the register sheet, gating first-timers through one-time DPDP consent.
  const openRegister = () => {
    const consented = !!dpdpConsentAt && isConsentValid();
    if (consented) setSheetOpen(true);
    else setConsentOpen(true);
  };

  const { data: myRegistration, isLoading: regLoading } = useMyRegistration(event._id);
  const { data: myWaitlist } = useMyWaitlistEntry(event._id);
  const isRegistered = !!myRegistration;

  useEffect(() => {
    if (initialOpen) {
      openRegister();
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

  const buttonLabel = deadlinePassed
    ? 'Registration closed'
    : isFull
      ? 'Sold out'
      : !isLive
        ? 'Not accepting registrations'
        : urgent
          ? `Reserve · ${slotsLeft} left →`
          : 'Reserve →';

  const ctaDisabled = deadlinePassed || isFull || !isLive || regLoading;

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
      gap: 0,
    }}>
      {/* Price + CTA row */}
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
        {/* Price / status column */}
        <View style={{ paddingHorizontal: 4, justifyContent: 'center' }}>
          {isRegistered ? (
            <>
              <Text className="font-mono" style={{
                color: TEXT_3,
                fontSize: 9.5,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                fontWeight: '600',
                marginBottom: 2,
              }}>
                Status
              </Text>
              <Text className="font-serif" style={{
                color: '#22C55E',
                fontSize: 18,
                lineHeight: 22,
              }}>
                You're going ✓
              </Text>
            </>
          ) : (
            <>
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
            </>
          )}
        </View>

        {isRegistered ? (
          /* Registered state: View ticket (primary flex) + Cancel (secondary smaller) */
          <>
            <Pressable
              onPress={() => router.push(`/events/${event._id}/ticket?registrationId=${myRegistration?._id}`)}
              style={{
                flex: 1,
                borderRadius: 12,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: TEXT_0,
              }}>
              <Text className="font-outfit" style={{
                color: ORANGE_INK,
                fontWeight: '700',
                fontSize: 14,
              }}>
                View ticket →
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setCancelOpen(true)}
              style={{
                borderRadius: 12,
                height: 52,
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: HAIRLINE_2,
              }}>
              <Text className="font-outfit" style={{
                color: TEXT_2,
                fontWeight: '600',
                fontSize: 13,
              }}>
                Cancel
              </Text>
            </Pressable>
          </>
        ) : (
          /* Not registered — waitlist-aware CTA precedence:
           * 1. promoted  → "Seat open — confirm"  (green)
           * 2. waiting   → "On waitlist · #N"      (secondary, tap to leave)
           * 3. full + allowWaitlist → "Join waitlist"
           * 4. full + !allowWaitlist → "Sold out"  (disabled)
           * 5. else → existing Reserve path
           */
          myWaitlist?.status === 'promoted' ? (
            <Pressable
              onPress={async () => {
                if (isFreeRsvp) {
                  // Free event: confirm directly, then flip to "View ticket"
                  setConfirmingPromotion(true);
                  try {
                    const key = `wl_${myWaitlist._id}_${Date.now()}`;
                    await eventService.confirmPromotion(myWaitlist._id, key);
                    queryClient.invalidateQueries({ queryKey: ['myRegistration', event._id] });
                    queryClient.invalidateQueries({ queryKey: ['myWaitlist', event._id] });
                  } finally {
                    setConfirmingPromotion(false);
                  }
                } else {
                  // Paid event: open the reserve/register sheet
                  openRegister();
                }
              }}
              disabled={confirmingPromotion}
              style={{
                flex: 1,
                borderRadius: 12,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#22C55E',
              }}
            >
              {confirmingPromotion ? (
                <ActivityIndicator color={ORANGE_INK} />
              ) : (
                <Text className="font-outfit" style={{ color: ORANGE_INK, fontWeight: '700', fontSize: 14 }}>
                  Seat open — confirm →
                </Text>
              )}
            </Pressable>
          ) : myWaitlist?.status === 'waiting' ? (
            <Pressable
              onPress={() => setLeaveOpen(true)}
              style={{
                flex: 1,
                borderRadius: 12,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: HAIRLINE_2,
              }}
            >
              <Text className="font-outfit" style={{ color: TEXT_2, fontWeight: '600', fontSize: 14 }}>
                On waitlist · #{myWaitlist.position}
              </Text>
            </Pressable>
          ) : isFull && event.allowWaitlist ? (
            <Pressable
              onPress={() => setWaitlistOpen(true)}
              style={{
                flex: 1,
                borderRadius: 12,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: TEXT_0,
              }}
            >
              <Text className="font-outfit" style={{ color: ORANGE_INK, fontWeight: '700', fontSize: 14 }}>
                Join waitlist →
              </Text>
            </Pressable>
          ) : (
            /* Sold out (no waitlist) or normal Reserve path */
            <Pressable
              onPress={() => !ctaDisabled && openRegister()}
              disabled={ctaDisabled}
              style={{
                flex: 1,
                borderRadius: 12,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: ctaDisabled ? SURFACE : TEXT_0,
                borderWidth: ctaDisabled ? 1 : 0,
                borderColor: HAIRLINE_2,
              }}
            >
              <Text className="font-outfit" style={{
                color: ctaDisabled ? TEXT_3 : ORANGE_INK,
                fontWeight: '700',
                fontSize: 14,
              }}>
                {buttonLabel}
              </Text>
            </Pressable>
          )
        )}
      </View>

      {/* Refund status card — shown after successful cancellation */}
      {cancelResult ? (
        <RefundStatusCard
          refundAmountPaise={cancelResult.refundAmountPaise}
          refundId={cancelResult.refundId}
        />
      ) : null}

      <Modal
        visible={consentOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setConsentOpen(false)}
      >
        <DPDPConsentScreen
          onAgree={() => { recordConsent(); setConsentOpen(false); setSheetOpen(true); }}
          onClose={() => setConsentOpen(false)}
        />
      </Modal>
      <EventRegisterSheetV2
        eventId={event._id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
      <CancellationReasonModal
        visible={cancelOpen}
        registrationId={myRegistration?._id}
        event={event}
        onClose={() => setCancelOpen(false)}
        onCancelled={(result) => {
          setCancelOpen(false);
          setCancelResult(result);
          // Flip CTA back to "Reserve" by clearing myRegistration
          queryClient.invalidateQueries({ queryKey: ['myRegistration', event._id] });
        }}
      />
      <WaitlistJoinSheet
        visible={waitlistOpen}
        event={event}
        onClose={() => setWaitlistOpen(false)}
        onJoined={() => {
          setWaitlistOpen(false);
          queryClient.invalidateQueries({ queryKey: ['myWaitlist', event._id] });
        }}
      />
      {myWaitlist && myWaitlist.status === 'waiting' && (
        <LeaveWaitlistConfirm
          visible={leaveOpen}
          eventId={event._id}
          position={myWaitlist.position}
          onClose={() => setLeaveOpen(false)}
          onLeft={() => {
            setLeaveOpen(false);
            queryClient.invalidateQueries({ queryKey: ['myWaitlist', event._id] });
          }}
        />
      )}
    </View>
  );
}
