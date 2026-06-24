import React from 'react';
import { render } from '@testing-library/react-native';
import ForYouMatchStrip from '../ForYouMatchStrip';

jest.mock('@/hooks/useArtistMatches', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useArtistMatches from '@/hooks/useArtistMatches';
const mockedHook = useArtistMatches as jest.MockedFunction<typeof useArtistMatches>;

describe('ForYouMatchStrip (smoke)', () => {
  it('renders match cards', () => {
    mockedHook.mockReturnValue({
      items: [
        { id: 'm1', kind: 'gig', title: 'Lead Kathak — wedding sangeet', meta: 'Pune · 12 Jun', payRupees: 18000, matchPct: 92, href: '/gigs' },
        { id: 'm2', kind: 'workshop', title: 'Kathak rhythm intensives', meta: 'Online · 5 Jun', payRupees: 0, href: '/events' },
      ],
      isLoading: false,
    });

    const { getByText } = render(<ForYouMatchStrip />);
    expect(getByText('FOR YOU')).toBeTruthy();
    expect(getByText('Lead Kathak — wedding sangeet')).toBeTruthy();
    expect(getByText('GIG · 92% MATCH')).toBeTruthy();
    expect(getByText('EVENT · WORKSHOP')).toBeTruthy();
    expect(getByText('Free RSVP')).toBeTruthy();
  });

  it('renders nothing on empty feed', () => {
    mockedHook.mockReturnValue({ items: [], isLoading: false });
    const { queryByText } = render(<ForYouMatchStrip />);
    expect(queryByText('FOR YOU')).toBeNull();
  });
});
