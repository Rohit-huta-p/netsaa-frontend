/**
 * EventDetailViewer — the artist-facing event page body, shared by:
 *   - the route `/events/[id]` (real artists navigating in)         → mode = default
 *   - the manage "Preview" page-sheet modal (organizer proofing it) → preview
 *
 * Composition (v2): EventHeroV2 → EventDetailV2Body → MeetingLinkRevealCard +
 * DiscussionTabs → MoreByOrganizerRail → EventCtaBar. Resolves the organizer +
 * the "more by organizer" query once, here.
 *
 * In `preview`, the hero's back-chevron CLOSES the modal (instead of navigating)
 * and the register CTA is inert — the organizer can't register for their own
 * event. Everything else is byte-identical to what an artist sees.
 */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { eventService, type EventDoc } from '@/services/eventService';
import { useEventsByOrganizer } from '@/hooks/useEventsByOrganizer';
import { queryKeys } from '@/constants/queryKeys';
import { shareEvent } from '@/lib/eventShare';
import EventHeroV2 from './EventHeroV2';
import EventDetailV2Body from './EventDetailV2Body';
import MoreByOrganizerRail from './MoreByOrganizerRail';
import EventCtaBar from './EventCtaBar';
import MeetingLinkRevealCard from './MeetingLinkRevealCard';
import DiscussionTabs from './DiscussionTabs';
import EventHeroV3 from './EventHeroV3';
import EventDetailV3Body from './EventDetailV3Body';
import { usePublicRoster } from '@/hooks/usePublicRoster';
import { eventDetailV3Enabled } from '@/utils/flags';

const BG = '#0B0A0F'; // v2 bg-1

interface Props {
  event: EventDoc;
  /** Organizer proofing their own event in the manage page-sheet: back closes,
   *  CTA inert. */
  preview?: boolean;
  onClose?: () => void;
  /** Route-only: open the register sheet on mount (?openRegister=1). */
  initialOpenRegister?: boolean;
}

export default function EventDetailViewer({ event, preview, onClose, initialOpenRegister }: Props) {
  const router = useRouter();

  const organizerObj = typeof event.organizerId === 'object' ? event.organizerId : undefined;
  const organizerId =
    organizerObj?._id ?? (typeof event.organizerId === 'string' ? event.organizerId : undefined);
  const organizerName = organizerObj?.name;

  // One query powers both the organizer card's "N events" and the rail.
  const { data: orgEvents } = useEventsByOrganizer(organizerId, event._id);

  // E·9 photo-led page (flag-gated). Roster = public "who's going" (count + names).
  const v3 = eventDetailV3Enabled();
  const { data: roster } = usePublicRoster(v3 ? event._id : undefined);
  const openProfile = (uid?: string) => { if (uid) router.push(`/profile/${uid}` as any); };

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
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false}>
        {/* Hero owns the overlaid nav (back · share · save) */}
        {v3 ? (
          <>
            <EventHeroV3
              event={event}
              onBack={handleBack}
              onShare={() => shareEvent(event)}
              onSave={preview ? undefined : onToggleSave}
              saved={saved}
              goingCount={roster?.count ?? 0}
            />
            <EventDetailV3Body
              event={event}
              goingCount={roster?.count}
              goingNames={roster?.names}
              organizerId={organizerId}
              onOpenProfile={preview ? undefined : openProfile}
            />
          </>
        ) : (
          <>
            <EventHeroV2
              event={event}
              onBack={handleBack}
              onShare={() => shareEvent(event)}
              onSave={preview ? undefined : onToggleSave}
              saved={saved}
            />
            <EventDetailV2Body event={event} organizerEventCount={orgEvents?.total} />
          </>
        )}

        <View style={{ paddingHorizontal: 20 }}>
          <MeetingLinkRevealCard event={event} />
          <DiscussionTabs event={event} />
        </View>

        <MoreByOrganizerRail organizerId={organizerId} currentEventId={event._id} organizerName={organizerName} />

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Register bar — inert while previewing (greyed, non-interactive) */}
      <EventCtaBar event={event} preview={preview} initialOpen={!preview && !!initialOpenRegister} v3={v3} />
    </View>
  );
}
