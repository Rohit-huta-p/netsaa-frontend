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
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import type { EventDoc } from '@/services/eventService';
import { useEventsByOrganizer } from '@/hooks/useEventsByOrganizer';
import { shareEvent } from '@/lib/eventShare';
import EventHeroV2 from './EventHeroV2';
import EventDetailV2Body from './EventDetailV2Body';
import MoreByOrganizerRail from './MoreByOrganizerRail';
import EventCtaBar from './EventCtaBar';
import MeetingLinkRevealCard from './MeetingLinkRevealCard';
import DiscussionTabs from './DiscussionTabs';

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

  const handleBack = preview
    ? onClose ?? (() => {})
    : () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false}>
        {/* Hero owns the overlaid nav (back · share · save) */}
        <EventHeroV2 event={event} onBack={handleBack} onShare={() => shareEvent(event)} />

        <EventDetailV2Body event={event} organizerEventCount={orgEvents?.total} />

        <View style={{ paddingHorizontal: 20 }}>
          <MeetingLinkRevealCard event={event} />
          <DiscussionTabs event={event} />
        </View>

        <MoreByOrganizerRail organizerId={organizerId} currentEventId={event._id} organizerName={organizerName} />

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Register bar — inert while previewing (greyed, non-interactive) */}
      <EventCtaBar event={event} preview={preview} initialOpen={!preview && !!initialOpenRegister} />
    </View>
  );
}
