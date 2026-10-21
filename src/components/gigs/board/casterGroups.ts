// src/components/gigs/board/casterGroups.ts
//
// Client-side data derivation for the gig board's two lenses. Both lenses are
// transforms over the SAME `gigsData` the screen already fetched — no new data
// path. `buildCasterGroups` powers the Casting lens (wellfound-style, grouped by
// poster); `distinctCraftOptions` powers the filter sheet's data-driven
// performer multi-select.

import { ARTIST_OPTIONS, FilterOption } from '@/components/gigs/discovery/gigFilterOptions';
import { fmtDate, fmtPayShort, fmtUrgency } from './theme';

export type CasterRole = {
  gig: any;
  title: string;
  date: string;
  pay: string;
  urgLabel?: string; // amber "Nd left" when the role's deadline is near
};

export type CasterGroup = {
  id: string; // dedup key (org id, else display name, else gig id)
  organizerId?: string; // real organizer id, when present → links to /profile/:id
  name: string;
  city?: string;
  avatarUrl?: string;
  roles: CasterRole[];
  total: number;
  verified: boolean; // OFF until the model carries a trust/verified field
  workedGigs?: number; // OFF until a collaboration signal exists on the list
};

const orgIdOf = (g: any): string | undefined =>
  typeof g?.organizerId === 'object' ? g?.organizerId?._id : g?.organizerId;

/** Group the current gig list by poster. Casters with more open roles first. */
export function buildCasterGroups(gigs: any[]): CasterGroup[] {
  const map = new Map<string, CasterGroup>();
  for (const g of gigs || []) {
    const snap = g?.organizerSnapshot || {};
    const orgId = orgIdOf(g);
    const key = String(orgId || snap.displayName || g?._id || Math.random());
    const u = fmtUrgency(g);
    const role: CasterRole = {
      gig: g,
      title: g?.title || 'Untitled role',
      date: fmtDate(g?.applicationDeadline || g?.schedule?.startDate || g?.createdAt),
      pay: fmtPayShort(g?.compensation),
      urgLabel: u?.soon ? u.label : undefined,
    };
    const existing = map.get(key);
    if (existing) {
      existing.roles.push(role);
      existing.total += 1;
      if (!existing.city && g?.location?.city) existing.city = g.location.city;
    } else {
      map.set(key, {
        id: key,
        organizerId: typeof orgId === 'string' ? orgId : undefined,
        name: snap.organizationName || snap.displayName || 'Caster',
        city: g?.location?.city,
        avatarUrl: snap.profileImageUrl,
        roles: [role],
        total: 1,
        verified: false, // honest: no verified/trust field on the gig model yet
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

const titleCase = (v: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : v);

/**
 * Options for the performer multi-select = the known ARTIST_OPTIONS (exact
 * lowercase values, behaviour-identical) UNION any distinct `artistTypes` found
 * in the loaded gigs that aren't already covered (deduped case-insensitively).
 * Data-derived extras keep their own casing as the value and show Title-cased.
 */
export function distinctCraftOptions(gigs: any[]): FilterOption[] {
  const byKey = new Map<string, FilterOption>();
  for (const o of ARTIST_OPTIONS) byKey.set(o.value.toLowerCase(), o);
  for (const g of gigs || []) {
    for (const t of g?.artistTypes || []) {
      const v = String(t).trim();
      if (!v) continue;
      const key = v.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, { value: v, label: titleCase(v) });
    }
  }
  return Array.from(byKey.values());
}
