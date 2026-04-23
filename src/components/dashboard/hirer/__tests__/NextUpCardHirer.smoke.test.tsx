import React from 'react';
import { render } from '@testing-library/react-native';

// Per Task 15/16 pattern: single top-level jest.mock with jest.fn so each
// test can reassign mock return values before render(). `jest.isolateModules
// + jest.doMock` (the original plan shape) reloads the React registry and
// breaks hook dispatch with "Cannot read properties of null (reading
// 'useMemo')".
jest.mock('@/hooks/useContractsHirer', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('@/hooks/useApplicantsInbox', () => ({
  useApplicantsInbox: jest.fn(),
}));

// Stub `Link` + `useRouter` from expo-router — this jest-level mock
// overrides the global mock from jest-setup.ts, so we restate both here.
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

import useContractsHirer from '@/hooks/useContractsHirer';
import { useApplicantsInbox } from '@/hooks/useApplicantsInbox';
import NextUpCardHirer from '../NextUpCardHirer';

describe('NextUpCardHirer', () => {
  it('renders null when no contract and no applicant', () => {
    (useContractsHirer as jest.Mock).mockReturnValue({ data: [] });
    (useApplicantsInbox as jest.Mock).mockReturnValue({ data: { applicants: [] } });
    const { toJSON } = render(<NextUpCardHirer />);
    expect(toJSON()).toBeNull();
  });

  it('prefers contract-awaiting over applicant', () => {
    (useContractsHirer as jest.Mock).mockReturnValue({
      data: [{ _id: 'c1', status: 'pending_artist_signature', gigTitle: 'Wedding dancer' }],
    });
    (useApplicantsInbox as jest.Mock).mockReturnValue({
      data: {
        applicants: [
          { _id: 'a1', gigId: 'g1', gigTitle: 'Other gig', artistSnapshot: { displayName: 'Priya' } },
        ],
      },
    });
    const { getByText } = render(<NextUpCardHirer />);
    expect(getByText(/Contract awaiting signature/)).toBeTruthy();
  });

  it('falls through to applicant when no contract awaits', () => {
    (useContractsHirer as jest.Mock).mockReturnValue({ data: [] });
    (useApplicantsInbox as jest.Mock).mockReturnValue({
      data: {
        applicants: [
          { _id: 'a1', gigId: 'g1', gigTitle: 'Wedding dancer', artistSnapshot: { displayName: 'Priya' } },
        ],
      },
    });
    const { getByText } = render(<NextUpCardHirer />);
    expect(getByText(/New applicant to review/)).toBeTruthy();
  });
});
