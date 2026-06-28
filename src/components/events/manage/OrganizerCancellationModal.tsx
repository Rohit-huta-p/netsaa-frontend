/**
 * OrganizerCancellationModal — organizer cancels their event.
 *
 * - Shows a refund summary: attendees affected, seats returned, NETSA absorbs
 *   the service fee (2.36%), attendees get back ticket + service fee.
 * - Requires a reason textarea (sent to attendees).
 * - Destructive "Cancel event" button requires a 3-second press-and-hold before
 *   firing — prevents accidental cancellation.
 *
 * Sprint 3, Task 8.
 */
import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { AlertTriangle, Users, RotateCcw } from 'lucide-react-native';
import { useCancelEvent } from '@/hooks/useEvents';
import { PROCESSING_FEE_PERCENT } from '@/lib/eventPricing';

export interface OrganizerCancelResult {
  affectedRegistrations: number;
  totalRefundPaise: number;
  netsaAbsorbedTotalPaise: number;
}

interface Props {
  visible: boolean;
  eventId: string;
  attendeeCount: number;
  ticketPriceRupees: number;
  onClose: () => void;
  onCancelled: (result: OrganizerCancelResult) => void;
}

const HOLD_DURATION_MS = 3000;

// ── Refund summary helpers ───────────────────────────────────────────────────
function computeSummary(attendeeCount: number, ticketPriceRupees: number) {
  const isPaid = ticketPriceRupees > 0;
  const serviceFeePerSeat =
    Math.round(ticketPriceRupees * (PROCESSING_FEE_PERCENT / 100) * 100) / 100;
  const netsaAbsorbedPerSeat = serviceFeePerSeat;
  const netsaAbsorbedTotal =
    Math.round(netsaAbsorbedPerSeat * attendeeCount * 100) / 100;
  const attendeeGetsBackPerSeat =
    Math.round((ticketPriceRupees + serviceFeePerSeat) * 100) / 100;
  const totalRefund =
    Math.round(attendeeGetsBackPerSeat * attendeeCount * 100) / 100;

  return { isPaid, serviceFeePerSeat, netsaAbsorbedTotal, attendeeGetsBackPerSeat, totalRefund };
}

function formatRs(n: number): string {
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Hold-to-confirm button ───────────────────────────────────────────────────
interface HoldButtonProps {
  onFired: () => void;
  disabled: boolean;
  isPending: boolean;
}

function HoldToConfirmButton({ onFired, disabled, isPending }: HoldButtonProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const [holding, setHolding] = useState(false);

  const startHold = () => {
    if (disabled || isPending) return;
    setHolding(true);
    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished) {
        setHolding(false);
        onFired();
        progress.setValue(0);
      }
    });
    timerRef.current = setTimeout(() => {}, HOLD_DURATION_MS);
  };

  const cancelHold = () => {
    animRef.current?.stop();
    if (timerRef.current) clearTimeout(timerRef.current);
    setHolding(false);
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Pressable
      onPressIn={startHold}
      onPressOut={cancelHold}
      disabled={disabled || isPending}
      style={{
        flex: 1,
        borderRadius: 12,
        height: 52,
        overflow: 'hidden',
        backgroundColor: disabled ? 'rgba(239,68,68,0.3)' : '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Progress fill overlay */}
      {holding ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: fillWidth,
            backgroundColor: 'rgba(255,255,255,0.20)',
          }}
        />
      ) : null}

      {isPending ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text
          style={{
            fontFamily: 'Outfit-Bold',
            fontSize: 13,
            color: disabled ? 'rgba(255,255,255,0.4)' : '#fff',
            textAlign: 'center',
          }}
        >
          {holding ? 'Hold…' : 'Hold to cancel event'}
        </Text>
      )}
    </Pressable>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function OrganizerCancellationModal({
  visible,
  eventId,
  attendeeCount,
  ticketPriceRupees,
  onClose,
  onCancelled,
}: Props) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const cancelEvent = useCancelEvent(eventId);

  const summary = computeSummary(attendeeCount, ticketPriceRupees);

  const handleFire = async () => {
    if (!reason.trim()) {
      setError('Please enter a reason — it will be sent to your attendees.');
      return;
    }
    setError(null);
    try {
      const result = await cancelEvent.mutateAsync(reason.trim());
      setReason('');
      onCancelled(result);
    } catch {
      setError("Couldn't cancel the event right now. Please try again.");
    }
  };

  const handleClose = () => {
    if (cancelEvent.isPending) return;
    setReason('');
    setError(null);
    onClose();
  };

  const canFire = reason.trim().length > 0 && !cancelEvent.isPending;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.80)',
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: '#11111A',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.25)',
            padding: 24,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'rgba(239,68,68,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={18} color="#EF4444" />
              </View>
              <Text
                style={{
                  fontFamily: 'DMSerifDisplay_400Regular',
                  fontSize: 20,
                  color: '#F3EFE8',
                  flex: 1,
                }}
              >
                Cancel event?
              </Text>
            </View>

            <Text
              style={{
                fontFamily: 'Outfit-Regular',
                fontSize: 13,
                color: '#6B6878',
                marginBottom: 20,
                lineHeight: 18,
              }}
            >
              This cannot be undone. All registrations will be cancelled and attendees notified.
            </Text>

            {/* Refund summary */}
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(243,239,232,0.08)',
                padding: 16,
                gap: 12,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Outfit-SemiBold',
                  fontSize: 11,
                  color: '#6B6878',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                Refund summary
              </Text>

              <SummaryRow
                icon={<Users size={14} color="#B8B1A6" />}
                label="Attendees affected"
                value={`${attendeeCount} ${attendeeCount === 1 ? 'person' : 'people'}`}
              />
              <SummaryRow
                icon={<RotateCcw size={14} color="#B8B1A6" />}
                label="Seats returned"
                value={`${attendeeCount} slot${attendeeCount === 1 ? '' : 's'} released`}
              />

              {summary.isPaid ? (
                <>
                  <View
                    style={{
                      height: 1,
                      backgroundColor: 'rgba(243,239,232,0.06)',
                      marginVertical: 4,
                    }}
                  />
                  <SummaryRow
                    label="Service fee absorbed by NETSA"
                    value={`+${formatRs(summary.netsaAbsorbedTotal)}`}
                    valueColor="#FF6B35"
                    sublabel={`${PROCESSING_FEE_PERCENT}% × ${attendeeCount} ${attendeeCount === 1 ? 'seat' : 'seats'}`}
                  />
                  <SummaryRow
                    label="Attendees get back"
                    value={formatRs(summary.attendeeGetsBackPerSeat)}
                    sublabel="Per seat · ticket + service fee"
                    valueColor="#22C55E"
                  />
                  <SummaryRow
                    label="Total refunded to attendees"
                    value={formatRs(summary.totalRefund)}
                    valueColor="#22C55E"
                  />
                </>
              ) : (
                <SummaryRow
                  label="Refund"
                  value="Free event — no charges"
                />
              )}
            </View>

            {/* Reason textarea */}
            <Text
              style={{
                fontFamily: 'Outfit-SemiBold',
                fontSize: 12,
                color: '#F3EFE8',
                marginBottom: 8,
              }}
            >
              Reason for cancellation{' '}
              <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <Text
              style={{
                fontFamily: 'Outfit-Regular',
                fontSize: 11,
                color: '#6B6878',
                marginBottom: 10,
                lineHeight: 16,
              }}
            >
              This message will be sent to all your attendees.
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Due to unforeseen circumstances, we have to cancel…"
              placeholderTextColor="#3F3D4A"
              multiline
              maxLength={500}
              editable={!cancelEvent.isPending}
              style={{
                fontFamily: 'Outfit-Regular',
                fontSize: 13,
                color: '#F3EFE8',
                borderWidth: 1,
                borderColor:
                  reason.trim().length === 0
                    ? 'rgba(239,68,68,0.30)'
                    : 'rgba(243,239,232,0.12)',
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: 14,
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 4,
              }}
            />
            <Text
              style={{
                fontFamily: 'Outfit-Regular',
                fontSize: 10,
                color: '#3F3D4A',
                textAlign: 'right',
                marginBottom: 20,
              }}
            >
              {reason.length}/500
            </Text>

            {/* Error */}
            {error ? (
              <Text
                style={{
                  fontFamily: 'Outfit-Regular',
                  fontSize: 13,
                  color: '#EF4444',
                  marginBottom: 14,
                  lineHeight: 18,
                }}
              >
                {error}
              </Text>
            ) : null}

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={handleClose}
                disabled={cancelEvent.isPending}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  height: 52,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: 'rgba(243,239,232,0.10)',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Outfit-SemiBold',
                    fontSize: 14,
                    color: '#F3EFE8',
                  }}
                >
                  Keep event
                </Text>
              </Pressable>

              <HoldToConfirmButton
                onFired={handleFire}
                disabled={!canFire}
                isPending={cancelEvent.isPending}
              />
            </View>

            {!canFire && !cancelEvent.isPending ? (
              <Text
                style={{
                  fontFamily: 'Outfit-Regular',
                  fontSize: 10,
                  color: '#3F3D4A',
                  textAlign: 'center',
                  marginTop: 10,
                }}
              >
                Enter a reason above to enable cancellation
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: 'Outfit-Regular',
                  fontSize: 10,
                  color: '#3F3D4A',
                  textAlign: 'center',
                  marginTop: 10,
                }}
              >
                Press and hold for 3 seconds to confirm
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Summary row ───────────────────────────────────────────────────────────────
function SummaryRow({
  icon,
  label,
  value,
  sublabel,
  valueColor = '#F3EFE8',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  valueColor?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      {icon ? (
        <View style={{ marginTop: 1, width: 16 }}>{icon}</View>
      ) : (
        <View style={{ width: 16 }} />
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Outfit-Regular',
            fontSize: 12,
            color: '#9896A0',
            lineHeight: 16,
          }}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text
            style={{
              fontFamily: 'Outfit-Regular',
              fontSize: 10,
              color: '#6B6878',
              lineHeight: 14,
            }}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          fontFamily: 'Outfit-SemiBold',
          fontSize: 12,
          color: valueColor,
          lineHeight: 16,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
