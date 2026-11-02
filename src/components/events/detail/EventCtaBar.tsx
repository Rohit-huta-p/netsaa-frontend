import { useState, useEffect } from 'react';
import { View, Pressable, Text, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import type { EventDoc } from '@/services/eventService';
import { eventService } from '@/services/eventService';
import { computeSlotsLeft, isCapacityUrgent } from '@/lib/eventTokens';
import { formatRupees } from '@/lib/eventPricing';
import { openRazorpayCheckout } from '@/lib/razorpayCheckout';
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
import { ctaLabel, refundLabel, closesLabel } from '@/lib/eventDetailV3';

interface Props {
  event: EventDoc;
  initialOpen?: boolean;
  onInitialOpenConsumed?: () => void;
  /** Organizer preview: render the bar as a viewer sees it, but inert (the
   *  organizer can't register for their own event). */
  preview?: boolean;
  /** E·9 photo-led page: "₹X onwards" button + refund·closing ribbon. */
  v3?: boolean;
}

const BG = 'rgba(9,9,11,0.92)';
const HAIRLINE_2 = 'rgba(255,255,255,0.10)';
const SURFACE = 'rgba(255,255,255,0.04)';
const TEXT_0 = '#f4f4f5';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const ORANGE_INK = '#1A0D06';
const PAD = 20;

export default function EventCtaBar({ event, initialOpen, onInitialOpenConsumed, preview, v3 }: Props) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [cancelResult, setCancelResult] = useState<CancelRegistrationResult | null>(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [confirmingPromotion, setConfirmingPromotion] = useState(false);
  const [payingApproval, setPayingApproval] = useState(false);
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

  // Registration status (approval flow): a non-null registration may be pending /
  // approved / declined, not only a confirmed ticket — branch the CTA accordingly.
  const regStatus: string | undefined = (myRegistration as any)?.status;
  const hasAnyReg = !!myRegistration;
  const isConfirmed = regStatus === 'registered' || regStatus === 'attended' || regStatus === 'no-show';
  const isPending = regStatus === 'pending';
  const isApproved = regStatus === 'approved';
  const isDeclined = regStatus === 'declined';
  const pendingPayment = (myRegistration as any)?.pendingPayment as
    | { reservationId: string; razorpayOrderId: string; amountPaise: number; payBy?: string }
    | undefined;
  const hoursToPay = pendingPayment?.payBy
    ? Math.max(0, Math.round((new Date(pendingPayment.payBy).getTime() - Date.now()) / 3600000))
    : null;

  // Pay-after-approval: an approved paid request opens its held Razorpay order; the
  // webhook flips the SAME registration to 'registered', so poll until it does.
  const payAfterApproval = async () => {
    if (!pendingPayment) return;
    setPayingApproval(true);
    try {
      await openRazorpayCheckout({
        key_id: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID!,
        order_id: pendingPayment.razorpayOrderId,
        amount: pendingPayment.amountPaise,
        currency: 'INR',
        eventTitle: event.title,
        prefill: { name: '', email: '', contact: '' },
      });
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        await queryClient.invalidateQueries({ queryKey: ['myRegistration', event._id] });
        const rows = queryClient.getQueriesData<any>({ queryKey: ['myRegistration', event._id] });
        if (rows?.[0]?.[1]?.status === 'registered') break;
      }
    } catch {
      // cancelled/failed → the 48h hold persists; the Pay CTA stays for a retry
    } finally {
      setPayingApproval(false);
    }
  };

  useEffect(() => {
    if (initialOpen && !preview) {
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
          ? `Register · ${slotsLeft} left →`
          : 'Register →';

  // E·9: the reserve button carries the lowest price + "onwards"; a small
  // refund·closing line sits above the row. Other states keep their labels.
  const reserveLabel = v3 && isLive && !isFull && !deadlinePassed ? ctaLabel(event) : buttonLabel;
  const ribbon = isApproved && hoursToPay != null
    ? `Approved — ${hoursToPay}h left to pay`
    : v3 && !hasAnyReg
      ? [refundLabel(event), closesLabel(event)].filter(Boolean).join('  ·  ')
      : '';

  // Status-column label + accent for any existing registration.
  const statusLabel = isConfirmed ? "You're going ✓"
    : isApproved ? 'Approved'
    : isPending ? 'Requested'
    : isDeclined ? 'Not selected'
    : '';
  const statusColor = isConfirmed ? '#22C55E'
    : isApproved ? '#FF8A5C'
    : isDeclined ? TEXT_2
    : '#5B8DEF'; // pending → blue

  // Preview → the primary CTA is greyed + non-interactive (organizer proofing).
  const ctaDisabled = deadlinePassed || isFull || !isLive || regLoading || preview;

  return (
    <View style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: PAD,
      paddingTop: 14,
      paddingBottom: 24,
      backgroundColor: v3 ? 'rgba(18,18,22,0.94)' : BG,
      borderTopWidth: 1,
      borderColor: HAIRLINE_2,
      gap: 0,
    }}>
      {ribbon ? (
        <Text className="font-outfit" style={{ fontSize: 11.5, color: TEXT_2, textAlign: 'center', marginBottom: 10 }}>{ribbon}</Text>
      ) : null}
      {/* Price + CTA row */}
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
        {/* Price / status column (hidden in v3 reserve state — the button carries the price) */}
        {(!v3 || hasAnyReg) ? (
        <View style={{ paddingHorizontal: 4, justifyContent: 'center' }}>
          {hasAnyReg ? (
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
                color: statusColor,
                fontSize: 18,
                lineHeight: 22,
              }}>
                {statusLabel}
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
        ) : null}

        {isConfirmed ? (
          /* Confirmed (has ticket): View ticket (primary flex) + Cancel (secondary smaller) */
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
        ) : isPending ? (
          /* Pending request (guest_list/apply): awaiting the host — no ticket yet */
          <View style={{ flex: 1, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE_2 }}>
            <Text className="font-outfit" style={{ color: TEXT_2, fontWeight: '600', fontSize: 14 }}>Awaiting approval</Text>
          </View>
        ) : isApproved ? (
          /* Approved paid request: pay the held order within 48h (webhook → registered) */
          <Pressable
            onPress={payAfterApproval}
            disabled={payingApproval || !pendingPayment}
            style={{ flex: 1, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: payingApproval || !pendingPayment ? SURFACE : '#FF6B35', borderWidth: payingApproval || !pendingPayment ? 1 : 0, borderColor: HAIRLINE_2 }}
          >
            {payingApproval ? (
              <ActivityIndicator color={ORANGE_INK} />
            ) : (
              <Text className="font-outfit" style={{ color: pendingPayment ? ORANGE_INK : TEXT_3, fontWeight: '700', fontSize: 14 }}>
                {pendingPayment ? `Pay ${formatRupees(pendingPayment.amountPaise / 100)} →` : 'Preparing payment…'}
              </Text>
            )}
          </Pressable>
        ) : isDeclined ? (
          /* Declined: terminal, informational */
          <View style={{ flex: 1, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE_2 }}>
            <Text className="font-outfit" style={{ color: TEXT_2, fontWeight: '600', fontSize: 14 }}>Not selected this time</Text>
          </View>
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
                // v2 event detail: orange-fill Register CTA (dark ink)
                backgroundColor: ctaDisabled ? SURFACE : '#FF6B35',
                borderWidth: ctaDisabled ? 1 : 0,
                borderColor: HAIRLINE_2,
              }}
            >
              <Text className="font-outfit" style={{
                color: ctaDisabled ? TEXT_3 : ORANGE_INK,
                fontWeight: '700',
                fontSize: 14,
              }}>
                {reserveLabel}
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
