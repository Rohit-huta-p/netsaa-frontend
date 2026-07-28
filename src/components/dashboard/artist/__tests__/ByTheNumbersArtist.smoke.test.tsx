import React from 'react';
import { render } from '@testing-library/react-native';
import ByTheNumbersArtist from '../ByTheNumbersArtist';

jest.mock('@/hooks/useArtistNumbers', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useArtistNumbers from '@/hooks/useArtistNumbers';
const mockedHook = useArtistNumbers as jest.MockedFunction<typeof useArtistNumbers>;

describe('ByTheNumbersArtist (Diptych)', () => {
  it('renders the two KPI tiles with their values and delta', () => {
    mockedHook.mockReturnValue({
      data: {
        earnedThisMonth: 84200,
        profileViews: 1284,
        profileViewsDelta: 38,
        pendingPayouts: 1,
        sparkline: [3, 5, 4, 7, 6, 9, 8],
      },
      isLoading: false,
    });

    const { getByText } = render(<ByTheNumbersArtist />);
    expect(getByText('EARNED · THIS MONTH')).toBeTruthy();
    expect(getByText('PROFILE VIEWS')).toBeTruthy();
    expect(getByText(/84[,.]?200/)).toBeTruthy();
    expect(getByText('1,284')).toBeTruthy();
    expect(getByText('▲ 38 this week')).toBeTruthy();
  });

  it('shows em-dash placeholders and honest sub-text for zero metrics', () => {
    mockedHook.mockReturnValue({
      data: {
        earnedThisMonth: 0,
        profileViews: 0,
        profileViewsDelta: 0,
        pendingPayouts: 0,
        sparkline: [],
      },
      isLoading: false,
    });

    const { getAllByText, getByText } = render(<ByTheNumbersArtist />);
    // Standalone "—": earnings (no ₹ prefix when zero) + profile views = 2.
    expect(getAllByText('—').length).toBeGreaterThanOrEqual(2);
    expect(getByText('NO EARNINGS YET')).toBeTruthy();
    expect(getByText('NO VIEWS YET')).toBeTruthy();
  });
});
