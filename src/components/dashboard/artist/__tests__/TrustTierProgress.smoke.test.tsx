import React from 'react';
import { render } from '@testing-library/react-native';

import TrustTierProgress from '../TrustTierProgress';

jest.mock('@/hooks/useHeroData', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useHeroData from '@/hooks/useHeroData';

const mockHero = useHeroData as jest.MockedFunction<any>;

function setUser(user: any) {
  mockHero.mockReturnValue({
    data: user,
    isLoading: false,
    error: null,
  });
}

describe('TrustTierProgress (smoke)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the "Rising" tier for score 30', () => {
    setUser({ trustScore: 30 });
    const { getByText } = render(<TrustTierProgress />);
    expect(getByText('Rising')).toBeTruthy();
    // The "points to Trusted" copy should show — trusted floor is 50.
    expect(getByText(/20 points to Trusted/)).toBeTruthy();
    expect(getByText(/30/)).toBeTruthy();
    expect(getByText(/\/ 100/)).toBeTruthy();
  });

  it('renders top-tier copy at score 100', () => {
    setUser({ trustScore: 100 });
    const { getByText } = render(<TrustTierProgress />);
    expect(getByText('Verified')).toBeTruthy();
    expect(getByText(/top tier/)).toBeTruthy();
  });

  it('renders nothing while hero data is loading', () => {
    mockHero.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    const { queryByText } = render(<TrustTierProgress />);
    expect(queryByText(/New|Rising|Trusted|Verified/)).toBeNull();
  });
});
