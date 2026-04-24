// netsa-mobile/src/constants/performerGroups.ts
//
// Central disclosure logic: given the user's performer-type selection,
// which conditional blocks should Page 3 reveal? 5 groups:
//
//   A — Music performers (Singer, Musician, Band, DJ, Music Producer)
//   B — Visual performers (Dancer, Actor, Emcee, Performing Artist)
//   C — Models
//   D — Creative crew (Photographer, Videographer, Makeup Artist, Stylist)
//   E — Other / unrecognized
//
// Multi-select unions the groups. See spec §3 for full disclosure matrix.

export type Group = 'A' | 'B' | 'C' | 'D' | 'E';

export const PERFORMER_TYPES = [
  'Dancer',
  'Actor',
  'Singer',
  'Musician',
  'Band',
  'DJ',
  'Music Producer',
  'Model',
  'Photographer',
  'Videographer',
  'Makeup Artist',
  'Stylist',
  'Emcee',
  'Performing Artist',
  'Other',
] as const;

// Note: length above is 15, but spec roster says 12 "headline" entries.
// Emcee + Performing Artist + Other round the list to 15 because they
// exist in the CURRENT form's list and we shouldn't drop existing
// options mid-migration. Plan 5 ships with all 15; a future cleanup
// can trim Performing Artist if it's unused.

const GROUP_A = new Set(['Singer', 'Musician', 'Band', 'DJ', 'Music Producer']);
const GROUP_B = new Set(['Dancer', 'Actor', 'Emcee', 'Performing Artist']);
const GROUP_C = new Set(['Model']);
const GROUP_D = new Set(['Photographer', 'Videographer', 'Makeup Artist', 'Stylist']);

export function resolveGroups(types: string[]): Set<Group> {
  const groups = new Set<Group>();
  for (const t of types) {
    if (GROUP_A.has(t)) groups.add('A');
    else if (GROUP_B.has(t)) groups.add('B');
    else if (GROUP_C.has(t)) groups.add('C');
    else if (GROUP_D.has(t)) groups.add('D');
    else groups.add('E');
  }
  return groups;
}
