import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NotificationCard } from '../NotificationCard';

const mockMarkAsRead = jest.fn();
const mockNavigate = jest.fn();
const mockAccept = jest.fn().mockResolvedValue({});
const mockReject = jest.fn().mockResolvedValue({});

// gesture-handler ships untransformed TurboModule specs — stub Swipeable to render children.
jest.mock('react-native-gesture-handler', () => ({
  Swipeable: ({ children }: any) => children,
}));
jest.mock('@/stores/notificationsStore', () => ({
  useNotificationsStore: () => ({ markAsRead: mockMarkAsRead }),
}));
jest.mock('@/services/deepLinkService', () => ({
  deepLinkService: { navigateToRoute: (r: string) => mockNavigate(r) },
}));
jest.mock('@/services/connectionService', () => ({
  __esModule: true,
  default: {
    acceptConnectionRequest: (id: string) => mockAccept(id),
    rejectConnectionRequest: (id: string) => mockReject(id),
  },
}));

const base = {
  _id: 'n1', userId: 'u1', type: 'gig', subtype: 'gig.application.received',
  title: 'Priya Menon applied to your gig', message: 'Kathak lead · Sangam Festival',
  isRead: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const mk = (over: any = {}) => ({ ...base, ...over } as any);

beforeEach(() => jest.clearAllMocks());

test('renders title, body and stamp', () => {
  const { getByText } = render(<NotificationCard notification={mk()} />);
  expect(getByText('Priya Menon applied to your gig')).toBeTruthy();
  expect(getByText('Kathak lead · Sangam Festival')).toBeTruthy();
});

test('unread renders the orange left-rail, read does not', () => {
  const { getByTestId } = render(<NotificationCard notification={mk()} />);
  expect(getByTestId('unread-rail')).toBeTruthy();
  const { queryByTestId } = render(<NotificationCard notification={mk({ isRead: true })} />);
  expect(queryByTestId('unread-rail')).toBeNull();
});

test('hired subtype shows the state eyebrow', () => {
  const { getByText } = render(<NotificationCard notification={mk({ subtype: 'gig.application.hired' })} />);
  expect(getByText('Hired')).toBeTruthy();
});

test('tap marks read and deep-links', () => {
  const { getByTestId } = render(<NotificationCard notification={mk({ data: { route: '/gigs/g1' } })} />);
  fireEvent.press(getByTestId('notif-row'));
  expect(mockMarkAsRead).toHaveBeenCalledWith('n1');
  expect(mockNavigate).toHaveBeenCalledWith('/gigs/g1');
});

test('connection request shows inline actions only with a connectionId', () => {
  const withId = render(<NotificationCard notification={mk({
    type: 'connection', subtype: 'connection.request', title: 'Meera Nair wants to connect',
    data: { params: { connectionId: 'c1' } },
  })} />);
  fireEvent.press(withId.getByText('Accept'));
  expect(mockAccept).toHaveBeenCalledWith('c1');

  const withoutId = render(<NotificationCard notification={mk({
    type: 'connection', subtype: 'connection.request', title: 'Meera Nair wants to connect',
  })} />);
  expect(withoutId.queryByText('Accept')).toBeNull();
});
