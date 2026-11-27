/**
 * EventEditInPreview — the host "Edit in Preview" screen (P0+P1).
 *
 * Renders the event's OWN Artists-view page (EventDetailViewer) in `edit` mode: the
 * host edits title / tagline / About / price / list items in place, each auto-saving.
 * Fetches the event, drives the store hydrate + auto-save via useEventEdit, and only
 * renders the viewer once the store is hydrated for this id (no flash of stale state).
 *
 * Reached via EventHostHub "Edit event" when EVENT_EDIT_IN_PREVIEW is on; the old
 * `/events/:id/edit` → ComposerV4 wizard remains the fallback (flag off).
 */
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEvent } from '@/hooks/useEvents';
import { useComposerStoreV4 } from '@/components/events/composer/v4/useComposerStoreV4';
import EventDetailViewer from '../EventDetailViewer';
import { useEventEdit } from './useEventEdit';

const CANVAS = '#121216';
const ORANGE = '#FF6B35';

export default function EventEditInPreview({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { data: event } = useEvent(eventId);
  const { controller, saveState, retry } = useEventEdit(eventId, event);
  const hydratedId = useComposerStoreV4((s) => s.editEventId);

  const ready = !!event && hydratedId === eventId;
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: CANVAS, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }

  const exit = () =>
    router.canGoBack() ? router.back() : router.replace(`/events/${eventId}/manage/overview` as any);

  return (
    <View style={{ flex: 1, backgroundColor: CANVAS }}>
      <EventDetailViewer
        event={event}
        edit={controller}
        saveState={saveState}
        onRetrySave={retry}
        onExitEdit={exit}
      />
    </View>
  );
}
