import React from 'react';
import { render } from '@testing-library/react-native';
import HeroGreeting from '../HeroGreeting';

describe('HeroGreeting (smoke)', () => {
  it('renders "Namaste, {firstName}." with minimal user data', () => {
    const { getByText } = render(
      <HeroGreeting user={{ displayName: 'Asha Menon' }} />
    );
    expect(getByText('Namaste, Asha.')).toBeTruthy();
  });

  it('hides rating row when reviewCount is 0', () => {
    const { queryByText } = render(
      <HeroGreeting
        user={{
          displayName: 'Asha Menon',
          cached: { averageRating: 0, totalReviews: 0 },
        }}
      />
    );
    // No rating text / reviews copy should render.
    expect(queryByText(/reviews?/i)).toBeNull();
    expect(queryByText(/★/)).toBeNull();
  });

  it('renders rating row when reviewCount > 0', () => {
    const { getByText } = render(
      <HeroGreeting
        user={{
          displayName: 'Asha',
          cached: { averageRating: 4.8, totalReviews: 12 },
        }}
      />
    );
    expect(getByText(/4\.8/)).toBeTruthy();
    expect(getByText(/12/)).toBeTruthy();
  });

  it('renders trust badge with correct tier label', () => {
    const { getByText, getByLabelText } = render(
      <HeroGreeting
        user={{ displayName: 'Asha', trustTier: 'rising', trustScore: 30 }}
      />
    );
    expect(getByText('Rising')).toBeTruthy();
    expect(getByLabelText('Trust tier Rising')).toBeTruthy();
  });

  it('hides trust badge when tier is unrecognized', () => {
    const { queryByText } = render(
      <HeroGreeting user={{ displayName: 'Asha', trustTier: 'unknown' }} />
    );
    expect(queryByText('Rising')).toBeNull();
    expect(queryByText('Trusted')).toBeNull();
    expect(queryByText('Verified')).toBeNull();
    expect(queryByText('New')).toBeNull();
  });

  it('renders skeleton chrome when isLoading', () => {
    const { getByLabelText } = render(<HeroGreeting user={null} isLoading />);
    expect(getByLabelText('Loading')).toBeTruthy();
  });

  it('renders "Welcome" placeholder when displayName is missing', () => {
    const { getByText } = render(<HeroGreeting user={{}} />);
    expect(getByText('Welcome')).toBeTruthy();
  });
});
