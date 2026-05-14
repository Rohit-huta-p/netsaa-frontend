import { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useEventsList } from '@/hooks/useEvents';
import DiscoveryRail from './DiscoveryRail';

export default function DiscoveryFeed() {
  // Above-fold rails — fetched immediately
  const featured = useEventsList({ limit: 8 });
  const nearYou = useEventsList({ city: 'mumbai', limit: 8 });
  const following = useEventsList({ limit: 8 }); // backend follow-filter ships post-MVP; uses base list for now

  // Below-fold rails — same query for now; backend rail-personalization ships later
  const workshops = useEventsList({ topicTag: 'workshop', limit: 8 });
  const auditions = useEventsList({ topicTag: 'audition', limit: 8 });
  const masterclasses = useEventsList({ topicTag: 'masterclass', limit: 8 });
  const newThisWeek = useEventsList({ limit: 8 });

  const rails = useMemo(() => ([
    { title: 'Featured this week', query: featured, variant: 'wide' as const },
    { title: 'Near you', query: nearYou, variant: 'tall' as const },
    { title: 'From people you follow', query: following, variant: 'tall' as const },
    { title: 'Workshops', query: workshops, variant: 'tall' as const },
    { title: 'Open auditions', query: auditions, variant: 'tall' as const },
    { title: 'Masterclasses', query: masterclasses, variant: 'tall' as const },
    { title: 'New this week', query: newThisWeek, variant: 'tall' as const },
  ]), [featured, nearYou, following, workshops, auditions, masterclasses, newThisWeek]);

  return (
    <ScrollView className="flex-1 bg-event-bg" contentContainerStyle={{ paddingBottom: 60 }}>
      {rails.map((rail) => (
        <DiscoveryRail
          key={rail.title}
          title={rail.title}
          events={rail.query.data?.events ?? []}
          isLoading={rail.query.isLoading}
          variant={rail.variant}
        />
      ))}
    </ScrollView>
  );
}
