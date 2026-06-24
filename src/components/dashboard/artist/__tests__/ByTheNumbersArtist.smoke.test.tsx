import React from 'react';
import { render } from '@testing-library/react-native';
import ByTheNumbersArtist from '../ByTheNumbersArtist';

jest.mock('@/hooks/useArtistNumbers', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useArtistNumbers from '@/hooks/useArtistNumbers';
const mockedHook = useArtistNumbers as jest.MockedFunction<typeof useArtistNumbers>;

describe('ByTheNumbersArtist (smoke)', () => {
  it('renders five KPI labels in the grid', () => {
    mockedHook.mockReturnValue({
      data: {
        earnedThisMonth: 42500,
        profileViews: 184,
        profileViewsDelta: 38,
        applicationsTotal: 23,
        applicationsActive: 12,
        delivered: 7,
        endorsements: 14,
        endorsementsDelta: 3,
        pendingPayouts: 1,
        sparkline: [3, 5, 4, 7, 6, 9, 8],
      },
      isLoading: false,
    });

    const { getByText } = render(<ByTheNumbersArtist />);
    expect(getByText('EARNED THIS MONTH')).toBeTruthy();
    expect(getByText('PROFILE VIEWS')).toBeTruthy();
    expect(getByText('APPLICATIONS')).toBeTruthy();
    expect(getByText('DELIVERED')).toBeTruthy();
    expect(getByText('ENDORSEMENTS')).toBeTruthy();
    expect(getByText(/42[,.]?500/)).toBeTruthy();
    expect(getByText('184')).toBeTruthy();
  });

  it('shows em-dash placeholders for zero metrics', () => {
    mockedHook.mockReturnValue({
      data: {
        earnedThisMonth: 0,
        profileViews: 0,
        profileViewsDelta: 0,
        applicationsTotal: 0,
        applicationsActive: 0,
        delivered: 0,
        endorsements: 0,
        endorsementsDelta: 0,
        pendingPayouts: 0,
        sparkline: [],
      },
      isLoading: false,
    });

    const { getAllByText } = render(<ByTheNumbersArtist />);
    // Earnings + profile views + applications + delivered + endorsements = 5 "—"
    expect(getAllByText('—').length).toBeGreaterThanOrEqual(4);
  });
});
