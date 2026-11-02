import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RequestsList from '../RequestsList';

// Mock the data + mutation hooks so the test exercises the wiring, not the
// network. jest hoists these factories above the file, so the variables they
// reference must be `mock`-prefixed (babel-plugin-jest-hoist allowlist).
const mockApproveMutate = jest.fn();
const mockDeclineMutate = jest.fn();
let mockRosterData: any;

jest.mock('@/hooks/useEvents', () => ({
  useEvent: () => ({ data: { _id: 'evt1', spots: [{ _id: 's1', name: 'VIP' }] } }),
  eventKeys: { detail: (id: string) => ['events', 'detail', id] },
}));

jest.mock('@/hooks/useEventRoster', () => ({
  useEventRoster: () => ({ data: mockRosterData, isLoading: false, refetch: jest.fn(), isRefetching: false }),
}));

jest.mock('@/hooks/useEventRequests', () => ({
  useApproveRequest: () => ({ mutate: mockApproveMutate }),
  useDeclineRequest: () => ({ mutate: mockDeclineMutate }),
}));

const pendingRow = {
  _id: 'req1', userId: 'u1', name: 'Saswati Sen', phone: '+91 98765 43210',
  seats: 2, status: 'pending', spotId: 's1', registeredAt: new Date().toISOString(),
  answers: [{ label: 'Years dancing', type: 'text', value: '6' }],
};
const approvedRow = {
  _id: 'app1', userId: 'u2', name: 'Rahul Dev', seats: 1, status: 'approved',
  registeredAt: new Date().toISOString(), answers: [],
};

function makeRoster(overrides: any = {}) {
  return {
    confirmed: [], requests: [], approved: [], waitlist: [], cancelled: [], declined: [],
    counts: { confirmed: 0, requests: 0, approved: 0, waitlist: 0, cancelled: 0, declined: 0 },
    ...overrides,
  };
}

beforeEach(() => {
  mockApproveMutate.mockClear();
  mockDeclineMutate.mockClear();
});

describe('RequestsList', () => {
  it('renders a pending request with its meta, answer, and actions', () => {
    mockRosterData = makeRoster({ requests: [pendingRow], counts: { requests: 1, confirmed: 0, approved: 0, waitlist: 0, cancelled: 0, declined: 0 } });
    const { getByText, getByLabelText } = render(<RequestsList eventId="evt1" />);
    expect(getByText('Saswati Sen')).toBeTruthy();
    expect(getByText(/2 seats/)).toBeTruthy();
    expect(getByText(/VIP/)).toBeTruthy();
    expect(getByText('Years dancing — 6')).toBeTruthy();
    expect(getByLabelText('Approve Saswati Sen')).toBeTruthy();
    expect(getByLabelText('Decline Saswati Sen')).toBeTruthy();
  });

  it('Approve fires the approve mutation with the registration id', () => {
    mockRosterData = makeRoster({ requests: [pendingRow], counts: { requests: 1, confirmed: 0, approved: 0, waitlist: 0, cancelled: 0, declined: 0 } });
    const { getByLabelText } = render(<RequestsList eventId="evt1" />);
    fireEvent.press(getByLabelText('Approve Saswati Sen'));
    expect(mockApproveMutate).toHaveBeenCalledTimes(1);
    expect(mockApproveMutate.mock.calls[0][0]).toBe('req1');
  });

  it('Decline expands a reason row, then confirming fires the decline mutation', () => {
    mockRosterData = makeRoster({ requests: [pendingRow], counts: { requests: 1, confirmed: 0, approved: 0, waitlist: 0, cancelled: 0, declined: 0 } });
    const { getByLabelText } = render(<RequestsList eventId="evt1" />);
    fireEvent.press(getByLabelText('Decline Saswati Sen'));
    // reason row now present
    fireEvent.press(getByLabelText('Confirm decline Saswati Sen'));
    expect(mockDeclineMutate).toHaveBeenCalledTimes(1);
    expect(mockDeclineMutate.mock.calls[0][0]).toEqual({ registrationId: 'req1', reason: undefined });
  });

  it('shows the approved (awaiting-payment) bucket read-only — no Approve action', () => {
    mockRosterData = makeRoster({ approved: [approvedRow], counts: { approved: 1, requests: 0, confirmed: 0, waitlist: 0, cancelled: 0, declined: 0 } });
    const { getByText, queryByLabelText } = render(<RequestsList eventId="evt1" />);
    expect(getByText('Rahul Dev')).toBeTruthy();
    expect(getByText('Awaiting payment')).toBeTruthy(); // section explainer
    expect(queryByLabelText('Approve Rahul Dev')).toBeNull();
  });

  it('shows the empty state when there are no requests', () => {
    mockRosterData = makeRoster();
    const { getByText } = render(<RequestsList eventId="evt1" />);
    expect(getByText("You're all caught up")).toBeTruthy();
  });
});
