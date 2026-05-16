import { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Switch,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Minus, Plus } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { useRegisterForEvent } from '@/hooks/useEvents';
import { useEvent } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import { eventTokens, computeSlotsLeft } from '@/lib/eventTokens';
import { openRazorpayCheckout } from '@/lib/razorpayCheckout';
import { eventService } from '@/services/eventService';

async function pollUntilConfirmed(eventId: string, qc: QueryClient): Promise<boolean> {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    await qc.invalidateQueries({ queryKey: ['myRegistration', eventId] });
    const cached = qc.getQueriesData<any>({ queryKey: ['myRegistration', eventId] });
    const data = cached?.[0]?.[1];
    if (data?.paymentStatus === 'completed') return true;
    if (data?.paymentStatus === 'failed') return false;
  }
  return false; // timed out — webhook may still arrive after we close
}

interface Props {
  eventId: string;
  open: boolean;
  onClose: () => void;
}

const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const MAX_ATTENDEES = 5;
const MAX_NOTES = 300;

export default function EventRegisterSheetV2({ eventId, open, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const { data: event } = useEvent(eventId);

  // Form state — pre-fill from profile, all editable
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [count, setCount] = useState(1);
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showPublic, setShowPublic] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [paymentInFlight, setPaymentInFlight] = useState(false);
  const mutation = useRegisterForEvent(eventId);
  const queryClient = useQueryClient();

  // Pre-fill from auth user on open
  useEffect(() => {
    if (!open || !user) return;
    setName((user as any).name ?? '');
    setPhone((user as any).phone ?? '');
    setEmail((user as any).email ?? '');
    setValidationError(null);
  }, [open, user]);

  const slotsLeft = useMemo(() => {
    if (!event) return MAX_ATTENDEES;
    return computeSlotsLeft(event.capacity.total, event.capacity.registeredCount);
  }, [event]);

  const maxCountForEvent = Math.min(MAX_ATTENDEES, slotsLeft);
  const isPaid = event?.registrationMode === 'paid_ticket';
  const pricePerTicket = event?.pricing?.amount ?? 0;
  const totalPrice = isPaid ? pricePerTicket * count : 0;

  const decCount = () => setCount((c) => Math.max(1, c - 1));
  const incCount = () => setCount((c) => Math.min(maxCountForEvent, c + 1));

  // Keep guestNames length in sync with count
  useEffect(() => {
    setGuestNames((prev) => {
      const target = Math.max(0, count - 1);
      if (prev.length === target) return prev;
      if (prev.length > target) return prev.slice(0, target);
      return [...prev, ...Array(target - prev.length).fill('')];
    });
  }, [count]);

  const validate = (): string | null => {
    if (!name.trim() || name.trim().length < 2) return 'Name is required (at least 2 characters).';
    if (name.length > 80) return 'Name max 80 characters.';
    if (!phone.trim()) return 'Phone is required.';
    if (!PHONE_RE.test(phone.replace(/\s/g, ''))) return 'Enter a valid Indian mobile number.';
    if (email && !EMAIL_RE.test(email)) return 'Enter a valid email or leave it blank.';
    if (count < 1 || count > MAX_ATTENDEES) return `Attendees must be 1-${MAX_ATTENDEES}.`;
    if (count > slotsLeft) return `Only ${slotsLeft} seat${slotsLeft === 1 ? '' : 's'} left for this event.`;
    if (notes.length > MAX_NOTES) return `Notes max ${MAX_NOTES} characters.`;
    return null;
  };

  const onConfirm = async () => {
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);

    try {
      const registerResp = await mutation.mutateAsync({
        visibility: showPublic ? 'public' : 'private',
        attendeeName: name.trim(),
        attendeePhone: phone.trim(),
        attendeeEmail: email.trim() || undefined,
        attendeeCount: count,
        guestNames: guestNames.map((g) => g.trim()).filter(Boolean),
        notes: notes.trim() || undefined,
      });

      // FREE — done.
      if (!registerResp.paymentRequired) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 1400);
        return;
      }

      // PAID — open Razorpay checkout
      setPaymentInFlight(true);
      try {
        await openRazorpayCheckout({
          key_id: registerResp.key_id!,
          order_id: registerResp.order_id!,
          amount: registerResp.amount!,
          currency: registerResp.currency!,
          eventTitle: event?.title ?? 'Event',
          prefill: registerResp.prefill ?? { name: name, email, contact: phone },
        });

        // Razorpay returned success — webhook will eventually flip status to confirmed.
        // Poll /registrations/me for up to 15s.
        await pollUntilConfirmed(eventId, queryClient);

        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 1400);
      } catch (rzpErr: any) {
        // User cancelled or payment failed. Clean up the pending_payment row
        // server-side so the seat is released immediately and the CTA flips
        // back to "Register" — otherwise the row sits in pending_payment until
        // the stale-pending cron sweeps it 15min later.
        try {
          await eventService.cancelMyRegistration(eventId);
        } catch {
          // best-effort cleanup; stale-pending cron is the backstop
        }
        await queryClient.invalidateQueries({ queryKey: ['myRegistration', eventId] });
        await queryClient.invalidateQueries({ queryKey: ['events', 'detail', eventId] });

        const desc = rzpErr?.description ?? rzpErr?.message ?? 'Payment cancelled.';
        setValidationError(`${desc} Your seat has been released.`);
      } finally {
        setPaymentInFlight(false);
      }
    } catch {
      // mutation.isError shows below
    }
  };

  if (!open) return null;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-event-bg rounded-t-3xl border-t border-event-border" style={{ maxHeight: '92%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-5 pb-3">
              <Text className="font-serif text-event-textPrimary text-2xl flex-1 pr-3" numberOfLines={2}>
                Register for "{event?.title ?? 'event'}"
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <X size={24} color={eventTokens.textSecondary} />
              </Pressable>
            </View>

            {submitted ? (
              <View className="py-16 items-center gap-3">
                <Text className="text-event-brand text-5xl">✓</Text>
                <Text className="font-serif text-event-textPrimary text-2xl">You're in.</Text>
                <Text className="font-outfit text-event-textSecondary text-sm text-center px-8">
                  We sent confirmation by push{email ? ' + email' : ''}. The organizer will reach you on your phone if needed.
                </Text>
              </View>
            ) : (
              <ScrollView
                className="px-6"
                contentContainerStyle={{ paddingBottom: 28 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* YOUR DETAILS */}
                <Text className="font-mono text-event-textMuted text-[10px] uppercase tracking-widest mt-2 mb-3">
                  Your details
                </Text>

                <View className="gap-3 mb-5">
                  <View className="gap-1.5">
                    <Text className="font-outfit text-event-textSecondary text-xs">Name *</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Anjali Ramesh"
                      placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
                      maxLength={80}
                      className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
                    />
                  </View>

                  <View className="gap-1.5">
                    <Text className="font-outfit text-event-textSecondary text-xs">Phone *</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+91 98765 43210"
                      placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
                      keyboardType="phone-pad"
                      maxLength={16}
                      className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
                    />
                  </View>

                  <View className="gap-1.5">
                    <Text className="font-outfit text-event-textSecondary text-xs">Email (optional)</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={120}
                      className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
                    />
                  </View>
                </View>

                {/* ATTENDEES */}
                <Text className="font-mono text-event-textMuted text-[10px] uppercase tracking-widest mb-3">
                  How many attending
                </Text>

                <View className="flex-row items-center justify-between rounded-2xl bg-event-surface border border-event-border px-4 py-3 mb-3">
                  <Text className="font-outfit text-event-textPrimary text-base">Attendees</Text>
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      onPress={decCount}
                      disabled={count <= 1}
                      hitSlop={8}
                      className={`w-9 h-9 rounded-full items-center justify-center ${count <= 1 ? 'bg-event-surfaceAlt opacity-40' : 'bg-event-surfaceAlt'}`}
                    >
                      <Minus size={16} color={eventTokens.textPrimary} />
                    </Pressable>
                    <Text className="font-serif text-event-textPrimary text-2xl w-8 text-center">
                      {count}
                    </Text>
                    <Pressable
                      onPress={incCount}
                      disabled={count >= maxCountForEvent}
                      hitSlop={8}
                      className={`w-9 h-9 rounded-full items-center justify-center ${count >= maxCountForEvent ? 'bg-event-surfaceAlt opacity-40' : 'bg-event-brand'}`}
                    >
                      <Plus size={16} color={count >= maxCountForEvent ? eventTokens.textMuted : '#fff'} />
                    </Pressable>
                  </View>
                </View>

                <Text className="font-outfit text-event-textMuted text-xs mb-5">
                  Up to {MAX_ATTENDEES} per registration · {slotsLeft} seat{slotsLeft === 1 ? '' : 's'} left for this event
                </Text>

                {count > 1 ? (
                  <View className="gap-2 mb-5">
                    <Text className="font-outfit text-event-textSecondary text-xs">
                      Guest names (optional — helps the organizer at check-in)
                    </Text>
                    {guestNames.map((g, i) => (
                      <TextInput
                        key={i}
                        value={g}
                        onChangeText={(v) => {
                          const next = [...guestNames];
                          next[i] = v;
                          setGuestNames(next);
                        }}
                        placeholder={`Guest ${i + 2} name`}
                        placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
                        maxLength={80}
                        className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
                      />
                    ))}
                  </View>
                ) : null}

                {/* NOTES */}
                <Text className="font-mono text-event-textMuted text-[10px] uppercase tracking-widest mb-3">
                  Anything we should know? (optional)
                </Text>

                <View className="gap-1.5 mb-5">
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Bringing my own dholki. Need parking near venue."
                    placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
                    multiline
                    maxLength={MAX_NOTES}
                    className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3 leading-6"
                    style={{ minHeight: 80 }}
                  />
                  <Text className="font-outfit text-event-textMuted text-xs text-right">
                    {notes.length} / {MAX_NOTES}
                  </Text>
                </View>

                {/* PRIVACY */}
                <View className="flex-row items-center justify-between p-4 rounded-2xl bg-event-surface border border-event-border mb-3">
                  <View className="flex-1 pr-3">
                    <Text className="font-outfit text-event-textPrimary text-base font-semibold">
                      Show I'm going to others
                    </Text>
                    <Text className="font-outfit text-event-textSecondary text-xs mt-1">
                      Off by default. Organizer always sees you.
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

                <Text className="font-outfit text-event-textSecondary text-xs mb-4 leading-5">
                  Your phone and email are shared with the organizer for event
                  communications (reschedules, venue updates). Per NETSA privacy
                  policy.
                </Text>

                {/* PRICE SUMMARY (paid only) */}
                {isPaid ? (
                  <View className="rounded-2xl bg-event-surface border border-event-brand/30 px-4 py-4 mb-4">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="font-outfit text-event-textSecondary text-xs">
                        {count} ticket{count === 1 ? '' : 's'} × ₹{pricePerTicket}
                      </Text>
                      <Text className="font-serif text-event-textPrimary text-2xl">
                        ₹{totalPrice}
                      </Text>
                    </View>
                    <Text className="font-outfit text-event-textMuted text-[10px]">
                      Razorpay secure checkout · UPI · cards · netbanking. We confirm via
                      push + email after payment captures.
                    </Text>
                  </View>
                ) : null}

                {/* ERRORS */}
                {validationError ? (
                  <Text className="font-outfit text-event-capacityUrgent text-sm mb-3">
                    {validationError}
                  </Text>
                ) : null}
                {mutation.isError ? (
                  <Text className="font-outfit text-event-capacityUrgent text-sm mb-3">
                    {(mutation.error as any)?.response?.data?.message ??
                      "Couldn't register. Event may be full. Try again."}
                  </Text>
                ) : null}

                {/* CTA */}
                <Pressable
                  onPress={onConfirm}
                  disabled={mutation.isPending || paymentInFlight}
                  className={`rounded-2xl py-4 items-center ${
                    mutation.isPending || paymentInFlight ? 'bg-event-surface' : 'bg-event-brand'
                  }`}
                >
                  {mutation.isPending || paymentInFlight ? (
                    <ActivityIndicator color={eventTokens.textPrimary} />
                  ) : (
                    <Text className="font-outfit font-bold text-white text-base">
                      {isPaid
                        ? `Confirm — pay ₹${totalPrice}`
                        : count === 1
                          ? 'Confirm registration'
                          : `Confirm ${count} registrations`}
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
