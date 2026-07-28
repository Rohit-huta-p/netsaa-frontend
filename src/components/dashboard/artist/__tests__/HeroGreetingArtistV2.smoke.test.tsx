import React from 'react';
import { render } from '@testing-library/react-native';
import HeroGreetingArtistV2 from '../HeroGreetingArtistV2';

jest.mock('@/hooks/useHeroData', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useHeroData from '@/hooks/useHeroData';
const mockedUseHeroData = useHeroData as jest.MockedFunction<typeof useHeroData>;

describe('HeroGreetingArtistV2 (smoke)', () => {
  it('renders avatar, greeting + name when user data is present', () => {
    mockedUseHeroData.mockReturnValue({
      data: { displayName: 'Anjali Ramesh' },
      isLoading: false,
    } as any);

    const { getByText } = render(<HeroGreetingArtistV2 />);
    expect(getByText('Anjali')).toBeTruthy();
    // Greeting is time-of-day dependent — match any uppercase greeting word.
    expect(getByText(/GOOD MORNING|GOOD AFTERNOON|GOOD EVENING|TONIGHT|LATE NIGHT/)).toBeTruthy();
  });

  it('no longer renders a trust-tier tag beside the name (redesign removed it)', () => {
    mockedUseHeroData.mockReturnValue({
      data: { displayName: 'Anjali Ramesh', trustTier: 'rising', trustScore: 6.2 },
      isLoading: false,
    } as any);
    const { queryByText } = render(<HeroGreetingArtistV2 />);
    expect(queryByText(/RISING|TRUSTED|VERIFIED|NEW|TRUST/)).toBeNull();
  });

  it('renders skeleton while loading', () => {
    mockedUseHeroData.mockReturnValue({ data: undefined, isLoading: true } as any);
    const { queryByText } = render(<HeroGreetingArtistV2 />);
    expect(queryByText('Anjali')).toBeNull();
  });
});
