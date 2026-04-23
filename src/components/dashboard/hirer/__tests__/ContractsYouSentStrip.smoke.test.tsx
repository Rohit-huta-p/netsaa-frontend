import React from 'react';
import { render } from '@testing-library/react-native';

// Mutable mock state — each test sets this before rendering. This keeps a
// single React registry (vs jest.isolateModules, which reloads React and
// breaks hook dispatch with "Cannot read properties of null (reading
// 'useMemo')").
let mockHookReturn: any = { data: [], isLoading: false, error: null, refetch: jest.fn() };

jest.mock('@/hooks/useContractsHirer', () => ({
  __esModule: true,
  default: () => mockHookReturn,
}));

// Stub `Link` explicitly — SectionCard renders <Link href={seeAllHref}> and
// this jest-level mock overrides the global mock from jest-setup.ts.
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

import ContractsYouSentStrip from '../ContractsYouSentStrip';

describe('ContractsYouSentStrip', () => {
  it('renders null when total=0', () => {
    mockHookReturn = { data: [], isLoading: false, error: null, refetch: jest.fn() };
    const { toJSON } = render(<ContractsYouSentStrip />);
    expect(toJSON()).toBeNull();
  });

  it('renders 3 stats with counts', () => {
    mockHookReturn = {
      data: [
        { status: 'pending_artist_signature' },
        { status: 'active' },
        { status: 'active' },
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    };
    const { getByText } = render(<ContractsYouSentStrip />);
    expect(getByText('Awaiting')).toBeTruthy();
    expect(getByText('Active')).toBeTruthy();
    expect(getByText('Total')).toBeTruthy();
  });
});
