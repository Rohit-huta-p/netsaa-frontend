// src/components/dashboard/artist/home/InvolvementList.tsx
//
// One renderer for a "What you're in" sub-tab list, shared by the home section
// (capped via `limit`, with a See-all) and the full activity page (uncapped).
// Selection + row shape per (primary, sub) live here so the two screens can't
// drift apart.

import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Row, EmptyState, PillTone, fmtShortDate, fmtAgo, fmtRupees } from './ui';
import { ArtistInvolvement } from './useArtistInvolvement';

export type Primary = 'gigs' | 'events';

const APP_PILL: Record<string, { label: string; tone: PillTone }> = {
  applied: { label: 'Applied', tone: 'muted' },
  reviewed: { label: 'Reviewed', tone: 'purple' },
  pending: { label: 'Reviewed', tone: 'purple' },
  shortlisted: { label: 'Shortlisted', tone: 'gold' },
  offered: { label: 'Offered', tone: 'green' },
  approved: { label: 'Offered', tone: 'green' },
};
const appPill = (s?: string): { label: string; tone: PillTone } =>
  APP_PILL[String(s ?? '').toLowerCase()] ?? { label: 'Applied', tone: 'muted' };
const initialOf = (t?: string) => (t?.[0] ?? '·').toUpperCase();

/** The bucket array backing a (primary, sub) pair. */
export function pickItems(inv: ArtistInvolvement, primary: Primary, sub: string): any[] {
  if (primary === 'gigs') {
    if (sub === 'hired') return inv.hired;
    if (sub === 'saved') return inv.savedGigs;
    return inv.applied;
  }
  if (sub === 'registered') return inv.registered;
  if (sub === 'past') return inv.past;
  return inv.savedEvents;
}

const EMPTY: Record<string, { copy: string; cta: string; to: '/gigs' | '/events' }> = {
  'gigs/applied': { copy: 'No active applications. Apply to a gig and it lands here.', cta: 'Browse gigs', to: '/gigs' },
  'gigs/hired': { copy: 'No confirmed gigs yet. Your bookings show up here.', cta: 'Browse gigs', to: '/gigs' },
  'gigs/saved': { copy: 'No saved gigs. Bookmark the ones worth revisiting.', cta: 'Browse gigs', to: '/gigs' },
  'events/registered': { copy: 'No registrations yet. RSVP to events near you.', cta: 'Browse events', to: '/events' },
  'events/saved': { copy: 'No saved events. Bookmark to come back later.', cta: 'Browse events', to: '/events' },
  'events/past': { copy: 'No past events yet. Attended events show up here.', cta: 'Browse events', to: '/events' },
};

function RowFor({ primary, sub, it, idx }: { primary: Primary; sub: string; it: any; idx: number }) {
  const router = useRouter();

  if (primary === 'gigs') {
    if (sub === 'applied') {
      const title = it?.gig?.title ?? it?.gigTitle ?? 'Application';
      const id = it?.gigId ?? it?.gig?._id ?? it?.gig?.id;
      return (
        <Row
          kind="gig"
          initial={initialOf(title)}
          title={title}
          pill={appPill(it?.status)}
          meta={[it?.gig?.location ?? it?.location, it?.gig?.date ? fmtShortDate(it.gig.date) : null].filter(Boolean).join(' · ')}
          right={fmtRupees(it?.gig?.payRupees ?? it?.payRupees)}
          rightSub={fmtAgo(it?.appliedAt)}
          onPress={() => id && router.push(`/gigs/${id}` as any)}
        />
      );
    }
    if (sub === 'hired') {
      return (
        <Row
          kind="gig"
          initial={initialOf(it?.title)}
          title={it?.title ?? 'Confirmed gig'}
          pill={{ label: 'Confirmed', tone: 'green' }}
          meta={[it?.location, it?.date ? fmtShortDate(it.date) : null].filter(Boolean).join(' · ')}
          right={fmtRupees(it?.payRupees)}
          onPress={() => router.push(`/gigs/${it?.id ?? ''}` as any)}
        />
      );
    }
    return (
      <Row
        kind="gig"
        initial={initialOf(it?.title)}
        title={it?.title ?? 'Saved gig'}
        meta={[it?.location ?? it?.city, it?.date ? fmtShortDate(it.date) : null].filter(Boolean).join(' · ')}
        right={fmtRupees(it?.payRupees)}
        saved
        onPress={() => router.push(`/gigs/${it?._id ?? ''}` as any)}
      />
    );
  }

  // events
  if (sub === 'registered') {
    const free = !it?.payRupees || it.payRupees <= 0;
    return (
      <Row
        kind="event"
        initial={initialOf(it?.title)}
        title={it?.title ?? 'Registered event'}
        pill={{ label: 'Registered', tone: 'blue' }}
        meta={[it?.location, it?.date ? fmtShortDate(it.date) : null].filter(Boolean).join(' · ')}
        right={free ? 'Free' : fmtRupees(it?.payRupees)}
        onPress={() => router.push(`/events/${it?.id ?? ''}` as any)}
      />
    );
  }
  if (sub === 'past') {
    return (
      <Row
        kind="event"
        muted
        initial={initialOf(it?.title)}
        title={it?.title ?? 'Past event'}
        meta={it?.location ?? ''}
        rightSub="ATTENDED"
        onPress={() => router.push(`/events/${it?._id ?? ''}` as any)}
      />
    );
  }
  const amt = it?.pricing?.amount;
  return (
    <Row
      kind="event"
      initial={initialOf(it?.title)}
      title={it?.title ?? 'Saved event'}
      meta={[it?.location ?? it?.city, it?.startsAt ? fmtShortDate(it.startsAt) : null].filter(Boolean).join(' · ')}
      right={amt ? fmtRupees(amt) : 'Free'}
      saved
      onPress={() => router.push(`/events/${it?._id ?? ''}` as any)}
    />
  );
}

export function InvolvementList({
  inv,
  primary,
  sub,
  limit,
}: {
  inv: ArtistInvolvement;
  primary: Primary;
  sub: string;
  limit?: number;
}) {
  const router = useRouter();
  const items = pickItems(inv, primary, sub);

  if (items.length === 0) {
    const e = EMPTY[`${primary}/${sub}`] ?? EMPTY['gigs/applied'];
    return <EmptyState copy={e.copy} cta={e.cta} onPress={() => router.push(e.to as any)} />;
  }

  const shown = typeof limit === 'number' ? items.slice(0, limit) : items;
  return (
    <View>
      {shown.map((it, i) => (
        <RowFor key={it?._id ?? it?.id ?? `${primary}-${sub}-${i}`} primary={primary} sub={sub} it={it} idx={i} />
      ))}
    </View>
  );
}
