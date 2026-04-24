import React from 'react';
import { render } from '@testing-library/react-native';

// Mutable mock state — each test sets this before rendering. This keeps a
// single React registry (vs jest.isolateModules, which reloads React and
// breaks hook dispatch with "Cannot read properties of null (reading
// 'useMemo')").
let mockHookReturn: any = { data: { applicants: [] }, isLoading: false, error: null, refetch: jest.fn() };

jest.mock('@/hooks/useHiredArtists', () => ({
  useHiredArtists: () => mockHookReturn,
}));

// The jest-level mock here overrides the global mock from jest-setup.ts, so
// we also need to stub `Link` since SectionCard (our parent chrome) renders
// <Link href={seeAllHref}>.
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

import HiredArtistsSection from '../HiredArtistsSection';

describe('HiredArtistsSection', () => {
  it('renders empty state when no hires', () => {
    mockHookReturn = {
      data: { applicants: [] },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    };
    const { getByText } = render(<HiredArtistsSection />);
    expect(getByText('No hires yet')).toBeTruthy();
  });

  it('renders 3 hired artists', () => {
    mockHookReturn = {
      data: { applicants: [
        { _id: 'h1', gigId: 'g1', gigTitle: 'Gig 1', artistSnapshot: { displayName: 'Amit' } },
        { _id: 'h2', gigId: 'g2', gigTitle: 'Gig 2', artistSnapshot: { displayName: 'Beena' } },
        { _id: 'h3', gigId: 'g3', gigTitle: 'Gig 3', artistSnapshot: { displayName: 'Chitra' } },
      ]},
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    };
    const { getByText } = render(<HiredArtistsSection />);
    expect(getByText('Amit')).toBeTruthy();
    expect(getByText('Chitra')).toBeTruthy();
  });
});
