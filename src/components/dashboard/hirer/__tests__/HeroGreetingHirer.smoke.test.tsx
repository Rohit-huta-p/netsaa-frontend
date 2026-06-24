import React from 'react';
import { render } from '@testing-library/react-native';
import HeroGreetingHirer from '../HeroGreetingHirer';

jest.mock('@/hooks/useHeroDataHirer', () => ({
  __esModule: true,
  default: () => ({
    user: { displayName: 'Sharma' },
    organizer: {
      organizerStats: { averageRating: 4.7, totalReviews: 12 },
      verification: { verificationLevel: 'business' },
    },
    isLoading: false,
    error: null,
  }),
}));

describe('HeroGreetingHirer', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<HeroGreetingHirer />);
    expect(getByText(/Swaagat, Sharma/)).toBeTruthy();
  });
});
