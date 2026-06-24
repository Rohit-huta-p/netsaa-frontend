import React from 'react';
import { render } from '@testing-library/react-native';
import DiscoverMatchesStrip from '../DiscoverMatchesStrip';

jest.mock('@/hooks/useDiscoverMatches', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useDiscoverMatches from '@/hooks/useDiscoverMatches';
const mockedHook = useDiscoverMatches as jest.MockedFunction<typeof useDiscoverMatches>;

describe('DiscoverMatchesStrip (smoke)', () => {
  it('renders gigs + events list with type pills and reasons', () => {
    mockedHook.mockReturnValue({
      items: [
        { id: 'd1', kind: 'gig', title: 'Kathak solo — wedding showcase', meta: 'Pune · 12 Jun', payRupees: 18000, reason: 'Matches your Kathak skill', theme: 'orange', href: '/gigs' },
        { id: 'd2', kind: 'workshop', title: 'Kathak rhythm intensives', meta: 'Online · 5 Jun', payRupees: 0, reason: 'For Kathak dancers', theme: 'purple', href: '/events' },
      ],
      isLoading: false,
    });

    const { getByText } = render(<DiscoverMatchesStrip />);
    expect(getByText('DISCOVER')).toBeTruthy();
    expect(getByText('Gigs and events that fit.')).toBeTruthy();
    expect(getByText('Matched by your artist type and skills.')).toBeTruthy();
    expect(getByText('Kathak solo — wedding showcase')).toBeTruthy();
    expect(getByText('Kathak rhythm intensives')).toBeTruthy();
    expect(getByText('GIG')).toBeTruthy();
    expect(getByText('WORKSHOP')).toBeTruthy();
    expect(getByText('Matches your Kathak skill')).toBeTruthy();
    expect(getByText('Free')).toBeTruthy();
  });

  it('renders nothing on empty list', () => {
    mockedHook.mockReturnValue({ items: [], isLoading: false });
    const { queryByText } = render(<DiscoverMatchesStrip />);
    expect(queryByText('DISCOVER')).toBeNull();
  });
});
