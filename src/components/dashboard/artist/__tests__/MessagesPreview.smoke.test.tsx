import React from 'react';
import { render } from '@testing-library/react-native';
import MessagesPreview from '../MessagesPreview';
import { useUnreadCount } from '@/hooks/useUnreadCount';

jest.mock('@/hooks/useUnreadCount', () => ({
  useUnreadCount: jest.fn(),
}));

// authStore access: MessagesPreview reads `user?._id` to pick the non-self
// participant. Mocking the zustand hook gives us a stable "self" id.
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: any) => any) =>
    selector({ user: { _id: 'self-id' } }),
}));

const makeThread = (overrides: Partial<any> = {}) => ({
  _id: overrides._id ?? 't1',
  participants: overrides.participants ?? [
    { _id: 'self-id', displayName: 'Me' },
    { _id: 'other-1', displayName: 'Alice Patel' },
  ],
  lastMessage: overrides.lastMessage ?? 'Hey, are you available next week?',
  lastMessageAt:
    overrides.lastMessageAt ?? new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  unreadCount: overrides.unreadCount ?? 0,
  ...overrides,
});

describe('MessagesPreview (smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders 2 mock threads with names and shows unread badge when totalUnread > 0', () => {
    (useUnreadCount as jest.Mock).mockReturnValue({
      totalUnread: 3,
      threads: [
        makeThread({
          _id: 't1',
          participants: [
            { _id: 'self-id', displayName: 'Me' },
            { _id: 'a', displayName: 'Alice Patel' },
          ],
        }),
        makeThread({
          _id: 't2',
          participants: [
            { _id: 'self-id', displayName: 'Me' },
            { _id: 'b', displayName: 'Ravi Kumar' },
          ],
        }),
      ],
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<MessagesPreview />);

    expect(getByText('Alice Patel')).toBeTruthy();
    expect(getByText('Ravi Kumar')).toBeTruthy();
    expect(getByText('3 unread')).toBeTruthy();
  });

  it('renders empty state when threads list is empty', () => {
    (useUnreadCount as jest.Mock).mockReturnValue({
      totalUnread: 0,
      threads: [],
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<MessagesPreview />);
    expect(getByText('No messages yet')).toBeTruthy();
    expect(
      getByText('Start a conversation from any profile or gig')
    ).toBeTruthy();
  });

  it('hides the unread badge when totalUnread === 0', () => {
    (useUnreadCount as jest.Mock).mockReturnValue({
      totalUnread: 0,
      threads: [
        makeThread({
          _id: 't1',
          participants: [
            { _id: 'self-id', displayName: 'Me' },
            { _id: 'c', displayName: 'Priya Shah' },
          ],
          unreadCount: 0,
        }),
      ],
      isLoading: false,
      error: null,
    });

    const { queryByText, getByText } = render(<MessagesPreview />);
    expect(getByText('Priya Shah')).toBeTruthy();
    expect(queryByText(/unread/i)).toBeNull();
  });
});
