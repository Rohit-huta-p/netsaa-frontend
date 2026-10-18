// Smoke test for the "What you're in" full page. Mocks the involvement hooks
// and ?tab=gigs&sub=hired, then asserts the page opens on the Hired list with
// the app bar + "showing all N" and every hired item (not capped).

import React from 'react';
const TestRenderer = require('react-test-renderer');

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ tab: 'gigs', sub: 'hired' }),
}));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));

jest.mock('@/hooks/useUpcoming', () => ({
  __esModule: true,
  default: () => ({
    data: [
      { type: 'gig', id: 'h1', title: 'Sangeet night — Kohl wedding', location: 'Pune', date: '2026-10-25T18:00:00Z', payRupees: 18000 },
      { type: 'gig', id: 'h2', title: 'Corporate Diwali showcase', location: 'Pune', date: '2026-11-09T10:00:00Z', payRupees: 24000 },
      { type: 'event', id: 'r1', title: 'Kathak masterclass', location: 'Pune', date: '2026-11-22T10:00:00Z', payRupees: 500 },
    ],
    isLoading: false,
  }),
}));
jest.mock('@/hooks/useApplications', () => ({
  __esModule: true,
  default: () => ({ data: [{ _id: 'a1', status: 'applied', gig: { title: 'X' }, appliedAt: '2026-10-15' }], isLoading: false }),
}));
jest.mock('@/hooks/useSavedItems', () => ({
  useSavedItems: () => ({ savedItems: [], historyItems: [], isLoading: false }),
}));

import ActivityPage from '../activity';

function collectText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  return Array.isArray(node.children) ? node.children.map(collectText).join(' ') : '';
}

describe('dashboard/activity — What you\'re in full page smoke', () => {
  it('opens on the param sub-tab (Hired) and lists all items', () => {
    let r: any;
    TestRenderer.act(() => {
      r = TestRenderer.create(React.createElement(ActivityPage));
    });
    const txt = collectText(r.toJSON());

    for (const n of [
      'What you', // title
      'YOUR ACTIVITY',
      'Gigs',
      'Events',
      'Hired',
      'SHOWING ALL',
      'Sangeet night — Kohl wedding',
      'Corporate Diwali showcase',
      'CONFIRMED',
    ]) {
      expect(txt).toContain(n);
    }
  });
});
