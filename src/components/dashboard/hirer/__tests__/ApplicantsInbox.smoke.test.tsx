import React from 'react';
import { render } from '@testing-library/react-native';
import ApplicantsInbox from '../ApplicantsInbox';

jest.mock('@/hooks/useApplicantsInbox', () => ({
  useApplicantsInbox: () => ({
    data: {
      applicants: [
        {
          _id: 'a1',
          gigId: 'g1',
          gigTitle: 'Wedding dancer',
          artistSnapshot: { displayName: 'Priya Sharma' },
          status: 'applied',
          appliedAt: '2026-04-20T10:00:00Z',
        },
      ],
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

// The jest-level mock here overrides the global mock from jest-setup.ts, so
// we also need to stub `Link` since SectionCard (our parent chrome) renders
// <Link href={seeAllHref}>.
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  Link: 'Link',
}));

describe('ApplicantsInbox', () => {
  it('renders with a mocked applicant', () => {
    const { getByText } = render(<ApplicantsInbox />);
    expect(getByText('Applicants')).toBeTruthy();
    expect(getByText('Priya Sharma')).toBeTruthy();
  });
});
