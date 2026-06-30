import { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateEventStore } from '@/stores/createEventStore';
import { useCreateEvent, useUpdateEvent, eventKeys } from '@/hooks/useEvents';
import { useQueryClient } from '@tanstack/react-query';
import { durationKindLabel } from '@/lib/eventTokens';
import { Check, Clock } from 'lucide-react-native';
import type { EventCancellationPolicy } from '@/services/eventService';

const ONE_DAY_MS = 86400000;

const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#F3EFE8';
const TEXT_1 = '#A1A1AA';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const ORANGE = '#FF6B35';
const ORANGE_INK = '#1A0D06';
const GREEN = '#22C55E';
const GREEN_SOFT = 'rgba(34,197,94,0.14)';
const GOLD = '#F59E0B';
const GOLD_SOFT = 'rgba(245,158,11,0.14)';

function deriveCancellationPolicy(
  refundPolicy: 'flex_24h' | 'firm' | 'custom',
  customNote: string | undefined,
  startsAtISO: string,
): EventCancellationPolicy {
  const startsAt = new Date(startsAtISO).getTime();
  switch (refundPolicy) {
    case 'flex_24h':
      return { fullRefundUntil: new Date(startsAt - ONE_DAY_MS).toISOString(), notes: 'Full refund up to 24h before the event.' };
    case 'firm':
      return { notes: 'No refunds once registered.' };
    case 'custom':
      return { notes: customNote || 'See organizer.' };
  }
}

export default function Step7Review() {
  const router = useRouter();
  const qc = useQueryClient();
  const { form, reset, setStep, setSubmitting, isSubmitting, editMode, editEventId } = useCreateEventStore();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent(editEventId ?? '');
  // Keep legacy alias so the submit handler below reads cleanly for the create path.
  const mutation = createMutation;
  const [outcome, setOutcome] = useState<'live' | 'pending_review' | null>(null);

  const startDate = form.startsAt ? new Date(form.startsAt) : null;

  const buildPayload = () => {
    const isPaid = form.registrationMode === 'paid_ticket';
    return {
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
            refundCustomNote: form.pricing.refundPolicy === 'custom' ? form.pricing.refundCustomNote : undefined,
          }
        : undefined,
      media: form.media,
      registrationDeadline: form.registrationDeadline || undefined,
      agenda: form.agenda.length ? form.agenda : undefined,
      allowWaitlist: form.allowWaitlist,
      waitlistAutoPromote: form.waitlistAutoPromote,
      walkupsAllowed: form.walkupsAllowed,
      maxGuestsPerRegistration: form.maxGuestsPerRegistration,
      requiredAttendeeFields: form.requiredAttendeeFields,
      cancellationPolicy:
        isPaid && form.startsAt
          ? deriveCancellationPolicy(form.pricing.refundPolicy, form.pricing.refundCustomNote, form.startsAt)
          : undefined,
      visibility: form.visibility,
      discussionVisibility: form.discussionVisibility,
      language: form.language,
      ageRestriction: form.ageRestriction ?? undefined,
    };
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      if (editMode && editEventId) {
        // PATCH path — update existing event, then go back (no result screen).
        const patch = buildPayload();
        await updateMutation.mutateAsync(patch as any);
        // updateMutation's onSuccess already invalidates detail + roster,
        // but also invalidate explicitly so any stale list cache is cleared.
        qc.invalidateQueries({ queryKey: eventKeys.detail(editEventId) });
        reset();
        router.back();
      } else {
        // CREATE path — unchanged.
        const payload = buildPayload();
        const result = await mutation.mutateAsync(payload as any);
        setOutcome(result.status as 'live' | 'pending_review');
      }
    } catch (err: any) {
      Alert.alert(
        editMode ? 'Could not save changes' : 'Could not publish',
        err?.response?.data?.message ?? 'Something went wrong. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (outcome === 'live') {
    return (
      <View style={styles.result}>
        <View style={[styles.resultIcon, { backgroundColor: GREEN_SOFT }]}><Check size={30} color={GREEN} /></View>
        <Text style={styles.resultEyebrow}>You're live</Text>
        <Text style={styles.resultTitle}>{form.title || 'Your event'} is live.</Text>
        <Text style={styles.resultBody}>Artists can discover and RSVP now. We'll notify your followers.</Text>
        <Pressable onPress={() => { reset(); router.replace('/events'); }} style={styles.resultBtn}>
          <Text style={styles.resultBtnText}>View discovery feed →</Text>
        </Pressable>
      </View>
    );
  }

  if (outcome === 'pending_review') {
    return (
      <View style={styles.result}>
        <View style={[styles.resultIcon, { backgroundColor: GOLD_SOFT }]}><Clock size={28} color={GOLD} /></View>
        <Text style={[styles.resultEyebrow, { color: GOLD }]}>In review</Text>
        <Text style={styles.resultTitle}>Held for a quick check.</Text>
        <Text style={styles.resultBody}>We hold first-time hosts' events for a safety check — usually under 24h. You'll get a push when it goes live.</Text>
        <Pressable onPress={() => { reset(); router.replace('/events'); }} style={[styles.resultBtn, styles.resultBtnGhost]}>
          <Text style={[styles.resultBtnText, { color: TEXT_0 }]}>Back to events</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: 8, marginTop: 2 }}>
      <ReviewBlock label="Topics" onEdit={() => setStep(2)}>
        <View style={styles.tagRow}>
          {form.topicTags.map((t) => (
            <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
          ))}
        </View>
        <Text style={styles.dim}>{form.registrationMode === 'free_rsvp' ? 'Free RSVP' : 'Paid ticket'}</Text>
      </ReviewBlock>

      <ReviewBlock label="Basics" onEdit={() => setStep(1)}>
        <Text style={styles.serif}>{form.title}</Text>
        {form.tagline ? <Text style={styles.sub}>{form.tagline}</Text> : null}
        {startDate ? (
          <Text style={styles.dim}>
            {startDate.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            {' · '}{form.durationKind ? durationKindLabel[form.durationKind] : ''}
          </Text>
        ) : null}
      </ReviewBlock>

      <ReviewBlock label="Location" onEdit={() => setStep(3)}>
        {form.location.kind === 'in_person' ? (
          <>
            <Text style={styles.body}>{form.location.venueName}</Text>
            <Text style={styles.sub}>{form.location.address}</Text>
          </>
        ) : (
          <Text style={styles.body}>Online · {form.location.onlinePlatform || 'platform TBA'}</Text>
        )}
      </ReviewBlock>

      <ReviewBlock label="Capacity & pricing" onEdit={() => setStep(4)}>
        <Text style={styles.body}>
          {form.capacity.total} artists
          {form.registrationMode === 'paid_ticket' ? ` · ₹${form.pricing.amount.toLocaleString('en-IN')}` : ' · Free RSVP'}
        </Text>
        <Text style={styles.dim}>
          Groups up to {form.maxGuestsPerRegistration}
          {' · '}{form.allowWaitlist ? (form.waitlistAutoPromote ? 'Waitlist · auto-promote' : 'Waitlist · manual') : 'No waitlist'}
          {form.walkupsAllowed ? ' · Walk-ups' : ''}
        </Text>
      </ReviewBlock>

      <ReviewBlock label="About" onEdit={() => setStep(5)}>
        <Text style={styles.sub} numberOfLines={4}>{form.about}</Text>
        {form.agenda.length ? <Text style={styles.dim}>{form.agenda.length} day{form.agenda.length === 1 ? '' : 's'} mapped</Text> : null}
      </ReviewBlock>

      <ReviewBlock label="Media" onEdit={() => setStep(6)}>
        <Text style={styles.body}>{form.media.length} item{form.media.length === 1 ? '' : 's'}</Text>
      </ReviewBlock>

      <Pressable onPress={submit} disabled={isSubmitting} style={[styles.publishBtn, isSubmitting && styles.publishDisabled]}>
        {isSubmitting
          ? <ActivityIndicator color={ORANGE_INK} />
          : <Text style={styles.publishText}>{editMode ? 'Save changes' : 'Publish event'}</Text>}
      </Pressable>
    </View>
  );
}

function ReviewBlock({ label, onEdit, children }: { label: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.blockLabel}>{label}</Text>
        <Pressable onPress={onEdit} hitSlop={8}><Text style={styles.editLink}>Edit</Text></Pressable>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, borderRadius: 12, padding: 14 },
  blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  blockLabel: { fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: TEXT_3 },
  editLink: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: ORANGE },
  serif: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: TEXT_0 },
  body: { fontFamily: 'Outfit-Regular', fontSize: 13.5, color: TEXT_0 },
  sub: { fontFamily: 'Outfit-Regular', fontSize: 12.5, color: TEXT_1, marginTop: 2, lineHeight: 18 },
  dim: { fontFamily: 'Outfit-Regular', fontSize: 11.5, color: TEXT_3, marginTop: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: HAIRLINE, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontFamily: 'Outfit-Medium', fontSize: 11.5, color: TEXT_1 },
  publishBtn: { height: 50, borderRadius: 11, backgroundColor: TEXT_0, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  publishDisabled: { backgroundColor: SURFACE },
  publishText: { fontFamily: 'Outfit-Bold', fontSize: 14.5, color: ORANGE_INK },
  result: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 36, paddingHorizontal: 8 },
  resultIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  resultEyebrow: { fontFamily: 'SpaceMono-Bold', fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: GREEN },
  resultTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: TEXT_0, textAlign: 'center', marginTop: 2 },
  resultBody: { fontFamily: 'Outfit-Regular', fontSize: 13, color: TEXT_2, textAlign: 'center', lineHeight: 19, maxWidth: 300, marginTop: 2 },
  resultBtn: { backgroundColor: TEXT_0, borderRadius: 11, paddingVertical: 13, paddingHorizontal: 24, marginTop: 16 },
  resultBtnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: HAIRLINE },
  resultBtnText: { fontFamily: 'Outfit-Bold', fontSize: 14, color: ORANGE_INK },
});
