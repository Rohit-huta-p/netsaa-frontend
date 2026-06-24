import React from 'react';
import { render } from '@testing-library/react-native';
import FloatingInboxFab from '../FloatingInboxFab';

jest.mock('@/hooks/useUnreadCount', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useUnreadCount from '@/hooks/useUnreadCount';
const mockedHook = useUnreadCount as jest.MockedFunction<typeof useUnreadCount>;

describe('FloatingInboxFab (smoke)', () => {
  it('renders badge when there are unread messages', () => {
    mockedHook.mockReturnValue({
      totalUnread: 3,
      threads: [],
      isLoading: false,
      error: null,
    } as any);

    const { getByText, getByLabelText } = render(<FloatingInboxFab />);
    expect(getByText('3')).toBeTruthy();
    expect(getByLabelText(/Open messages, 3 unread/i)).toBeTruthy();
  });

  it('hides badge when totalUnread is 0', () => {
    mockedHook.mockReturnValue({
      totalUnread: 0,
      threads: [],
      isLoading: false,
      error: null,
    } as any);

    const { queryByText, getByLabelText } = render(<FloatingInboxFab />);
    expect(queryByText('3')).toBeNull();
    expect(getByLabelText('Open messages')).toBeTruthy();
  });

  it('clamps 100+ unread to "99+"', () => {
    mockedHook.mockReturnValue({
      totalUnread: 144,
      threads: [],
      isLoading: false,
      error: null,
    } as any);

    const { getByText } = render(<FloatingInboxFab />);
    expect(getByText('99+')).toBeTruthy();
  });
});
