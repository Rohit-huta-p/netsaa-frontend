/**
 * EventDetailViewer — the artist-facing event page body, shared by:
 *   - the route `/events/[id]` (real artists navigating in)         → mode = default
 *   - the manage "Preview" page-sheet modal (organizer proofing it) → preview
 *
 * Composition (E·9 photo-led): EventHeroV3 → EventDetailV3Body →
 * MeetingLinkRevealCard + DiscussionTabs → MoreByOrganizerRail → EventCtaBar.
 * Resolves the organizer once, here.
 *
 * In `preview`, the hero's back-chevron CLOSES the modal (instead of navigating)
 * and the register CTA is inert — the organizer can't register for their own
 * event. Everything else is byte-identical to what an artist sees.
 */
import { useState } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { Check, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { eventService, type EventDoc } from '@/services/eventService';
import { queryKeys } from '@/constants/queryKeys';
import { shareEvent } from '@/lib/eventShare';
import MoreByOrganizerRail from './MoreByOrganizerRail';
import EventCtaBar from './EventCtaBar';
import MeetingLinkRevealCard from './MeetingLinkRevealCard';
import DiscussionTabs from './DiscussionTabs';
import EventHeroV3 from './EventHeroV3';
import EventDetailV3Body from './EventDetailV3Body';
import { usePublicRoster } from '@/hooks/usePublicRoster';
import MediaViewer, { type MediaViewerItem } from '@/components/profile/MediaViewer';
import { muxPoster } from '@/components/media/NetsaVideoPlayer';
import type { EventEditController, HostEditController, SaveState } from './edit/useEventEdit';
import HostOnlyZone from './edit/HostOnlyZone';

const CANVAS = '#121216'; // A·Minimal C.canvas

interface Props {
  event: EventDoc;
  /** Organizer proofing their own event in the manage page-sheet: back closes,
   *  CTA inert. */
  preview?: boolean;
  onClose?: () => void;
  /** Route-only: open the register sheet on mount (?openRegister=1). */
  initialOpenRegister?: boolean;
  /** Host "Edit in Preview" (P0+P1): when present the page is editable in place —
   *  the register CTA is swapped for a save bar and sections render inline inputs. */
  edit?: EventEditController | null;
  /** Host "Edit in Preview" (P2/P3): commit handles for the host-only zone + sheets. */
  host?: HostEditController | null;
  saveState?: SaveState;
  onRetrySave?: () => void;
  onExitEdit?: () => void;
}

export default function EventDetailViewer({
  event, preview, onClose, initialOpenRegister, edit, host, saveState = 'idle', onRetrySave, onExitEdit,
}: Props) {
  const editing = !!edit;
  const router = useRouter();

  const organizerObj = typeof event.organizerId === 'object' ? event.organizerId : undefined;
  const organizerId =
    organizerObj?._id ?? (typeof event.organizerId === 'string' ? event.organizerId : undefined);
  const organizerName = event.organizerSnapshot?.organizationName || organizerObj?.name;

  // Public "who's going" (count + names).
  const { data: roster } = usePublicRoster(event._id);
  const openProfile = (uid?: string) => { if (uid) router.push(`/profile/${uid}` as any); };

  // E·9 gallery → fullscreen viewer. Reuses the profile MediaViewer with no
  // `artist` (so the Connect action is hidden) and shares the event, not a
  // profile. Built once here and shared by both the rail and the lightbox.
  const [mediaIndex, setMediaIndex] = useState<number | null>(null);
  const galleryCity = (event.location as any)?.city as string | undefined;
  const galleryItems: MediaViewerItem[] = [...(event.media ?? [])]
    .filter((m) => (m.kind === 'photo' ? !!m.url : m.status !== 'errored' && (!!m.thumbnailUrl || !!m.muxPlaybackId)))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m): MediaViewerItem => ({
      url: m.kind === 'video' ? (m.thumbnailUrl || (m.muxPlaybackId ? muxPoster(m.muxPlaybackId) : '')) : m.url,
      type: m.kind === 'photo' ? 'image' : 'video',
      muxPlaybackId: m.muxPlaybackId,
      aspectRatio: m.aspectRatio,
      // No per-slide title in the event viewer — the event name already
      // owns the hero; a caption on every photo is redundant.
      location: galleryCity,
    }));

  // Save / unsave — POST /v1/events/:id/save toggles server-side and returns the
  // new state. Seeded from viewerContext.hasSaved (detail endpoint), optimistic
  // with rollback, and refreshes the artist dashboard's Saved list.
  const qc = useQueryClient();
  const [saved, setSaved] = useState<boolean>(!!(event as any).viewerContext?.hasSaved);
  const onToggleSave = async () => {
    const prev = saved;
    setSaved(!prev);
    try {
      const r = await eventService.saveEvent(event._id);
      setSaved(r.saved);
      qc.invalidateQueries({ queryKey: ['savedEvents'] });
      qc.invalidateQueries({ queryKey: queryKeys.artist.savedEvents() });
    } catch {
      setSaved(prev); // roll back on failure
    }
  };

  const handleBack = preview
    ? onClose ?? (() => {})
    : () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={{ flex: 1, backgroundColor: CANVAS }}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={editing ? 'handled' : undefined}
        automaticallyAdjustKeyboardInsets={editing}
      >
        {/* Hero owns the overlaid nav (back · share · save) */}
        <EventHeroV3
          event={event}
          onBack={editing ? (onExitEdit ?? handleBack) : handleBack}
          onShare={() => shareEvent(event)}
          onSave={preview || editing ? undefined : onToggleSave}
          saved={saved}
          goingCount={roster?.count ?? 0}
          edit={edit}
        />
        <EventDetailV3Body
          event={event}
          goingCount={roster?.count}
          goingNames={roster?.names}
          organizerId={organizerId}
          onOpenProfile={preview ? undefined : openProfile}
          media={galleryItems}
          onOpenMedia={setMediaIndex}
          edit={edit}
        />

        {/* Host-only zone — the rest of the event form, edit mode only. */}
        {editing && host ? <HostOnlyZone host={host} event={event} /> : null}

        <View style={{ paddingHorizontal: 20 }}>
          <MeetingLinkRevealCard event={event} />
          <DiscussionTabs event={event} />
        </View>

        <MoreByOrganizerRail organizerId={organizerId} currentEventId={event._id} organizerName={organizerName} />

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Edit mode swaps the register CTA for the auto-save bar; otherwise the
          register bar (inert while previewing). */}
      {editing ? (
        <EditSaveBar saveState={saveState} onRetry={onRetrySave} onDone={onExitEdit} />
      ) : (
        <EventCtaBar event={event} preview={preview} initialOpen={!preview && !!initialOpenRegister} v3 />
      )}

      {/* Fullscreen gallery viewer — overlays everything, including the CTA bar */}
      {mediaIndex !== null && galleryItems[mediaIndex] ? (
        <MediaViewer
          items={galleryItems}
          index={mediaIndex}
          onClose={() => setMediaIndex(null)}
          showShare={false}
        />
      ) : null}
    </View>
  );
}

/**
 * The bottom bar in edit mode: an auto-save status line + Done. Replaces the register
 * CTA — the host can't register for their own event, and "Edit in Preview" saves per
 * field, so there is no explicit Save.
 */
function EditSaveBar({
  saveState, onRetry, onDone,
}: {
  saveState: SaveState;
  onRetry?: () => void;
  onDone?: () => void;
}) {
  const error = saveState === 'error';
  return (
    <View style={sb.bar}>
      <Pressable
        onPress={error ? onRetry : undefined}
        disabled={!error}
        style={sb.status}
        accessibilityRole={error ? 'button' : 'text'}
        accessibilityLabel={error ? 'Retry saving' : undefined}
      >
        {saveState === 'saving' ? (
          <Text style={sb.statusTxt}>Saving…</Text>
        ) : error ? (
          <>
            <RefreshCw size={13} color="#F08B6A" />
            <Text style={[sb.statusTxt, { color: '#F08B6A' }]}>Couldn’t save · Retry</Text>
          </>
        ) : saveState === 'saved' ? (
          <>
            <Check size={13} color="#22C55E" />
            <Text style={sb.statusTxt}>All changes saved</Text>
          </>
        ) : (
          <Text style={[sb.statusTxt, { color: '#8C857B' }]}>Editing</Text>
        )}
      </Pressable>
      <Pressable onPress={onDone} style={sb.done} accessibilityRole="button" accessibilityLabel="Done editing">
        <Text style={sb.doneTxt}>Done</Text>
      </Pressable>
    </View>
  );
}

const sb = {
  bar: {
    position: 'absolute' as const, left: 0, right: 0, bottom: 0,
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28,
    backgroundColor: 'rgba(18,18,22,0.96)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  status: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 7 },
  statusTxt: { fontFamily: 'Outfit-Medium', fontSize: 13, color: '#C9C4BC' },
  done: { paddingHorizontal: 22, paddingVertical: 11, borderRadius: 12, backgroundColor: '#FF6B35' },
  doneTxt: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#fff' },
};
