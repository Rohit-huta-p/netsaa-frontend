// src/components/dashboard/artist/home/ArtistWhatYoureIn.tsx
//
// Section 3 — "What you're in". Two primary tabs (Gigs / Events), each with
// sub-tabs and a See-all per sub-tab (artist-home-final.html, skin A):
//   Gigs   → Applied · Hired · Saved
//   Events → Registered · Saved · Past
// Data via useArtistInvolvement (useUpcoming / useApplications / useSavedItems).

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  SectionTitle,
  SegTabs,
  SubTabs,
  Row,
  SeeAll,
  EmptyState,
  fmtShortDate,
  fmtAgo,
  fmtRupees,
  PillTone,
} from './ui';
import useArtistInvolvement from './useArtistInvolvement';

type Primary = 'gigs' | 'events';
type GigSub = 'applied' | 'hired' | 'saved';
type EventSub = 'registered' | 'saved' | 'past';

const APP_PILL: Record<string, { label: string; tone: PillTone }> = {
  applied: { label: 'Applied', tone: 'muted' },
  reviewed: { label: 'Reviewed', tone: 'purple' },
  pending: { label: 'Reviewed', tone: 'purple' },
  shortlisted: { label: 'Shortlisted', tone: 'gold' },
  offered: { label: 'Offered', tone: 'green' },
  approved: { label: 'Offered', tone: 'green' },
};
const appPill = (status?: string): { label: string; tone: PillTone } =>
  APP_PILL[String(status ?? '').toLowerCase()] ?? { label: 'Applied', tone: 'muted' };

const initialOf = (t?: string) => (t?.[0] ?? '·').toUpperCase();

export default function ArtistWhatYoureIn() {
  const router = useRouter();
  const [primary, setPrimary] = useState<Primary>('gigs');
  const [gigSub, setGigSub] = useState<GigSub>('applied');
  const [eventSub, setEventSub] = useState<EventSub>('registered');

  const { applied, hired, savedGigs, registered, savedEvents, past } = useArtistInvolvement();

  const goGigs = () => router.push('/gigs' as any);
  const goEvents = () => router.push('/events' as any);

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
        <View>
          <SubTabs
            value={gigSub}
            onChange={setGigSub}
            options={[
              { key: 'applied', label: 'Applied', count: applied.length },
              { key: 'hired', label: 'Hired', count: hired.length },
              { key: 'saved', label: 'Saved', count: savedGigs.length },
            ]}
          />

          {gigSub === 'applied' ? (
            applied.length === 0 ? (
              <EmptyState copy="No active applications. Apply to a gig and it lands here." cta="Browse gigs" onPress={goGigs} />
            ) : (
              <View>
                {applied.map((a: any, i: number) => {
                  const title = a?.gig?.title ?? a?.gigTitle ?? 'Application';
                  const id = a?.gigId ?? a?.gig?._id ?? a?.gig?.id;
                  return (
                    <Row
                      key={a?._id ?? a?.id ?? i}
                      kind="gig"
                      initial={initialOf(title)}
                      title={title}
                      pill={appPill(a?.status)}
                      meta={[a?.gig?.location ?? a?.location, a?.gig?.date ? fmtShortDate(a.gig.date) : null].filter(Boolean).join(' · ')}
                      right={fmtRupees(a?.gig?.payRupees ?? a?.payRupees)}
                      rightSub={fmtAgo(a?.appliedAt)}
                      onPress={() => id && router.push(`/gigs/${id}` as any)}
                    />
                  );
                })}
                <SeeAll label="SEE ALL APPLIED" onPress={goGigs} />
              </View>
            )
          ) : gigSub === 'hired' ? (
            hired.length === 0 ? (
              <EmptyState copy="No confirmed gigs yet. Your bookings show up here." cta="Browse gigs" onPress={goGigs} />
            ) : (
              <View>
                {hired.map((it: any) => (
                  <Row
                    key={it.id}
                    kind="gig"
                    initial={initialOf(it.title)}
                    title={it.title}
                    pill={{ label: 'Confirmed', tone: 'green' }}
                    meta={[it.location, fmtShortDate(it.date)].filter(Boolean).join(' · ')}
                    right={fmtRupees(it.payRupees)}
                    onPress={() => router.push(`/gigs/${it.id}` as any)}
                  />
                ))}
                <SeeAll label="SEE ALL HIRED" onPress={goGigs} />
              </View>
            )
          ) : savedGigs.length === 0 ? (
            <EmptyState copy="No saved gigs. Bookmark the ones worth revisiting." cta="Browse gigs" onPress={goGigs} />
          ) : (
            <View>
              {savedGigs.map((it: any, i: number) => (
                <Row
                  key={it?._id ?? it?.id ?? i}
                  kind="gig"
                  initial={initialOf(it?.title)}
                  title={it?.title ?? 'Saved gig'}
                  meta={[it?.location ?? it?.city, it?.date ? fmtShortDate(it.date) : null].filter(Boolean).join(' · ')}
                  right={fmtRupees(it?.payRupees)}
                  saved
                  onPress={() => router.push(`/gigs/${it?._id ?? ''}` as any)}
                />
              ))}
              <SeeAll label="SEE ALL SAVED" onPress={goGigs} />
            </View>
          )}
        </View>
      ) : (
        <View>
          <SubTabs
            value={eventSub}
            onChange={setEventSub}
            options={[
              { key: 'registered', label: 'Registered', count: registered.length },
              { key: 'saved', label: 'Saved', count: savedEvents.length },
              { key: 'past', label: 'Past', count: past.length },
            ]}
          />

          {eventSub === 'registered' ? (
            registered.length === 0 ? (
              <EmptyState copy="No registrations yet. RSVP to events near you." cta="Browse events" onPress={goEvents} />
            ) : (
              <View>
                {registered.map((it: any) => {
                  const free = !it.payRupees || it.payRupees <= 0;
                  return (
                    <Row
                      key={it.id}
                      kind="event"
                      initial={initialOf(it.title)}
                      title={it.title}
                      pill={{ label: 'Registered', tone: 'blue' }}
                      meta={[it.location, fmtShortDate(it.date)].filter(Boolean).join(' · ')}
                      right={free ? 'Free' : fmtRupees(it.payRupees)}
                      onPress={() => router.push(`/events/${it.id}` as any)}
                    />
                  );
                })}
                <SeeAll label="SEE ALL REGISTERED" onPress={goEvents} />
              </View>
            )
          ) : eventSub === 'saved' ? (
            savedEvents.length === 0 ? (
              <EmptyState copy="No saved events. Bookmark to come back later." cta="Browse events" onPress={goEvents} />
            ) : (
              <View>
                {savedEvents.map((it: any, i: number) => {
                  const amt = it?.pricing?.amount;
                  return (
                    <Row
                      key={it?._id ?? it?.id ?? i}
                      kind="event"
                      initial={initialOf(it?.title)}
                      title={it?.title ?? 'Saved event'}
                      meta={[it?.location ?? it?.city, it?.startsAt ? fmtShortDate(it.startsAt) : null].filter(Boolean).join(' · ')}
                      right={amt ? fmtRupees(amt) : 'Free'}
                      saved
                      onPress={() => router.push(`/events/${it?._id ?? ''}` as any)}
                    />
                  );
                })}
                <SeeAll label="SEE ALL SAVED" onPress={goEvents} />
              </View>
            )
          ) : past.length === 0 ? (
            <EmptyState copy="No past events yet. Attended events show up here." cta="Browse events" onPress={goEvents} />
          ) : (
            <View>
              {past.map((it: any, i: number) => (
                <Row
                  key={it?._id ?? it?.id ?? i}
                  kind="event"
                  muted
                  initial={initialOf(it?.title)}
                  title={it?.title ?? 'Past event'}
                  meta={it?.location ?? ''}
                  rightSub="ATTENDED"
                  onPress={() => router.push(`/events/${it?._id ?? ''}` as any)}
                />
              ))}
              <SeeAll label="SEE ALL PAST" onPress={goEvents} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20, marginTop: 4 },
});
