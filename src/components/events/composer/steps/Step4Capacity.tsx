import { View, Text, TextInput, Pressable } from 'react-native';
import { useCreateEventStore, RefundPolicy } from '@/stores/createEventStore';
import { eventTokens } from '@/lib/eventTokens';

const CAPACITY_PRESETS = [20, 50, 100, 200, 500];
const PRICE_PRESETS = [99, 249, 499, 999, 1999];

const REFUND_OPTIONS: { value: RefundPolicy; label: string; sub: string }[] = [
  { value: 'flex_24h', label: 'Flexible', sub: 'Full refund up to 24h before the event' },
  { value: 'firm', label: 'Firm', sub: 'No refunds once registered' },
  { value: 'custom', label: 'Custom', sub: 'Write your own policy below' },
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

  const capacityValid = total >= 1 && total <= 1000;
  const pricingValid = !isPaid || (form.pricing.amount > 0 && form.pricing.amount <= 100000);
  const refundNoteValid =
    !isPaid || form.pricing.refundPolicy !== 'custom' || !!form.pricing.refundCustomNote?.trim();

  const canContinue = capacityValid && pricingValid && refundNoteValid;

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
              Min ₹1, max ₹100,000. NETSA takes 12% (10% for verified hirers). Razorpay split is instant — no escrow.
            </Text>
          </View>

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
              Razorpay integration is rolling out. Until it lands, paid events are
              accepted but charging is mocked — registrants will see the price but
              won't be debited. We'll DM you when live charging activates.
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
