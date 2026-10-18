// Smoke test for the simplified artist home (skin A). Mocks the data hooks
// with populated fixtures and asserts the three sections render end-to-end:
// greet, Discover (gig card), and What-you're-in (tabs + Applied list + See all).
//
// Uses react-test-renderer directly (not RTL) — matches the house smoke pattern.

import React from 'react';
// require (not import) — react-test-renderer ships no type declarations; the
// house smoke tests consume it this way to avoid an implicit-any TS7016.
const TestRenderer = require('react-test-renderer');

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: jest.fn() }) }));

jest.mock('@/hooks/useHeroData', () => ({
  __esModule: true,
  default: () => ({ data: { displayName: 'Aditi Rao' }, isLoading: false }),
}));
jest.mock('@/hooks/useDiscoverMatches', () => ({
  __esModule: true,
  default: () => ({
    isLoading: false,
    items: [
      { id: 'd1', kind: 'gig', title: 'Lead dancer — Diwali gala', meta: 'Pune · 7 Nov', payRupees: 32000, reason: '', theme: 'orange', href: '/gigs' },
      { id: 'd2', kind: 'workshop', title: 'Kathak masterclass', meta: 'Pune · 22 Nov', payRupees: 500, reason: '', theme: 'purple', href: '/events' },
    ],
  }),
}));
jest.mock('@/hooks/useUpcoming', () => ({
  __esModule: true,
  default: () => ({
    data: [
      { type: 'gig', id: 'h1', title: 'Sangeet night — Kohl wedding', location: 'Pune', date: '2026-10-25T18:00:00Z', payRupees: 18000 },
      { type: 'event', id: 'r1', title: 'Kathak masterclass', location: 'Pune', date: '2026-11-22T10:00:00Z', payRupees: 500 },
    ],
    isLoading: false,
  }),
}));
jest.mock('@/hooks/useApplications', () => ({
  __esModule: true,
  default: () => ({
    data: [
      { _id: 'a1', status: 'shortlisted', gig: { _id: 'g9', title: 'Corporate showcase', location: 'Mumbai', payRupees: 25000, date: '2026-11-21' }, appliedAt: '2026-10-15' },
    ],
    isLoading: false,
  }),
}));
jest.mock('@/hooks/useSavedItems', () => ({
  useSavedItems: () => ({
    savedItems: [{ type: 'GIG', _id: 's1', title: 'Bollywood retro night', city: 'Mumbai', payRupees: 12000 }],
    historyItems: [{ _id: 'p1', title: 'Summer showcase', location: 'Pune' }],
    isLoading: false,
  }),
}));

import ArtistHome from '../artist-home';

// Collect only rendered text (node children), never props — the ScrollView's
// refreshControl prop holds a React element with circular Fiber refs.
function collectText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  return Array.isArray(node.children) ? node.children.map(collectText).join(' ') : '';
}

describe('artist-home (simplified, skin A) — smoke', () => {
  it('renders all three sections with data and no crash', () => {
    let r: any;
    TestRenderer.act(() => {
      r = TestRenderer.create(React.createElement(ArtistHome));
    });
    const txt = collectText(r!.toJSON());

    const needles = [
      'Aditi', // greet
      'Discover',
      'Gigs',
      'Events',
      'Lead dancer', // discover gig card (gigs tab is default)
      'What you', // "What you're in" (apostrophe-safe)
      'Applied',
      'Hired',
      'Saved',
      'Corporate showcase', // default Applied sub-tab list
      'SEE ALL',
      'THE STAGE IS YOURS',
    ];
    for (const n of needles) expect(txt).toContain(n);
  });
});
