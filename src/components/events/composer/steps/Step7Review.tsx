import { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateEventStore } from '@/stores/createEventStore';
import { useCreateEvent } from '@/hooks/useEvents';
import { eventTokens, durationKindLabel } from '@/lib/eventTokens';
import { Check } from 'lucide-react-native';

export default function Step7Review() {
  const router = useRouter();
  const { form, reset, setStep, setSubmitting, isSubmitting } = useCreateEventStore();
  const mutation = useCreateEvent();
  const [outcome, setOutcome] = useState<'live' | 'pending_review' | null>(null);

  const startDate = form.startsAt ? new Date(form.startsAt) : null;

  const submit = async () => {
    setSubmitting(true);
    try {
      const isPaid = form.registrationMode === 'paid_ticket';
      const payload = {
        title: form.title,
        tagline: form.tagline || undefined,
        topicTags: form.topicTags,
        registrationMode: form.registrationMode,
        about: form.about,
        whatToExpect: form.whatToExpect || undefined,
        skills: form.skills,
        startsAt: form.startsAt!,
        endsAt: form.endsAt || undefined,
        durationKind: form.durationKind!,
        location: form.location,
        capacity: { total: form.capacity.total },
        pricing: isPaid
          ? {
              amount: form.pricing.amount,
              currency: form.pricing.currency,
              refundPolicy: form.pricing.refundPolicy,
              refundCustomNote:
                form.pricing.refundPolicy === 'custom'
                  ? form.pricing.refundCustomNote
                  : undefined,
            }
          : undefined,
        media: form.media,
      };
      const result = await mutation.mutateAsync(payload as any);
      setOutcome(result.status as 'live' | 'pending_review');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Something went wrong. Try again.';
      Alert.alert('Could not publish', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (outcome === 'live') {
    return (
      <View className="items-center justify-center gap-4 py-12">
        <View className="w-16 h-16 rounded-full bg-event-brand items-center justify-center">
          <Check size={32} color="#fff" />
        </View>
        <Text className="font-serif text-event-textPrimary text-3xl">You're live</Text>
        <Text className="font-outfit text-event-textSecondary text-center px-6">
          Artists can discover and RSVP now. We'll notify your followers.
        </Text>
        <Pressable
          onPress={() => { reset(); router.replace('/events'); }}
          className="rounded-2xl bg-event-brand py-3 px-8 mt-4"
        >
          <Text className="font-outfit font-bold text-white">View discovery feed</Text>
        </Pressable>
      </View>
    );
  }

  if (outcome === 'pending_review') {
    return (
      <View className="items-center justify-center gap-4 py-12">
        <View className="w-16 h-16 rounded-full bg-event-gold items-center justify-center">
          <Text className="text-white text-3xl">⌛</Text>
        </View>
        <Text className="font-serif text-event-textPrimary text-3xl">In review</Text>
        <Text className="font-outfit text-event-textSecondary text-center px-6 leading-6">
          We hold first-time organizers' events for a quick safety check. Usually under 24h. You'll get a push when it goes live.
        </Text>
        <Pressable
          onPress={() => { reset(); router.replace('/events'); }}
          className="rounded-2xl bg-event-surface border border-event-border py-3 px-8 mt-4"
        >
          <Text className="font-outfit text-event-textPrimary">Back to events</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="gap-5 mt-2">
      <ReviewBlock label="Topics" onEdit={() => setStep(1)}>
        <View className="flex-row flex-wrap gap-2">
          {form.topicTags.map((t) => (
            <View key={t} className="px-3 py-1 rounded-full bg-event-surface border border-event-border">
              <Text className="font-outfit text-event-textSecondary text-xs">{t}</Text>
            </View>
          ))}
        </View>
        <Text className="font-outfit text-event-textMuted text-xs mt-2">
          {form.registrationMode === 'free_rsvp' ? 'Free RSVP' : 'Paid ticket'}
        </Text>
      </ReviewBlock>

      <ReviewBlock label="Basics" onEdit={() => setStep(2)}>
        <Text className="font-serif text-event-textPrimary text-xl">{form.title}</Text>
        {form.tagline ? <Text className="font-outfit text-event-textSecondary text-sm mt-1">{form.tagline}</Text> : null}
        {startDate ? (
          <Text className="font-outfit text-event-textMuted text-xs mt-2">
            {startDate.toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}
            {' · '}{form.durationKind ? durationKindLabel[form.durationKind] : ''}
          </Text>
        ) : null}
      </ReviewBlock>

      <ReviewBlock label="Location" onEdit={() => setStep(3)}>
        {form.location.kind === 'in_person' ? (
          <>
            <Text className="font-outfit text-event-textPrimary text-base">{form.location.venueName}</Text>
            <Text className="font-outfit text-event-textSecondary text-sm mt-1">{form.location.address}</Text>
          </>
        ) : (
          <Text className="font-outfit text-event-textPrimary text-base">
            Online · {form.location.onlinePlatform || 'platform TBA'}
          </Text>
        )}
      </ReviewBlock>

      <ReviewBlock label="Capacity & Pricing" onEdit={() => setStep(4)}>
        <Text className="font-outfit text-event-textPrimary text-base">{form.capacity.total} people</Text>
        {form.registrationMode === 'paid_ticket' ? (
          <View className="mt-2 gap-1">
            <Text className="font-outfit text-event-textPrimary text-sm">
              ₹{form.pricing.amount} per ticket · {form.pricing.currency}
            </Text>
            <Text className="font-outfit text-event-textMuted text-xs">
              Refund: {form.pricing.refundPolicy === 'flex_24h'
                ? 'Flexible (24h before)'
                : form.pricing.refundPolicy === 'firm'
                  ? 'Firm (no refunds)'
                  : form.pricing.refundCustomNote || 'Custom'}
            </Text>
          </View>
        ) : (
          <Text className="font-outfit text-event-textMuted text-xs mt-1">Free RSVP</Text>
        )}
      </ReviewBlock>

      <ReviewBlock label="About" onEdit={() => setStep(5)}>
        <Text className="font-outfit text-event-textPrimary text-sm leading-5" numberOfLines={4}>
          {form.about}
        </Text>
      </ReviewBlock>

      <ReviewBlock label="Media" onEdit={() => setStep(6)}>
        <Text className="font-outfit text-event-textPrimary text-sm">
          {form.media.length} item{form.media.length === 1 ? '' : 's'}
        </Text>
      </ReviewBlock>

      <Pressable
        onPress={submit}
        disabled={isSubmitting}
        className={`rounded-2xl py-4 items-center mt-3 ${isSubmitting ? 'bg-event-surface' : 'bg-event-brand'}`}
      >
        {isSubmitting
          ? <ActivityIndicator color={eventTokens.textPrimary} />
          : <Text className="font-outfit font-bold text-white text-base">Publish event</Text>}
      </Pressable>
    </View>
  );
}

function ReviewBlock({ label, onEdit, children }: { label: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <View className="rounded-2xl bg-event-surface border border-event-border p-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">{label}</Text>
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text className="font-outfit text-event-brand text-xs">Edit</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}
