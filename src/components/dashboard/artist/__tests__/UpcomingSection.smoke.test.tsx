import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import UpcomingSection from '../UpcomingSection';

jest.mock('@/hooks/useUpcoming', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useUpcoming from '@/hooks/useUpcoming';

const mockUpcoming = useUpcoming as jest.MockedFunction<any>;

function setData(data: any[]) {
  mockUpcoming.mockReturnValue({
    data,
    isLoading: false,
    error: null,
  });
}

describe('UpcomingSection (smoke)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders items across week/month/later tabs', () => {
    const now = Date.now();
    const inThreeDays = new Date(now + 3 * 86_400_000).toISOString();
    const inTwentyDays = new Date(now + 20 * 86_400_000).toISOString();
    const inSixtyDays = new Date(now + 60 * 86_400_000).toISOString();

    setData([
      {
        type: 'gig',
        id: 'gig_week',
        title: 'Weekend private party',
        date: inThreeDays,
        counterparty: 'Pune Events',
      },
      {
        type: 'event',
        id: 'event_month',
        title: 'Kathak Masterclass',
        date: inTwentyDays,
        location: 'Symbiosis Campus',
      },
      {
        type: 'gig',
        id: 'gig_later',
        title: 'Winter festival',
        date: inSixtyDays,
      },
    ]);

    const { getByText, queryByText } = render(<UpcomingSection />);

    // Default "This Week" — only the 3-day item should appear.
    expect(getByText('Weekend private party')).toBeTruthy();
    expect(queryByText('Kathak Masterclass')).toBeNull();
    expect(queryByText('Winter festival')).toBeNull();

    // Switch to "This Month" — the 20-day event surfaces.
    fireEvent.press(getByText('This Month'));
    expect(getByText('Kathak Masterclass')).toBeTruthy();

    // Switch to "Later" — the 60-day gig surfaces.
    fireEvent.press(getByText('Later'));
    expect(getByText('Winter festival')).toBeTruthy();
  });

  it('shows the per-tab empty copy when no items match', () => {
    setData([]);

    const { getByText } = render(<UpcomingSection />);
    // Default tab
    expect(getByText('No upcoming gigs this week')).toBeTruthy();

    fireEvent.press(getByText('This Month'));
    expect(getByText('No upcoming gigs this month')).toBeTruthy();

    fireEvent.press(getByText('Later'));
    expect(getByText('No gigs scheduled further out')).toBeTruthy();
  });
});
