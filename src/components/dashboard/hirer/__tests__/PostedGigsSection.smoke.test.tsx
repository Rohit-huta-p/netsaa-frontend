import React from 'react';
import { render } from '@testing-library/react-native';
import PostedGigsSection from '../PostedGigsSection';

jest.mock('@/hooks/usePostedGigs', () => ({
  usePostedGigs: () => ({
    data: { gigs: [
      { _id: 'g1', title: 'Wedding dancer', status: 'published', stats: { applicationsCount: 5, viewsCount: 42 } },
    ]},
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));
// The jest-level mock here overrides the global mock from jest-setup.ts, so
// we also need to stub `Link` since SectionCard (our parent chrome) renders
// <Link href={seeAllHref}>.
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

describe('PostedGigsSection', () => {
  it('renders', () => {
    const { getByText } = render(<PostedGigsSection />);
    expect(getByText('Your posts')).toBeTruthy();
    expect(getByText('Wedding dancer')).toBeTruthy();
  });
});
