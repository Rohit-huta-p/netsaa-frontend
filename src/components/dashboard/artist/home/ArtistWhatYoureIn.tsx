// src/components/dashboard/artist/home/ArtistWhatYoureIn.tsx
//
// Section 3 — "What you're in". Two primary tabs (Gigs / Events), each with
// sub-tabs; the home shows up to 3 per sub-tab and a See-all that opens the full
// activity page on that same tab + sub-tab (artist-home-final.html, skin A):
//   Gigs   → Applied · Hired · Saved
//   Events → Registered · Saved · Past

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SectionTitle, SegTabs, SubTabs, SeeAll } from './ui';
import useArtistInvolvement from './useArtistInvolvement';
import { InvolvementList, pickItems } from './InvolvementList';

type Primary = 'gigs' | 'events';
type GigSub = 'applied' | 'hired' | 'saved';
type EventSub = 'registered' | 'saved' | 'past';

const HOME_LIMIT = 3;

export default function ArtistWhatYoureIn() {
  const router = useRouter();
  const [primary, setPrimary] = useState<Primary>('gigs');
  const [gigSub, setGigSub] = useState<GigSub>('applied');
  const [eventSub, setEventSub] = useState<EventSub>('registered');

  const inv = useArtistInvolvement();
  const sub = primary === 'gigs' ? gigSub : eventSub;
  const hasItems = pickItems(inv, primary, sub).length > 0;

  const seeAll = () => router.push(`/dashboard/activity?tab=${primary}&sub=${sub}` as any);

  return (
    <View style={styles.root}>
      <SectionTitle>What you're in</SectionTitle>
      <SegTabs
        value={primary}
        onChange={setPrimary}
        options={[
          { key: 'gigs', label: 'Gigs' },
          { key: 'events', label: 'Events' },
        ]}
      />

      {primary === 'gigs' ? (
        <SubTabs
          value={gigSub}
          onChange={setGigSub}
          options={[
            { key: 'applied', label: 'Applied', count: inv.applied.length },
            { key: 'hired', label: 'Hired', count: inv.hired.length },
            { key: 'saved', label: 'Saved', count: inv.savedGigs.length },
          ]}
        />
      ) : (
        <SubTabs
          value={eventSub}
          onChange={setEventSub}
          options={[
            { key: 'registered', label: 'Registered', count: inv.registered.length },
            { key: 'saved', label: 'Saved', count: inv.savedEvents.length },
            { key: 'past', label: 'Past', count: inv.past.length },
          ]}
        />
      )}

      <InvolvementList inv={inv} primary={primary} sub={sub} limit={HOME_LIMIT} />

      {hasItems ? <SeeAll label={`SEE ALL ${sub.toUpperCase()}`} onPress={seeAll} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20, marginTop: 4 },
});
