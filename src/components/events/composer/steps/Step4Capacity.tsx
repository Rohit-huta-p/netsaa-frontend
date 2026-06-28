import { View, Text, TextInput, Pressable } from 'react-native';
import { useCreateEventStore, RefundPolicy, RequiredAttendeeField } from '@/stores/createEventStore';
import { eventTokens } from '@/lib/eventTokens';
import {
  computeOrganizerBreakdown,
  formatRupees,
  NETSA_FEE_PERCENT,
  PROCESSING_FEE_PERCENT,
} from '@/lib/eventPricing';

const CAPACITY_PRESETS = [20, 50, 100, 200, 500];
const PRICE_PRESETS = [99, 249, 499, 999, 1999];

const REFUND_OPTIONS: { value: RefundPolicy; label: string; sub: string }[] = [
  { value: 'flex_24h', label: 'Flexible', sub: 'Full refund up to 24h before the event' },
  { value: 'firm', label: 'Firm', sub: 'No refunds once registered' },
  { value: 'custom', label: 'Custom', sub: 'Write your own policy below' },
];

const GUEST_OPTIONS = [1, 2, 3, 5, 10];

const ATTENDEE_FIELD_TOGGLES: { value: RequiredAttendeeField; label: string; sub: string; locked?: boolean }[] = [
  { value: 'phone', label: 'Phone', sub: 'Always required · for SMS reminders', locked: true },
  { value: 'email', label: 'Email', sub: 'Optional · receipts + ICS calendar' },
  { value: 'guestNames', label: 'Guest names', sub: 'When group size > 1' },
];

export default function Step4Capacity({ onNext }: { onNext: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();
  const total = form.capacity.total;
  const isPaid = form.registrationMode === 'paid_ticket';

  const setCapacity = (n: number) =>
    update('capacity', { total: Math.max(1, Math.min(1000, n)) });

  const setPrice = (n: number) =>
    update('pricing', { ...form.pricing, amount: Math.max(0, Math.min(100000, n)) });

  const setRefundPolicy = (policy: RefundPolicy) =>
    update('pricing', { ...form.pricing, refundPolicy: policy });

  const setRefundNote = (note: string) =>
    update('pricing', { ...form.pricing, refundCustomNote: note });

  const setMaxGuests = (n: number) =>
    update('maxGuestsPerRegistration', Math.max(1, Math.min(10, n)));

  const setAllowWaitlist = (v: boolean) => {
    update('allowWaitlist', v);
    // Reset auto-promote when waitlist disabled
    if (!v) update('waitlistAutoPromote', false);
  };

  const toggleAttendeeField = (field: RequiredAttendeeField) => {
    if (field === 'phone') return; // phone is locked-on
    const has = form.requiredAttendeeFields.includes(field);
    update(
      'requiredAttendeeFields',
      has
        ? form.requiredAttendeeFields.filter((f) => f !== field)
        : [...form.requiredAttendeeFields, field],
    );
  };

  const capacityValid = total >= 1 && total <= 1000;
  const pricingValid = !isPaid || (form.pricing.amount > 0 && form.pricing.amount <= 100000);
  const refundNoteValid =
    !isPaid || form.pricing.refundPolicy !== 'custom' || !!form.pricing.refundCustomNote?.trim();
  const guestsValid =
    form.maxGuestsPerRegistration >= 1 && form.maxGuestsPerRegistration <= 10;

  const canContinue = capacityValid && pricingValid && refundNoteValid && guestsValid;

  return (
    <View className="gap-7 mt-2">
      {/* CAPACITY */}
      <View className="gap-3">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          Total capacity
        </Text>
        <View className="rounded-2xl bg-event-surface border border-event-border px-4 py-5 items-center">
          <Text className="font-serif text-event-textPrimary text-5xl">{total}</Text>
          <Text className="font-outfit text-event-textSecondary text-xs mt-1">people</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {CAPACITY_PRESETS.map((n) => {
          const active = total === n;
          return (
            <Pressable
              key={n}
              onPress={() => setCapacity(n)}
              className={`px-4 py-2.5 rounded-full ${active ? 'bg-event-brand' : 'bg-event-surface border border-event-border'}`}
            >
              <Text className={`font-outfit text-sm ${active ? 'text-white font-semibold' : 'text-event-textSecondary'}`}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          Or type a number
        </Text>
        <TextInput
          value={String(total)}
          onChangeText={(s) => setCapacity(parseInt(s, 10) || 1)}
          keyboardType="number-pad"
          placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
          className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
        />
        <Text className="font-outfit text-event-textMuted text-xs">
          Hard cap is 1000. For larger events, request admin approval.
        </Text>
      </View>

      <View className="h-px bg-event-border my-2" />

      {/* GROUP SIZE — max guests per registration */}
      <View className="gap-3">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          Group registration · max per booking
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {GUEST_OPTIONS.map((n) => {
            const active = form.maxGuestsPerRegistration === n;
            return (
              <Pressable
                key={n}
                onPress={() => setMaxGuests(n)}
                className={`px-4 py-2.5 rounded-full ${active ? 'bg-event-brand' : 'bg-event-surface border border-event-border'}`}
              >
                <Text className={`font-outfit text-sm ${active ? 'text-white font-semibold' : 'text-event-textSecondary'}`}>
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="font-outfit text-event-textMuted text-xs">
          One attendee can bring up to {form.maxGuestsPerRegistration - 1} guest{form.maxGuestsPerRegistration === 2 ? '' : 's'}. Each seat counts against capacity.
        </Text>
      </View>

      <View className="h-px bg-event-border my-2" />

      {/* REQUIRED ATTENDEE FIELDS */}
      <View className="gap-3">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          Required from attendees
        </Text>
        <View className="gap-2">
          {ATTENDEE_FIELD_TOGGLES.map((opt) => {
            const active = form.requiredAttendeeFields.includes(opt.value);
            return (
              <Pressable
                key={opt.value}
                onPress={() => toggleAttendeeField(opt.value)}
                disabled={opt.locked}
                className={`flex-row items-center justify-between p-4 rounded-2xl border ${active ? 'border-event-brand bg-event-surface' : 'border-event-border bg-event-surfaceAlt'}`}
              >
                <View className="flex-1 pr-3">
                  <Text className="font-outfit text-event-textPrimary text-base font-semibold">
                    {opt.label}
                    {opt.locked ? <Text className="font-mono text-event-textMuted text-xs"> · locked</Text> : null}
                  </Text>
                  <Text className="font-outfit text-event-textSecondary text-xs mt-1">
                    {opt.sub}
                  </Text>
                </View>
                <SwitchPill on={active} disabled={opt.locked} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="h-px bg-event-border my-2" />

      {/* WAITLIST */}
      <View className="gap-3">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          Waitlist
        </Text>
        <Pressable
          onPress={() => setAllowWaitlist(!form.allowWaitlist)}
          className={`flex-row items-center justify-between p-4 rounded-2xl border ${form.allowWaitlist ? 'border-event-brand bg-event-surface' : 'border-event-border bg-event-surfaceAlt'}`}
        >
          <View className="flex-1 pr-3">
            <Text className="font-outfit text-event-textPrimary text-base font-semibold">
              Allow waitlist when full
            </Text>
            <Text className="font-outfit text-event-textSecondary text-xs mt-1">
              Artists can join a waitlist · they're notified if a seat opens
            </Text>
          </View>
          <SwitchPill on={form.allowWaitlist} />
        </Pressable>

        {/* AUTO-PROMOTE — only when waitlist is on */}
        {form.allowWaitlist ? (
          <View className="gap-2 mt-1">
            <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
              When a seat opens
            </Text>
            <Pressable
              onPress={() => update('waitlistAutoPromote', true)}
              className={`p-4 rounded-2xl border ${form.waitlistAutoPromote ? 'border-event-brand bg-event-surface' : 'border-event-border bg-event-surfaceAlt'}`}
            >
              <View className="flex-row items-center gap-3">
                <RadioDot on={form.waitlistAutoPromote} />
                <View className="flex-1">
                  <Text className="font-outfit text-event-textPrimary text-base font-semibold">
                    Auto-promote
                  </Text>
                  <Text className="font-outfit text-event-textSecondary text-xs mt-1">
                    Top of waitlist gets 30 min to confirm · no organizer action
                  </Text>
                </View>
              </View>
            </Pressable>
            <Pressable
              onPress={() => update('waitlistAutoPromote', false)}
              className={`p-4 rounded-2xl border ${!form.waitlistAutoPromote ? 'border-event-brand bg-event-surface' : 'border-event-border bg-event-surfaceAlt'}`}
            >
              <View className="flex-row items-center gap-3">
                <RadioDot on={!form.waitlistAutoPromote} />
                <View className="flex-1">
                  <Text className="font-outfit text-event-textPrimary text-base font-semibold">
                    I'll approve each one
                  </Text>
                  <Text className="font-outfit text-event-textSecondary text-xs mt-1">
                    You get a push · tap to promote
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View className="h-px bg-event-border my-2" />

      {/* WALK-UPS */}
      <View className="gap-3">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          Day-of
        </Text>
        <Pressable
          onPress={() => update('walkupsAllowed', !form.walkupsAllowed)}
          className={`flex-row items-center justify-between p-4 rounded-2xl border ${form.walkupsAllowed ? 'border-event-brand bg-event-surface' : 'border-event-border bg-event-surfaceAlt'}`}
        >
          <View className="flex-1 pr-3">
            <Text className="font-outfit text-event-textPrimary text-base font-semibold">
              Allow walk-ups
            </Text>
            <Text className="font-outfit text-event-textSecondary text-xs mt-1">
              Add people at the door if seats are left · cash or Razorpay link
            </Text>
          </View>
          <SwitchPill on={form.walkupsAllowed} />
        </Pressable>
      </View>

      {/* PRICING — only when paid_ticket */}
      {isPaid ? (
        <>
          <View className="h-px bg-event-border my-2" />

          <View className="gap-3">
            <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
              Ticket price · INR
            </Text>
            <View className="rounded-2xl bg-event-surface border border-event-border px-4 py-5 items-center">
              <View className="flex-row items-baseline gap-1">
                <Text className="font-serif text-event-textSecondary text-2xl">₹</Text>
                <Text className="font-serif text-event-textPrimary text-5xl">
                  {form.pricing.amount}
                </Text>
              </View>
              <Text className="font-outfit text-event-textSecondary text-xs mt-1">per ticket</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {PRICE_PRESETS.map((n) => {
              const active = form.pricing.amount === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setPrice(n)}
                  className={`px-4 py-2.5 rounded-full ${active ? 'bg-event-brand' : 'bg-event-surface border border-event-border'}`}
                >
                  <Text className={`font-outfit text-sm ${active ? 'text-white font-semibold' : 'text-event-textSecondary'}`}>
                    ₹{n}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="gap-2">
            <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
              Or type an amount
            </Text>
            <TextInput
              value={String(form.pricing.amount)}
              onChangeText={(s) => setPrice(parseInt(s, 10) || 0)}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
              className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
            />
            <Text className="font-outfit text-event-textMuted text-xs">
              Min ₹1, max ₹100,000.
            </Text>
          </View>

          {/* EARNINGS MINI-CALCULATOR */}
          {form.pricing.amount > 0 ? (
            <View className="rounded-2xl bg-event-surface border border-event-brand/30 px-4 py-4 gap-3">
              <Text className="font-mono text-event-brand text-[10px] uppercase tracking-widest">
                Your earnings per ticket
              </Text>

              {(() => {
                const o = computeOrganizerBreakdown(form.pricing.amount, 1);
                return (
                  <>
                    <View className="flex-row items-center justify-between">
                      <Text className="font-outfit text-event-textSecondary text-sm">
                        Ticket price
                      </Text>
                      <Text className="font-outfit text-event-textPrimary text-sm">
                        {formatRupees(form.pricing.amount)}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="font-outfit text-event-textSecondary text-sm">
                        − NETSA platform fee ({NETSA_FEE_PERCENT}%)
                      </Text>
                      <Text className="font-outfit text-event-textPrimary text-sm">
                        − {formatRupees(o.netsaFee)}
                      </Text>
                    </View>
                    <View className="h-px bg-event-border" />
                    <View className="flex-row items-center justify-between">
                      <Text className="font-outfit text-event-textPrimary text-sm font-semibold">
                        = You receive
                      </Text>
                      <Text className="font-serif text-event-brand text-2xl">
                        {formatRupees(o.organizerNet)}
                      </Text>
                    </View>
                    <Text className="font-outfit text-event-textMuted text-xs leading-5 mt-1">
                      Customer pays {formatRupees(o.customerPays)} ({formatRupees(form.pricing.amount)} +{' '}
                      {formatRupees(o.serviceFee)} service fee for payment processing).
                      Settled instantly via Razorpay split — no escrow.
                    </Text>
                  </>
                );
              })()}
            </View>
          ) : null}

          {/* REFUND POLICY */}
          <View className="gap-3">
            <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
              Refund policy
            </Text>
            <View className="gap-2">
              {REFUND_OPTIONS.map((opt) => {
                const active = form.pricing.refundPolicy === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setRefundPolicy(opt.value)}
                    className={`p-4 rounded-2xl border ${active ? 'border-event-brand bg-event-surface' : 'border-event-border bg-event-surfaceAlt'}`}
                  >
                    <Text className="font-outfit text-event-textPrimary text-base font-semibold">
                      {opt.label}
                    </Text>
                    <Text className="font-outfit text-event-textSecondary text-xs mt-1">
                      {opt.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {form.pricing.refundPolicy === 'custom' ? (
            <View className="gap-2">
              <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
                Custom refund note · required
              </Text>
              <TextInput
                value={form.pricing.refundCustomNote ?? ''}
                onChangeText={setRefundNote}
                placeholder="e.g. Full refund up to 7 days before, 50% within 7 days, none within 48h."
                placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
                multiline
                maxLength={200}
                className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3 leading-6"
                style={{ minHeight: 80 }}
              />
              <Text className="font-outfit text-event-textMuted text-xs text-right">
                {(form.pricing.refundCustomNote ?? '').length} / 200
              </Text>
            </View>
          ) : null}

          {/* Payment processing notice */}
          <View className="rounded-2xl bg-event-surface border border-event-gold/30 p-4">
            <Text className="font-mono text-event-gold text-[10px] uppercase tracking-widest mb-1">
              Heads up
            </Text>
            <Text className="font-outfit text-event-textSecondary text-xs leading-5">
              Service fee ({PROCESSING_FEE_PERCENT}%) is added on top of your ticket
              price and paid by the customer. It covers Razorpay gateway charges. You
              receive the full ticket amount minus NETSA's {NETSA_FEE_PERCENT}% platform fee.
            </Text>
          </View>
        </>
      ) : null}

      <Pressable
        onPress={() => {
          markComplete(4);
          onNext();
        }}
        disabled={!canContinue}
        className={`rounded-2xl py-4 items-center ${canContinue ? 'bg-event-brand' : 'bg-event-surface'}`}
      >
        <Text className={`font-outfit font-bold ${canContinue ? 'text-white' : 'text-event-textMuted'}`}>
          Continue
        </Text>
      </Pressable>
    </View>
  );
}

/* — Small UI bits — */

function SwitchPill({ on, disabled }: { on: boolean; disabled?: boolean }) {
  return (
    <View
      className={`w-12 h-7 rounded-full ${on ? 'bg-event-brand' : 'bg-event-border'} ${disabled ? 'opacity-50' : ''} justify-center`}
      style={{ paddingHorizontal: 2 }}
    >
      <View
        className="w-6 h-6 rounded-full bg-white"
        style={{ transform: [{ translateX: on ? 20 : 0 }] }}
      />
    </View>
  );
}

function RadioDot({ on }: { on: boolean }) {
  return (
    <View
      className={`w-5 h-5 rounded-full border-2 ${on ? 'border-event-brand' : 'border-event-border'} items-center justify-center`}
    >
      {on ? <View className="w-2.5 h-2.5 rounded-full bg-event-brand" /> : null}
    </View>
  );
}
