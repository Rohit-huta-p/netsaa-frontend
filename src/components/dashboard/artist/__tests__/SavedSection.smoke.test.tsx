/**
 * SavedSection smoke tests — mock the artistHome useSavedItems hook so we
 * render with both tabs populated, then toggle tabs.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockUseSavedItems = jest.fn();
jest.mock('@/hooks/artistHome/useSavedItems', () => ({
  __esModule: true,
  useSavedItems: (...args: any[]) => mockUseSavedItems(...args),
  default: (...args: any[]) => mockUseSavedItems(...args),
}));

import SavedSection from '../SavedSection';

describe('SavedSection (smoke)', () => {
  beforeEach(() => {
    mockUseSavedItems.mockReset();
  });

  it('renders both tabs with count badges when data exists', () => {
    mockUseSavedItems.mockReturnValue({
      gigs: [
        {
          _id: 'g1',
          title: 'Friday night jazz quartet',
          organizer: { name: 'Blue Note Pune' },
          eventDate: '2026-05-01',
          amount: 12000,
        },
        {
          _id: 'g2',
          title: 'Navratri garba lead',
          organizer: { name: 'Festival Org' },
          eventDate: '2026-10-01',
        },
      ],
      events: [
        {
          _id: 'e1',
          title: 'Kathak masterclass',
          startDate: '2026-05-10',
          venue: 'Pune Arts Center',
        },
      ],
      isLoading: false,
      error: null,
    });

    const { getByLabelText, getByText } = render(<SavedSection />);

    // Tab labels with counts
    expect(getByLabelText(/Gigs tab, 2 items/i)).toBeTruthy();
    expect(getByLabelText(/Events tab, 1 items/i)).toBeTruthy();

    // Default tab = gigs
    expect(getByText('Friday night jazz quartet')).toBeTruthy();
    expect(getByText('Navratri garba lead')).toBeTruthy();
  });

  it('shows the events list after tapping the Events tab', () => {
    mockUseSavedItems.mockReturnValue({
      gigs: [
        {
          _id: 'g1',
          title: 'Friday night jazz quartet',
          organizer: { name: 'Blue Note Pune' },
        },
      ],
      events: [
        {
          _id: 'e1',
          title: 'Kathak masterclass',
          startDate: '2026-05-10',
          venue: 'Pune Arts Center',
        },
      ],
      isLoading: false,
      error: null,
    });

    const { getByLabelText, getByText, queryByText } = render(<SavedSection />);

    // Initially on Gigs tab, Kathak masterclass should not yet be shown.
    expect(queryByText('Kathak masterclass')).toBeNull();

    fireEvent.press(getByLabelText(/Events tab/i));

    expect(getByText('Kathak masterclass')).toBeTruthy();
  });
});
