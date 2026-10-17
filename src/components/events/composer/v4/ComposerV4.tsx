import React, { useEffect, useState } from 'react';
import { Alert, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useComposerStoreV4 } from './useComposerStoreV4';
import { eventToForm } from './composerForm';
import { useCreateEvent, useUpdateEvent, useEvent } from '@/hooks/useEvents';
import ComposerShellV4 from './ComposerShellV4';
import ItsLive from './ItsLive';
import { C } from './theme';

type Published = { _id: string; status: string };

const errMsg = (err: any, fallback: string) =>
  err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message || err?.message || fallback;

/**
 * Top-level v4 composer. Create mode (no eventId): submit → "It's live".
 * Edit mode (eventId): fetch the event, hydrate the form once, save via PATCH,
 * then return to the event detail (no "It's live" screen on an edit).
 */
export default function ComposerV4({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const form = useComposerStoreV4((s) => s.form);
  const payload = useComposerStoreV4((s) => s.payload);
  const reset = useComposerStoreV4((s) => s.reset);
  const hydrate = useComposerStoreV4((s) => s.hydrate);

  const create = useCreateEvent();
  const update = useUpdateEvent(eventId || '');
  const { data: event, isLoading } = useEvent(eventId); // query disabled when eventId is undefined

  const [published, setPublished] = useState<Published | null>(null);
  const [hydrated, setHydrated] = useState(!eventId); // create mode is ready immediately

  // Clear any leftover edit state when opening a fresh "create".
  useEffect(() => {
    if (!eventId && useComposerStoreV4.getState().editMode) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate exactly once when editing and the event has loaded.
  useEffect(() => {
    if (eventId && event && !hydrated) {
      hydrate(eventToForm(event), eventId);
      setHydrated(true);
    }
  }, [eventId, event, hydrated, hydrate]);

  const submitting = create.isPending || update.isPending;

  const handleSubmit = () => {
    // A reel still transcoding on Mux has no playbackId yet; publishing now would
    // drop it (buildMedia only keeps ready reels) and nothing server-side would
    // re-attach it. Make the host wait the few seconds instead.
    if (form.videos.some((v) => v.status === 'processing')) {
      Alert.alert('Video still processing', 'Your video is almost ready — give it a few seconds, then publish.');
      return;
    }
    if (eventId) {
      update.mutate(payload() as any, {
        onSuccess: () => { reset(); router.replace(`/(app)/events/${eventId}`); },
        onError: (e) => Alert.alert('Could not save changes', errMsg(e, 'Please try again.')),
      });
    } else {
      create.mutate(payload() as any, {
        onSuccess: (data) => setPublished({ _id: data._id, status: data.status as string }),
        onError: (e) => Alert.alert('Could not publish', errMsg(e, 'Please try again.')),
      });
    }
  };

  const close = () => { reset(); router.back(); };

  if (eventId && !hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.orange} />
      </View>
    );
  }

  if (published) {
    return (
      <ItsLive
        eventId={published._id}
        status={published.status}
        title={form.title.trim() || 'Your event'}
        pendingInvites={form.people.filter((p) => p.invited && !p.userId)}
        onViewEvent={() => { const id = published._id; reset(); router.replace(`/(app)/events/${id}`); }}
        onDone={() => { reset(); router.replace('/(app)/events'); }}
      />
    );
  }

  return <ComposerShellV4 onPublish={handleSubmit} onClose={close} publishing={submitting} />;
}
