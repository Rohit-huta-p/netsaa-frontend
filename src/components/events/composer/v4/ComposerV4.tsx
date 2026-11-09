import React, { useEffect, useState } from 'react';
import { Alert, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useComposerStoreV4 } from './useComposerStoreV4';
import { eventToForm } from './composerForm';
import { useCreateEvent, useUpdateEvent, usePublishEvent, useDeleteEvent, useEvent } from '@/hooks/useEvents';
import ComposerShellV4 from './ComposerShellV4';
import ItsLive from './ItsLive';
import LeaveComposerSheet, { type DraftSaveState } from './LeaveComposerSheet';
import { C } from './theme';

type Published = { _id: string; status: string };

const errMsg = (err: any, fallback: string) =>
  err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message || err?.message || fallback;

/**
 * Top-level v4 composer.
 *
 * Create mode (no eventId): backing out auto-saves the work as a DRAFT (the
 * "safe by default" leave sheet), so the host never loses it. Once a draft
 * exists, Publish finalizes THAT event (patch + publish) instead of creating a
 * duplicate, and Discard deletes it. Publishing fresh (never backed out) still
 * creates a live event directly → "It's live".
 *
 * Edit mode (eventId): fetch the event, hydrate once, save via PATCH; the leave
 * sheet saves on tap (no auto-save of a live event), then returns to detail.
 */
export default function ComposerV4({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const form = useComposerStoreV4((s) => s.form);
  const payload = useComposerStoreV4((s) => s.payload);
  const reset = useComposerStoreV4((s) => s.reset);
  const hydrate = useComposerStoreV4((s) => s.hydrate);

  // The auto-saved draft's id (create mode). Drives publish-from-draft + discard-delete.
  const [draftId, setDraftId] = useState<string | null>(null);
  const effId = eventId || draftId || '';

  const create = useCreateEvent();
  const update = useUpdateEvent(effId);
  const publish = usePublishEvent(effId);
  const del = useDeleteEvent();
  const { data: event } = useEvent(eventId); // query disabled when eventId is undefined

  const [published, setPublished] = useState<Published | null>(null);
  const [hydrated, setHydrated] = useState(!eventId); // create mode is ready immediately
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [saveState, setSaveState] = useState<DraftSaveState>('saving'); // create-mode pill
  const [editSaving, setEditSaving] = useState(false);                  // edit-mode PATCH in flight

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

  const submitting = create.isPending || update.isPending || publish.isPending;

  const handleSubmit = () => {
    // A reel still transcoding on Mux has no playbackId yet; publishing now would
    // drop it (buildMedia only keeps ready reels) and nothing server-side would
    // re-attach it. Make the host wait the few seconds instead.
    if (form.videos.some((v) => v.status === 'processing')) {
      Alert.alert('Video still processing', 'Your video is almost ready — give it a few seconds, then publish.');
      return;
    }
    if (eventId) {
      // Editing a live event → PATCH, back to detail.
      update.mutate(payload() as any, {
        onSuccess: () => { reset(); router.replace(`/(app)/events/${eventId}`); },
        onError: (e) => Alert.alert('Could not save changes', errMsg(e, 'Please try again.')),
      });
    } else if (draftId) {
      // Already auto-saved as a draft → finalize THIS event: patch real values,
      // then flip it live. No second event, no orphan draft.
      update.mutate(payload() as any, {
        onSuccess: () => publish.mutate(undefined, {
          onSuccess: () => setPublished({ _id: draftId, status: 'live' }),
          onError: (e) => Alert.alert('Could not publish', errMsg(e, 'Please try again.')),
        }),
        onError: (e) => Alert.alert('Could not publish', errMsg(e, 'Please try again.')),
      });
    } else {
      // Never backed out → create the live event directly.
      create.mutate(payload() as any, {
        onSuccess: (data) => setPublished({ _id: data._id, status: data.status as string }),
        onError: (e) => Alert.alert('Could not publish', errMsg(e, 'Please try again.')),
      });
    }
  };

  const close = () => { reset(); router.back(); };

  // Auto-save the draft the instant the host backs out of a NEW event, so the
  // sheet can confirm "Draft saved". Re-entry PATCHes the same draft (no dupes).
  const autosaveDraft = () => {
    setSaveState('saving');
    if (draftId) {
      update.mutate(payload() as any, {
        onSuccess: () => setSaveState('saved'),
        onError: () => setSaveState('error'),
      });
    } else {
      create.mutate({ ...payload(), status: 'draft' } as any, {
        onSuccess: (data) => { setDraftId(data._id); setSaveState('saved'); },
        onError: () => setSaveState('error'),
      });
    }
  };

  // Only interrupt with the sheet when the host actually entered something.
  const requestClose = () => {
    if (!useComposerStoreV4.getState().isDirty()) { close(); return; }
    setLeaveOpen(true);
    if (!eventId) autosaveDraft();   // create: save now · edit: saves on tap
  };

  const keepEditing = () => setLeaveOpen(false);

  // create → draft is already saved, just leave · edit → PATCH then leave
  const onPrimary = () => {
    if (!eventId) { setLeaveOpen(false); close(); return; }
    setEditSaving(true);
    update.mutate(payload() as any, {
      onSuccess: () => { setEditSaving(false); setLeaveOpen(false); reset(); router.replace(`/(app)/events/${eventId}`); },
      onError: (e) => { setEditSaving(false); Alert.alert('Could not save changes', errMsg(e, 'Please try again.')); },
    });
  };

  // create → delete the auto-saved draft · edit → just leave (keep the live event)
  const onDiscard = () => {
    setLeaveOpen(false);
    if (!eventId && draftId) del.mutate(draftId); // fire-and-forget; lists invalidate
    close();
  };

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

  return (
    <>
      <ComposerShellV4 onPublish={handleSubmit} onClose={requestClose} publishing={submitting} />
      <LeaveComposerSheet
        visible={leaveOpen}
        mode={eventId ? 'edit' : 'create'}
        saveState={saveState}
        editSaving={editSaving}
        onPrimary={onPrimary}
        onRetry={autosaveDraft}
        onKeepEditing={keepEditing}
        onDiscard={onDiscard}
      />
    </>
  );
}
